import os
import uuid

from flask import Blueprint, request, jsonify

from db import get_db
from auth import current_user_id, login_required_api
import config

bp = Blueprint("showcase", __name__, url_prefix="/api/showcase")

VIDEO_EXTENSIONS = {"mp4", "webm", "mov"}


def _allowed(filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in config.ALLOWED_MEDIA_EXTENSIONS, ext


@bp.get("")
def list_posts():
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT s.id, s.user_id, s.media_url, s.media_type, s.description, s.created_at, u.name
               FROM showcase_posts s JOIN users u ON u.id = s.user_id
               ORDER BY s.created_at DESC"""
        )
        posts = cursor.fetchall()
    return jsonify(posts)


@bp.post("")
@login_required_api
def create_post():
    user_id = current_user_id()
    description = (request.form.get("description") or "").strip()
    file = request.files.get("media")

    if not file or file.filename == "":
        return jsonify({"error": "a media file is required"}), 400

    ok, ext = _allowed(file.filename)
    if not ok:
        return jsonify({"error": f"unsupported file type .{ext}"}), 400

    os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    file.save(os.path.join(config.UPLOAD_FOLDER, stored_name))
    media_url = f"/static/uploads/{stored_name}"
    media_type = "video" if ext in VIDEO_EXTENSIONS else "image"

    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            """INSERT INTO showcase_posts (user_id, media_url, media_type, description)
               VALUES (%s, %s, %s, %s)""",
            (user_id, media_url, media_type, description),
        )
        post_id = cursor.lastrowid

    return jsonify({"id": post_id, "media_url": media_url, "media_type": media_type})


@bp.delete("/<int:post_id>")
@login_required_api
def delete_post(post_id):
    user_id = current_user_id()
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("SELECT user_id, media_url FROM showcase_posts WHERE id = %s", (post_id,))
        post = cursor.fetchone()
        if not post:
            return jsonify({"error": "Post not found."}), 404
        if post["user_id"] != user_id:
            return jsonify({"error": "You can only delete your own posts."}), 403

        cursor.execute("DELETE FROM showcase_posts WHERE id = %s", (post_id,))

    if post["media_url"].startswith("/static/uploads/"):
        file_path = os.path.join(config.UPLOAD_FOLDER, os.path.basename(post["media_url"]))
        if os.path.exists(file_path):
            os.remove(file_path)

    return jsonify({"ok": True})
