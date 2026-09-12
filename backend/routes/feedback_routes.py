from flask import Blueprint, request, jsonify

from db import get_db
from auth import current_user_id, login_required_api

bp = Blueprint("feedback", __name__, url_prefix="/api/feedback")


@bp.post("")
@login_required_api
def create_feedback():
    me_id = current_user_id()
    data = request.get_json(force=True)
    connection_id = data.get("connection_id")
    to_user_id = data.get("to_user_id")
    rating = data.get("rating")
    comment = (data.get("comment") or "").strip()

    if not all([connection_id, to_user_id, rating]):
        return jsonify({"error": "connection_id, to_user_id and rating are required"}), 400
    if not (1 <= int(rating) <= 5):
        return jsonify({"error": "rating must be between 1 and 5"}), 400

    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            "SELECT id FROM connections WHERE id=%s AND (user_a_id=%s OR user_b_id=%s) AND status='accepted'",
            (connection_id, me_id, me_id),
        )
        if not cursor.fetchone():
            return jsonify({"error": "Not your connection."}), 403

        cursor.execute(
            """INSERT INTO feedback (connection_id, from_user_id, to_user_id, rating, comment)
               VALUES (%s, %s, %s, %s, %s)""",
            (connection_id, me_id, to_user_id, rating, comment),
        )
    return jsonify({"id": cursor.lastrowid})


@bp.get("/<int:user_id>")
def list_feedback(user_id):
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT f.rating, f.comment, f.created_at, u.name AS from_name
               FROM feedback f JOIN users u ON u.id = f.from_user_id
               WHERE f.to_user_id = %s ORDER BY f.created_at DESC""",
            (user_id,),
        )
        rows = cursor.fetchall()
        average = round(sum(r["rating"] for r in rows) / len(rows), 1) if rows else None

    return jsonify({"average": average, "reviews": rows})
