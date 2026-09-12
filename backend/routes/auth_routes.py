import re

from flask import Blueprint, request, jsonify, session

from db import get_db
from auth import hash_password, verify_password, current_user, current_user_id, login_required_api

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@bp.post("/register")
def register():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required."}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"error": "That doesn't look like a valid email."}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400

    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"error": "An account with that email already exists."}), 409

        cursor.execute(
            "INSERT INTO users (name, email, password_hash, last_seen) VALUES (%s, %s, %s, NOW())",
            (name, email, hash_password(password)),
        )
        user_id = cursor.lastrowid

    session.clear()
    session["user_id"] = user_id
    return jsonify({"id": user_id, "name": name, "email": email})


@bp.post("/login")
def login():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            "SELECT id, name, password_hash FROM users WHERE email = %s", (email,)
        )
        user = cursor.fetchone()

    if not user or not user["password_hash"] or not verify_password(user["password_hash"], password):
        return jsonify({"error": "Incorrect email or password."}), 401

    with db.cursor() as cursor:
        cursor.execute("UPDATE users SET last_seen=NOW() WHERE id=%s", (user["id"],))

    session.clear()
    session["user_id"] = user["id"]
    return jsonify({"id": user["id"], "name": user["name"]})


@bp.post("/logout")
def logout():
    user_id = current_user_id()
    if user_id:
        db = get_db()
        with db.cursor() as cursor:
            cursor.execute("UPDATE users SET last_seen=NULL WHERE id=%s", (user_id,))
    session.clear()
    return jsonify({"ok": True})


@bp.get("/me")
def me():
    user = current_user()
    if not user:
        return jsonify({"error": "Not logged in."}), 401
    return jsonify(user)


@bp.post("/heartbeat")
@login_required_api
def heartbeat():
    """Called periodically by any open, logged-in page to mark the user as
    online. Being briefly idle/backgrounded should NOT flip someone offline —
    only closing the tab/window or logging out should (see /offline)."""
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("UPDATE users SET last_seen=NOW() WHERE id=%s", (current_user_id(),))
    return jsonify({"ok": True})


@bp.post("/offline")
def go_offline():
    """Sent via navigator.sendBeacon when the tab/window is actually closed
    or navigated away from. No login_required_api here — sendBeacon can't
    reliably read a JSON error response anyway, and a logged-out request is
    simply a no-op."""
    user_id = current_user_id()
    if user_id:
        db = get_db()
        with db.cursor() as cursor:
            cursor.execute("UPDATE users SET last_seen=NULL WHERE id=%s", (user_id,))
    return jsonify({"ok": True})


@bp.post("/change-password")
@login_required_api
def change_password():
    data = request.get_json(force=True)
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters."}), 400

    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("SELECT password_hash FROM users WHERE id = %s", (current_user_id(),))
        user = cursor.fetchone()
        if not user["password_hash"] or not verify_password(user["password_hash"], current_password):
            return jsonify({"error": "Current password is incorrect."}), 401

        cursor.execute(
            "UPDATE users SET password_hash=%s WHERE id=%s",
            (hash_password(new_password), current_user_id()),
        )
    return jsonify({"ok": True})
