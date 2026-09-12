from flask import Blueprint, request, jsonify

from db import get_db
from matching import rank_matches
from auth import current_user_id, login_required_api
from categories import SKILL_CATEGORIES as CATEGORIES

bp = Blueprint("discover", __name__, url_prefix="/api/discover")


def _load_users_with_skills():
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT id, name, bio, avatar_url, experience_level, availability,
                      interests, learning_preference FROM users"""
        )
        users = cursor.fetchall()
        cursor.execute("SELECT user_id, skill_name, skill_type, category FROM skills")
        skill_rows = cursor.fetchall()

    skills_by_user = {}
    for row in skill_rows:
        entry = skills_by_user.setdefault(row["user_id"], {"teach": [], "learn": [], "categories": set()})
        entry[row["skill_type"]].append({"name": row["skill_name"], "category": row["category"]})
        entry["categories"].add(row["category"])
    return users, skills_by_user


def _matches_filter(entry, search, category):
    """category filters on the real per-skill category column; the free-text
    search box still does a plain substring match over skill names."""
    if category and category in CATEGORIES:
        return category in entry["categories"]
    if search:
        names = [s["name"] for s in entry["teach"] + entry["learn"]]
        return search in " ".join(names).lower()
    return True


@bp.get("")
@login_required_api
def discover():
    me_id = current_user_id()
    search = (request.args.get("q") or "").strip().lower()
    category = request.args.get("category")
    users, skills_by_user = _load_users_with_skills()

    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            "SELECT id, user_a_id, user_b_id, status FROM connections WHERE user_a_id=%s OR user_b_id=%s",
            (me_id, me_id),
        )
        my_connections = cursor.fetchall()

    relation_by_user = {}
    for c in my_connections:
        other_id = c["user_b_id"] if c["user_a_id"] == me_id else c["user_a_id"]
        if c["status"] == "accepted":
            status = "accepted"
        else:
            status = "pending_sent" if c["user_a_id"] == me_id else "pending_received"
        relation_by_user[other_id] = {"connection_id": c["id"], "connection_status": status}

    candidates = []
    me_skills = skills_by_user.get(me_id, {"teach": [], "learn": [], "categories": set()})
    for user in users:
        if user["id"] == me_id:
            continue
        relation = relation_by_user.get(user["id"], {"connection_id": None, "connection_status": None})
        if relation["connection_status"] == "accepted":
            continue  # already connected — not a prospective match anymore
        entry = skills_by_user.get(user["id"], {"teach": [], "learn": [], "categories": set()})
        if not _matches_filter(entry, search, category):
            continue
        candidates.append({**user, "teach": entry["teach"], "learn": entry["learn"], **relation})

    ranked = rank_matches(me_skills, candidates)
    return jsonify(ranked)


@bp.get("/public")
def discover_public():
    """No login required — used by the logged-out home page. Ranked by
    popularity (accepted connection count), not match score, since we
    don't know the visitor's own skills yet."""
    search = (request.args.get("q") or "").strip().lower()
    category = request.args.get("category")
    users, skills_by_user = _load_users_with_skills()

    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("SELECT user_a_id, user_b_id FROM connections WHERE status = 'accepted'")
        accepted = cursor.fetchall()

    connection_counts = {}
    for row in accepted:
        connection_counts[row["user_a_id"]] = connection_counts.get(row["user_a_id"], 0) + 1
        connection_counts[row["user_b_id"]] = connection_counts.get(row["user_b_id"], 0) + 1

    results = []
    for user in users:
        entry = skills_by_user.get(user["id"], {"teach": [], "learn": [], "categories": set()})
        if not _matches_filter(entry, search, category):
            continue
        results.append({
            **user,
            "teach": entry["teach"],
            "learn": entry["learn"],
            "connection_count": connection_counts.get(user["id"], 0),
        })

    results.sort(key=lambda u: u["connection_count"], reverse=True)
    return jsonify(results[:12])
