# SkillSwap

A platform for exchanging skills: post what you can teach and what you want to
learn, and the matching engine finds people who complement you.

## Project structure

```
design_championship/
├── backend/            Flask app + MySQL access + matching engine
│   ├── app.py           entry point — run this
│   ├── config.py        DB connection settings (env vars, see below)
│   ├── db.py            MySQL connection helper
│   ├── auth.py          password hashing + session helpers
│   ├── categories.py    the fixed set of skill categories (shared by profile + discover)
│   ├── matching.py      the compatibility-scoring algorithm
│   ├── schema.sql       run once to create the database tables (no data)
│   ├── seed_data.sql    run once for 13 demo profiles + skills (optional but recommended)
│   ├── requirements.txt
│   └── routes/          one file per feature area (auth, profile, discover, connections+chat, feedback, showcase)
├── frontend/
│   ├── templates/        Jinja HTML pages, rendered by Flask
│   └── static/           css/, js/, img/seed/ (demo photos), uploads/ (photos & videos people post)
└── docs/                 AI usage log + documentation placeholders for submission
```

## Setup

**1. Install MySQL** (not yet installed on this machine). On macOS:
```
brew install mysql
brew services start mysql
```

**2. Create the database, tables, and demo data:**
```
mysql -u root -e "CREATE DATABASE skillswap;"
mysql -u root skillswap < backend/schema.sql
mysql -u root skillswap < backend/seed_data.sql   # optional: 13 demo profiles, password "password123"
```

**3. Python environment:**
```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**4. Configure the database connection** if your MySQL user/password differ from the defaults (root, no password). Set environment variables before running:
```
export SKILLSWAP_DB_USER=root
export SKILLSWAP_DB_PASSWORD=yourpassword
```

**5. Run the app:**
```
python app.py
```
Then open http://localhost:5001

## How it works

1. **Home** (logged out) — a public preview of popular profiles with live search and category filters; clicking Connect prompts you to sign up or log in first.
2. **Sign up / Log in** — real accounts: passwords are hashed (Werkzeug scrypt) and never stored in plain text; identity is tracked server-side via a signed session cookie, not a client-supplied id.
3. **Profile** — add skills one at a time with a category (Technology, Art, Music, Languages, Sports, Academics, Cooking, Business, Wellness, Crafts, Writing, Games, or Other), suggested automatically from the skill name but always editable.
4. **Discover** — every other profile is scored against yours (see `backend/matching.py`) and shown with a match percentage, the specific reasons for it, and category filter pills backed by that same category data.
5. **Connect** — sends a request; the other person must **Accept** or **Reject** it from their Connections page before a chat opens.
6. **Connections** — see each connection's teach/learn skills and whether they're currently online (a heartbeat-based presence check, not just a login flag), and chat via the floating 💬 widget available on every page (live-updating, with photo/video attachments and a lightbox viewer).
7. **Dashboard** — a personalized summary of your skills, top matches, and connection count.
8. **Showcase** — post a photo or video of your skill in action, shown with your name and a description; delete your own posts anytime.
9. **Settings** — change your password.

## Attribution

- The 13 seed demo profiles' photos (`frontend/static/img/seed/`) were sourced from [pravatar.cc](https://pravatar.cc) and downloaded locally. Real accounts use a photo you upload yourself, or an original default silhouette icon (`frontend/static/img/default-avatar.svg`, hand-authored for this project).
- Built with Flask (Python) and MySQL.
