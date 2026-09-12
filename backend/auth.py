"""Real authentication: salted password hashing (Werkzeug's scrypt) and
server-side sessions. No user id is ever trusted from the client — every
route that needs "who is this" reads it from the signed session cookie.
"""

from functools import wraps

from flask import session, jsonify, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash

from db import get_db


def hash_password(plain_password):
    return generate_password_hash(plain_password)


def verify_password(password_hash, plain_password):
    return check_password_hash(password_hash, plain_password)


def current_user_id():
    return session.get("user_id")


def current_user():
    user_id = current_user_id()
    if not user_id:
        return None
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            "SELECT id, name, email, bio, avatar_url FROM users WHERE id = %s", (user_id,)
        )
        return cursor.fetchone()


def login_required_api(view):
    """For JSON API routes: 401 if not logged in."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not current_user_id():
            return jsonify({"error": "You must be logged in."}), 401
        return view(*args, **kwargs)
    return wrapped


def login_required_page(view):
    """For page routes: redirect to /login if not logged in."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not current_user_id():
            return redirect(url_for("login_page"))
        return view(*args, **kwargs)
    return wrapped
