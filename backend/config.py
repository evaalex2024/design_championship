import os

DB_HOST = os.environ.get("SKILLSWAP_DB_HOST", "localhost")
DB_USER = os.environ.get("SKILLSWAP_DB_USER", "root")
DB_PASSWORD = os.environ.get("SKILLSWAP_DB_PASSWORD", "")
DB_NAME = os.environ.get("SKILLSWAP_DB_NAME", "skillswap")
DB_PORT = int(os.environ.get("SKILLSWAP_DB_PORT", "3306"))

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "..", "frontend", "static", "uploads")
ALLOWED_MEDIA_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "mp4", "webm", "mov"}
