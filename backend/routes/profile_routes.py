import os
import uuid

from flask import Blueprint, request, jsonify

from db import get_db
from auth import current_user_id, login_required_api
import config
from categories import SKILL_CATEGORIES as VALID_CATEGORIES

bp = Blueprint("profile", __name__, url_prefix="/api/profile")


def _load_user(cursor, user_id):
    cursor.execute(
        """SELECT id, name, email, bio, avatar_url,
                  experience_level, availability, interests, learning_preference
           FROM users WHERE id = %s""",
        (user_id,),
    )
    user = cursor.fetchone()
    if not user:
        return None
    cursor.execute("SELECT skill_name, skill_type, category FROM skills WHERE user_id = %s", (user_id,))
    rows = cursor.fetchall()
    user["teach"] = [{"name": r["skill_name"], "category": r["category"]} for r in rows if r["skill_type"] == "teach"]
    user["learn"] = [{"name": r["skill_name"], "category": r["category"]} for r in rows if r["skill_type"] == "learn"]
    return user


@bp.get("")
@login_required_api
def get_my_profile():
    db = get_db()
    with db.cursor() as cursor:
        user = _load_user(cursor, current_user_id())
    return jsonify(user)


@bp.post("")
@login_required_api
def save_profile():
    data = request.get_json(force=True)
    bio = (data.get("bio") or "").strip()
    teach = data.get("teach") or []
    learn = data.get("learn") or []
    experience_level = (data.get("experience_level") or "").strip() or None
    availability = (data.get("availability") or "").strip() or None
    interests = (data.get("interests") or "").strip() or None
    learning_preference = (data.get("learning_preference") or "").strip() or None
    user_id = current_user_id()

    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            """UPDATE users SET bio=%s, experience_level=%s, availability=%s,
                                 interests=%s, learning_preference=%s WHERE id=%s""",
            (bio, experience_level, availability, interests, learning_preference, user_id),
        )
        cursor.execute("DELETE FROM skills WHERE user_id = %s", (user_id,))
        for skill in teach:
            name = (skill.get("name") or "").strip()
            if not name:
                continue
            category = skill.get("category") if skill.get("category") in VALID_CATEGORIES else "Other"
            cursor.execute(
                "INSERT INTO skills (user_id, skill_name, skill_type, category) VALUES (%s, %s, 'teach', %s)",
                (user_id, name, category),
            )
        for skill in learn:
            name = (skill.get("name") or "").strip()
            if not name:
                continue
            category = skill.get("category") if skill.get("category") in VALID_CATEGORIES else "Other"
            cursor.execute(
                "INSERT INTO skills (user_id, skill_name, skill_type, category) VALUES (%s, %s, 'learn', %s)",
                (user_id, name, category),
            )
        user = _load_user(cursor, user_id)

    return jsonify(user)


@bp.post("/photo")
@login_required_api
def upload_photo():
    user_id = current_user_id()
    file = request.files.get("photo")
    if not file or file.filename == "":
        return jsonify({"error": "a photo file is required"}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in {"png", "jpg", "jpeg", "gif", "webp"}:
        return jsonify({"error": f"unsupported image type .{ext}"}), 400

    os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    file.save(os.path.join(config.UPLOAD_FOLDER, stored_name))
    avatar_url = f"/static/uploads/{stored_name}"

    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("UPDATE users SET avatar_url=%s WHERE id=%s", (avatar_url, user_id))

    return jsonify({"avatar_url": avatar_url})
