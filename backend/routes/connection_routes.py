import os
import uuid

from flask import Blueprint, request, jsonify

from db import get_db
from auth import current_user_id, login_required_api
import config

bp = Blueprint("connections", __name__, url_prefix="/api/connections")

ATTACHMENT_VIDEO_EXTENSIONS = {"mp4", "webm", "mov"}


ONLINE_THRESHOLD_SECONDS = 90


def _is_member(cursor, connection_id, user_id):
    cursor.execute(
        "SELECT id FROM connections WHERE id=%s AND (user_a_id=%s OR user_b_id=%s)",
        (connection_id, user_id, user_id),
    )
    return cursor.fetchone() is not None


@bp.post("")
@login_required_api
def request_connection():
    data = request.get_json(force=True)
    other_id = data.get("other_user_id")
    me_id = current_user_id()
    if not other_id or int(other_id) == me_id:
        return jsonify({"error": "other_user_id is required"}), 400

    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT id, status FROM connections
               WHERE (user_a_id=%s AND user_b_id=%s) OR (user_a_id=%s AND user_b_id=%s)""",
            (me_id, other_id, other_id, me_id),
        )
        existing = cursor.fetchone()
        if existing:
            return jsonify({"id": existing["id"], "status": existing["status"], "already_exists": True})

        cursor.execute(
            "INSERT INTO connections (user_a_id, user_b_id, status) VALUES (%s, %s, 'pending')",
            (me_id, other_id),
        )
        return jsonify({"id": cursor.lastrowid, "status": "pending", "already_exists": False})


@bp.get("/pending")
@login_required_api
def list_pending():
    me_id = current_user_id()
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT c.id AS connection_id, u.id, u.name, u.avatar_url,
                      TIMESTAMPDIFF(SECOND, u.last_seen, NOW()) <= %s AS online
               FROM connections c JOIN users u ON u.id = c.user_a_id
               WHERE c.user_b_id = %s AND c.status = 'pending'""",
            (ONLINE_THRESHOLD_SECONDS, me_id),
        )
        rows = cursor.fetchall()
    return jsonify([
        {
            "connection_id": r["connection_id"],
            "from": {"id": r["id"], "name": r["name"], "avatar_url": r["avatar_url"], "online": bool(r["online"])},
        }
        for r in rows
    ])


@bp.post("/<int:connection_id>/accept")
@login_required_api
def accept_connection(connection_id):
    me_id = current_user_id()
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            "UPDATE connections SET status='accepted' WHERE id=%s AND user_b_id=%s AND status='pending'",
            (connection_id, me_id),
        )
        if cursor.rowcount == 0:
            return jsonify({"error": "Request not found."}), 404
    return jsonify({"ok": True})


@bp.post("/<int:connection_id>/reject")
@login_required_api
def reject_connection(connection_id):
    me_id = current_user_id()
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            "DELETE FROM connections WHERE id=%s AND user_b_id=%s AND status='pending'",
            (connection_id, me_id),
        )
        if cursor.rowcount == 0:
            return jsonify({"error": "Request not found."}), 404
    return jsonify({"ok": True})


@bp.get("")
@login_required_api
def list_connections():
    me_id = current_user_id()
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT c.id AS connection_id,
                      CASE WHEN c.user_a_id = %s THEN c.user_b_id ELSE c.user_a_id END AS other_id
               FROM connections c
               WHERE (c.user_a_id = %s OR c.user_b_id = %s) AND c.status = 'accepted'""",
            (me_id, me_id, me_id),
        )
        rows = cursor.fetchall()

        results = []
        for row in rows:
            cursor.execute(
                """SELECT id, name, avatar_url,
                          TIMESTAMPDIFF(SECOND, last_seen, NOW()) <= %s AS online
                   FROM users WHERE id = %s""",
                (ONLINE_THRESHOLD_SECONDS, row["other_id"]),
            )
            other = cursor.fetchone()
            if other:
                other["online"] = bool(other["online"])
                cursor.execute(
                    "SELECT skill_name, skill_type, category FROM skills WHERE user_id = %s",
                    (row["other_id"],),
                )
                skill_rows = cursor.fetchall()
                other["teach"] = [
                    {"name": s["skill_name"], "category": s["category"]}
                    for s in skill_rows if s["skill_type"] == "teach"
                ]
                other["learn"] = [
                    {"name": s["skill_name"], "category": s["category"]}
                    for s in skill_rows if s["skill_type"] == "learn"
                ]
            cursor.execute(
                """SELECT COUNT(*) AS n FROM messages
                   WHERE connection_id=%s AND sender_id != %s AND read_at IS NULL""",
                (row["connection_id"], me_id),
            )
            unread = cursor.fetchone()["n"]
            if other:
                results.append({
                    "connection_id": row["connection_id"],
                    "with": other,
                    "unread_count": unread,
                })

    return jsonify(results)


@bp.get("/<int:connection_id>/messages")
@login_required_api
def list_messages(connection_id):
    me_id = current_user_id()
    db = get_db()
    with db.cursor() as cursor:
        if not _is_member(cursor, connection_id, me_id):
            return jsonify({"error": "Not your conversation."}), 403
        cursor.execute(
            """SELECT id, sender_id, body, attachment_url, attachment_type, created_at
               FROM messages WHERE connection_id = %s ORDER BY created_at ASC""",
            (connection_id,),
        )
        messages = cursor.fetchall()
        cursor.execute(
            """UPDATE messages SET read_at = NOW()
               WHERE connection_id=%s AND sender_id != %s AND read_at IS NULL""",
            (connection_id, me_id),
        )
    return jsonify(messages)


@bp.post("/<int:connection_id>/messages")
@login_required_api
def send_message(connection_id):
    me_id = current_user_id()

    body = (request.form.get("body") or "").strip()
    file = request.files.get("attachment")

    attachment_url = None
    attachment_type = None
    if file and file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in config.ALLOWED_MEDIA_EXTENSIONS:
            return jsonify({"error": f"unsupported file type .{ext}"}), 400
        os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)
        stored_name = f"{uuid.uuid4().hex}.{ext}"
        file.save(os.path.join(config.UPLOAD_FOLDER, stored_name))
        attachment_url = f"/static/uploads/{stored_name}"
        attachment_type = "video" if ext in ATTACHMENT_VIDEO_EXTENSIONS else "image"

    if not body and not attachment_url:
        return jsonify({"error": "a message needs text or an attachment"}), 400

    db = get_db()
    with db.cursor() as cursor:
        if not _is_member(cursor, connection_id, me_id):
            return jsonify({"error": "Not your conversation."}), 403
        cursor.execute(
            """INSERT INTO messages (connection_id, sender_id, body, attachment_url, attachment_type)
               VALUES (%s, %s, %s, %s, %s)""",
            (connection_id, me_id, body, attachment_url, attachment_type),
        )
    return jsonify({"id": cursor.lastrowid, "attachment_url": attachment_url})
