"""Photo review for the Facebook photos in photos/facebook.

Run:  python tools/photo-review/server.py   then open http://127.0.0.1:5180

- Star:   saved in photos/facebook/stars.json
- Delete: the photo moves to photos/facebook/_deleted/ (nothing is erased; Restore brings it back)
"""
import json
import shutil
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

HERE = Path(__file__).resolve().parent
PHOTOS = HERE.parent.parent / "photos" / "facebook"
TRASH = PHOTOS / "_deleted"
STARS = PHOTOS / "stars.json"
EXTS = {".jpg", ".jpeg", ".png", ".webp"}
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5180


def load_stars():
    try:
        return set(json.loads(STARS.read_text(encoding="utf-8")))
    except (FileNotFoundError, ValueError):
        return set()


def save_stars(stars):
    STARS.write_text(json.dumps(sorted(stars), indent=2), encoding="utf-8")


def listing(base):
    if not base.exists():
        return []
    return sorted(
        p.relative_to(base).as_posix()
        for p in base.rglob("*")
        if p.is_file() and p.suffix.lower() in EXTS
        and (base == TRASH or TRASH not in p.parents)
    )


def safe(base, rel):
    """Resolve rel inside base, or None if it escapes or isn't a photo."""
    p = (base / rel).resolve()
    if base.resolve() not in p.parents or p.suffix.lower() not in EXTS:
        return None
    return p


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def send_json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path in ("/", "/index.html"):
            return self.send_file(HERE / "index.html", "text/html; charset=utf-8")
        if path == "/api/list":
            stars = load_stars()
            photos = [{"path": p, "cat": p.split("/")[0], "starred": p in stars} for p in listing(PHOTOS)]
            deleted = [{"path": p, "cat": p.split("/")[0], "starred": False} for p in listing(TRASH)]
            return self.send_json({"photos": photos, "deleted": deleted})
        for prefix, base in (("/photo/", PHOTOS), ("/trash/", TRASH)):
            if path.startswith(prefix):
                f = safe(base, path[len(prefix):])
                if f and f.is_file():
                    ctype = "image/png" if f.suffix == ".png" else "image/webp" if f.suffix == ".webp" else "image/jpeg"
                    return self.send_file(f, ctype)
        self.send_error(404)

    def send_file(self, f, ctype):
        data = f.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            data = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
            rel = str(data.get("path", ""))
        except ValueError:
            return self.send_json({"error": "bad request"}, 400)

        if path == "/api/star":
            if not (safe(PHOTOS, rel) and (PHOTOS / rel).is_file()):
                return self.send_json({"error": "not found"}, 404)
            stars = load_stars()
            (stars.add if data.get("starred") else stars.discard)(rel)
            save_stars(stars)
            return self.send_json({"ok": True})

        if path in ("/api/delete", "/api/restore"):
            src_base, dst_base = (PHOTOS, TRASH) if path == "/api/delete" else (TRASH, PHOTOS)
            src, dst = safe(src_base, rel), safe(dst_base, rel)
            if not (src and dst and src.is_file()) or (src_base == PHOTOS and TRASH in src.parents):
                return self.send_json({"error": "not found"}, 404)
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src), str(dst))
            if path == "/api/delete":
                stars = load_stars()
                if rel in stars:
                    stars.discard(rel)
                    save_stars(stars)
            return self.send_json({"ok": True})

        self.send_error(404)


if __name__ == "__main__":
    print(f"Photo review: http://127.0.0.1:{PORT}  ({len(listing(PHOTOS))} photos)")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
