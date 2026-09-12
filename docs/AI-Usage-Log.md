# AI Usage Log

Required format per the Design Championship guidelines: AI Tool Used /
Purpose of Use / Output Generated / Student Contribution or Modification.
Add a new row every time AI is used for something significant — don't
reconstruct this at the end from memory.

| AI Tool Used | Purpose of Use | Output Generated | Student Contribution / Modification |
|---|---|---|---|
| Claude (Claude Code) | Scaffold the initial frontend/backend folder structure, Flask routes, MySQL schema, and matching algorithm | `backend/` (app.py, config.py, db.py, matching.py, schema.sql, routes/*.py) and `frontend/` (templates, css, js) | _Fill in: what you changed, tested, or decided differently after reviewing this scaffold_ |
| Claude (Claude Code) | Replace client-only "fake" identity (no login) with real authentication: hashed passwords (Werkzeug scrypt), server-side sessions, and a proper connect-request/accept/reject flow instead of instant-connect. Also added Dashboard, Settings, category filters, mobile nav, and a simulated Call button. | `backend/auth.py`, `backend/routes/auth_routes.py`, `backend/migrations/001_add_auth.sql`, updated `profile_routes.py`/`discover_routes.py`/`connection_routes.py`/`feedback_routes.py`/`showcase_routes.py` to trust only the session (not client-supplied ids), new templates (`login.html`, `signup.html`, `dashboard.html`, `settings.html`), updated `base.html`/`style.css`/JS files | _Fill in: did you review why every route now reads the user id from `session` instead of the request body? That change also closed a real bug — previously anyone could pass any `user_id` in a request and act as someone else._ |

---

**Notes for filling this in as you go:**
- Log entries for anything AI generates or debugs from here on — new features, fixes, design changes.
- Be specific in the "Student Contribution" column: what did you personally decide, adjust, simplify, or reject? This is the column judges will actually look at.
- If a suggestion was rejected or changed after review, note that too — it demonstrates the "meaningful student decision-making" the guidelines require.
