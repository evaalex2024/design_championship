import os

from flask import Flask, render_template, redirect, url_for

from auth import current_user, current_user_id, login_required_page
from db import get_db
from matching import rank_matches

from routes.auth_routes import bp as auth_bp
from routes.profile_routes import bp as profile_bp
from routes.discover_routes import bp as discover_bp
from routes.connection_routes import bp as connections_bp
from routes.feedback_routes import bp as feedback_bp
from routes.showcase_routes import bp as showcase_bp

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

app = Flask(
    __name__,
    template_folder=os.path.join(FRONTEND_DIR, "templates"),
    static_folder=os.path.join(FRONTEND_DIR, "static"),
)

app.secret_key = os.environ.get("SKILLSWAP_SECRET_KEY", "dev-only-change-me")

app.register_blueprint(auth_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(discover_bp)
app.register_blueprint(connections_bp)
app.register_blueprint(feedback_bp)
app.register_blueprint(showcase_bp)


@app.context_processor
def inject_current_user():
    user = current_user()
    pending_count = 0
    unread_count = 0
    if user:
        db = get_db()
        with db.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) AS n FROM connections WHERE user_b_id = %s AND status = 'pending'",
                (user["id"],),
            )
            pending_count = cursor.fetchone()["n"]

            cursor.execute(
                """SELECT COUNT(*) AS n FROM messages m
                   JOIN connections c ON c.id = m.connection_id
                   WHERE (c.user_a_id = %s OR c.user_b_id = %s)
                     AND m.sender_id != %s AND m.read_at IS NULL""",
                (user["id"], user["id"], user["id"]),
            )
            unread_count = cursor.fetchone()["n"]

    return {
        "current_user": user,
        "pending_count": pending_count,
        "unread_count": unread_count,
        "notification_count": pending_count + unread_count,
    }


@app.get("/")
def home():
    if current_user_id():
        return redirect(url_for("dashboard_page"))
    return render_template("index.html")


@app.get("/signup")
def signup_page():
    if current_user_id():
        return redirect(url_for("dashboard_page"))
    return render_template("signup.html")


@app.get("/login")
def login_page():
    if current_user_id():
        return redirect(url_for("dashboard_page"))
    return render_template("login.html")


@app.get("/dashboard")
@login_required_page
def dashboard_page():
    me = current_user()
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("SELECT skill_name, skill_type FROM skills WHERE user_id = %s", (me["id"],))
        rows = cursor.fetchall()
        my_teach = [r["skill_name"] for r in rows if r["skill_type"] == "teach"]
        my_learn = [r["skill_name"] for r in rows if r["skill_type"] == "learn"]

        cursor.execute("SELECT id, name, bio, avatar_url FROM users WHERE id != %s", (me["id"],))
        others = cursor.fetchall()
        cursor.execute("SELECT user_id, skill_name, skill_type FROM skills")
        all_skill_rows = cursor.fetchall()

        cursor.execute(
            """SELECT CASE WHEN user_a_id = %s THEN user_b_id ELSE user_a_id END AS connection_count
               FROM connections WHERE (user_a_id = %s OR user_b_id = %s) AND status = 'accepted'""",
            (me["id"], me["id"], me["id"]),
        )
        connection_count = len(cursor.fetchall())

    skills_by_user = {}
    for row in all_skill_rows:
        entry = skills_by_user.setdefault(row["user_id"], {"teach": [], "learn": []})
        entry[row["skill_type"]].append(row["skill_name"])

    candidates = [
        {**u, **skills_by_user.get(u["id"], {"teach": [], "learn": []})} for u in others
    ]
    top_matches = rank_matches({"teach": my_teach, "learn": my_learn}, candidates)
    top_matches = [m for m in top_matches if m["match"]["percent"] > 0][:3]

    return render_template(
        "dashboard.html",
        my_teach=my_teach,
        my_learn=my_learn,
        top_matches=top_matches,
        connection_count=connection_count,
    )


@app.get("/profile")
@login_required_page
def profile_page():
    return render_template("profile.html")


@app.get("/discover")
@login_required_page
def discover_page():
    return render_template("discover.html")


@app.get("/connections")
@login_required_page
def connections_page():
    return render_template("connections.html")


@app.get("/showcase")
@login_required_page
def showcase_page():
    return render_template("showcase.html")


@app.get("/settings")
@login_required_page
def settings_page():
    return render_template("settings.html")


if __name__ == "__main__":
    app.run(debug=True, port=5001)
