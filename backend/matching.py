"""SkillSwap matching engine.

Scores how compatible two users are based on what one can teach that the
other wants to learn, and vice versa. Kept in its own module because it's
the one piece of real "intelligence" in the app, and it should be easy to
point to and explain on its own.
"""


def _normalize(skill_list):
    """Accepts plain name strings or {"name": ..., "category": ...} dicts,
    so callers can pass either shape without converting first."""
    names = (s["name"] if isinstance(s, dict) else s for s in skill_list)
    return {n.strip().lower() for n in names if n.strip()}


def score_match(my_teach, my_learn, their_teach, their_learn):
    """Return a compatibility score (0-100) and the reasons behind it.

    my_teach / my_learn / their_teach / their_learn are lists of skill
    name strings, or {"name": ..., "category": ...} dicts.
    """
    my_teach_set = _normalize(my_teach)
    my_learn_set = _normalize(my_learn)
    their_teach_set = _normalize(their_teach)
    their_learn_set = _normalize(their_learn)

    they_teach_what_i_want = my_learn_set & their_teach_set
    i_teach_what_they_want = my_teach_set & their_learn_set

    matched = len(they_teach_what_i_want) + len(i_teach_what_they_want)
    possible = len(my_learn_set) + len(my_teach_set)
    percent = round((matched / possible) * 100) if possible else 0
    percent = min(percent, 100)

    reasons = []
    for skill in sorted(they_teach_what_i_want):
        reasons.append(f"They can teach you {skill.title()}")
    for skill in sorted(i_teach_what_they_want):
        reasons.append(f"You can teach them {skill.title()}")

    if percent >= 70:
        label = "Excellent Match"
    elif percent >= 40:
        label = "Good Match"
    elif percent > 0:
        label = "Partial Match"
    else:
        label = "No Overlap Yet"

    return {"percent": percent, "label": label, "reasons": reasons}


def rank_matches(me, candidates):
    """me: {'teach': [...], 'learn': [...]}
    candidates: list of {'id', 'name', 'teach': [...], 'learn': [...], ...}

    Returns candidates sorted by match percent, each annotated with a
    'match' key holding the score_match() result.
    """
    results = []
    for candidate in candidates:
        match = score_match(me["teach"], me["learn"], candidate["teach"], candidate["learn"])
        results.append({**candidate, "match": match})
    results.sort(key=lambda c: c["match"]["percent"], reverse=True)
    return results
