INSERT INTO users (name, email, password_hash, bio, avatar_url) VALUES
    ('Riya', 'riya@skillswap.test', 'scrypt:32768:8:1$08MNvrOMXBoc8kcw$6fb785181591c6d7f79640f1b6255ec00a07a0499df44e81bbe9b0b3a6da5e466f7974276987052430433bf21823e061c36d5c3a58280d8ac36f6ac6f04f68c0', 'Web developer who loves teaching how the web works.', '/static/img/seed/riya.jpg'),
    ('Aarav', 'aarav@skillswap.test', 'scrypt:32768:8:1$08MNvrOMXBoc8kcw$6fb785181591c6d7f79640f1b6255ec00a07a0499df44e81bbe9b0b3a6da5e466f7974276987052430433bf21823e061c36d5c3a58280d8ac36f6ac6f04f68c0', 'Sketching and painting in my free time.', '/static/img/seed/aarav.jpg'),
    ('Kabir', 'kabir@skillswap.test', 'scrypt:32768:8:1$08MNvrOMXBoc8kcw$6fb785181591c6d7f79640f1b6255ec00a07a0499df44e81bbe9b0b3a6da5e466f7974276987052430433bf21823e061c36d5c3a58280d8ac36f6ac6f04f68c0', 'Guitarist looking to pick up photography.', '/static/img/seed/kabir.jpg'),
    ('Meera', 'meera@skillswap.test', 'scrypt:32768:8:1$08MNvrOMXBoc8kcw$6fb785181591c6d7f79640f1b6255ec00a07a0499df44e81bbe9b0b3a6da5e466f7974276987052430433bf21823e061c36d5c3a58280d8ac36f6ac6f04f68c0', 'Photographer who loves capturing candid moments.', '/static/img/seed/meera.jpg'),
    ('Dev', 'dev@skillswap.test', 'scrypt:32768:8:1$08MNvrOMXBoc8kcw$6fb785181591c6d7f79640f1b6255ec00a07a0499df44e81bbe9b0b3a6da5e466f7974276987052430433bf21823e061c36d5c3a58280d8ac36f6ac6f04f68c0', 'Home cook experimenting with family recipes.', '/static/img/seed/dev.jpg'),
    ('Ananya', 'ananya@skillswap.test', 'scrypt:32768:8:1$08MNvrOMXBoc8kcw$6fb785181591c6d7f79640f1b6255ec00a07a0499df44e81bbe9b0b3a6da5e466f7974276987052430433bf21823e061c36d5c3a58280d8ac36f6ac6f04f68c0', 'Language learner fluent in French, picking up more.', '/static/img/seed/ananya.jpg'),
    ('Rohan', 'rohan@skillswap.test', 'scrypt:32768:8:1$08MNvrOMXBoc8kcw$6fb785181591c6d7f79640f1b6255ec00a07a0499df44e81bbe9b0b3a6da5e466f7974276987052430433bf21823e061c36d5c3a58280d8ac36f6ac6f04f68c0', 'Backend developer into machine learning.', '/static/img/seed/rohan.jpg'),
    ('Priya', 'priya@skillswap.test', 'scrypt:32768:8:1$08MNvrOMXBoc8kcw$6fb785181591c6d7f79640f1b6255ec00a07a0499df44e81bbe9b0b3a6da5e466f7974276987052430433bf21823e061c36d5c3a58280d8ac36f6ac6f04f68c0', 'Yoga instructor and fitness enthusiast.', '/static/img/seed/priya.jpg'),
    ('Karan', 'karan@skillswap.test', 'scrypt:32768:8:1$08MNvrOMXBoc8kcw$6fb785181591c6d7f79640f1b6255ec00a07a0499df44e81bbe9b0b3a6da5e466f7974276987052430433bf21823e061c36d5c3a58280d8ac36f6ac6f04f68c0', 'Weekend athlete, plays basketball and football.', '/static/img/seed/karan.jpg'),
    ('Sanya', 'sanya@skillswap.test', 'scrypt:32768:8:1$08MNvrOMXBoc8kcw$6fb785181591c6d7f79640f1b6255ec00a07a0499df44e81bbe9b0b3a6da5e466f7974276987052430433bf21823e061c36d5c3a58280d8ac36f6ac6f04f68c0', 'Freelance illustrator who loves painting.', '/static/img/seed/sanya.jpg'),
    ('Vikram', 'vikram@skillswap.test', 'scrypt:32768:8:1$08MNvrOMXBoc8kcw$6fb785181591c6d7f79640f1b6255ec00a07a0499df44e81bbe9b0b3a6da5e466f7974276987052430433bf21823e061c36d5c3a58280d8ac36f6ac6f04f68c0', 'Math and physics tutor.', '/static/img/seed/vikram.jpg'),
    ('Neha', 'neha@skillswap.test', 'scrypt:32768:8:1$08MNvrOMXBoc8kcw$6fb785181591c6d7f79640f1b6255ec00a07a0499df44e81bbe9b0b3a6da5e466f7974276987052430433bf21823e061c36d5c3a58280d8ac36f6ac6f04f68c0', 'Classically trained singer and pianist.', '/static/img/seed/neha.jpg'),
    ('Arjun', 'arjun@skillswap.test', 'scrypt:32768:8:1$08MNvrOMXBoc8kcw$6fb785181591c6d7f79640f1b6255ec00a07a0499df44e81bbe9b0b3a6da5e466f7974276987052430433bf21823e061c36d5c3a58280d8ac36f6ac6f04f68c0', 'Polyglot who speaks Spanish and German.', '/static/img/seed/arjun.jpg');

INSERT INTO skills (user_id, skill_name, skill_type, category)
SELECT id, v.skill_name, v.skill_type, v.category
FROM users
JOIN (
    SELECT 'Riya' AS name, 'Coding' AS skill_name, 'teach' AS skill_type, 'Technology' AS category
    UNION ALL SELECT 'Riya', 'JavaScript', 'teach', 'Technology'
    UNION ALL SELECT 'Riya', 'Drawing', 'learn', 'Art'
    UNION ALL SELECT 'Aarav', 'Drawing', 'teach', 'Art'
    UNION ALL SELECT 'Aarav', 'Sketching', 'teach', 'Art'
    UNION ALL SELECT 'Aarav', 'Coding', 'learn', 'Technology'
    UNION ALL SELECT 'Kabir', 'Guitar', 'teach', 'Music'
    UNION ALL SELECT 'Kabir', 'Music', 'teach', 'Music'
    UNION ALL SELECT 'Kabir', 'Photography', 'learn', 'Art'
    UNION ALL SELECT 'Meera', 'Photography', 'teach', 'Art'
    UNION ALL SELECT 'Meera', 'Editing', 'teach', 'Art'
    UNION ALL SELECT 'Meera', 'Guitar', 'learn', 'Music'
    UNION ALL SELECT 'Dev', 'Cooking', 'teach', 'Cooking'
    UNION ALL SELECT 'Dev', 'Baking', 'teach', 'Cooking'
    UNION ALL SELECT 'Dev', 'French', 'learn', 'Languages'
    UNION ALL SELECT 'Ananya', 'French', 'teach', 'Languages'
    UNION ALL SELECT 'Ananya', 'Languages', 'teach', 'Languages'
    UNION ALL SELECT 'Ananya', 'Coding', 'learn', 'Technology'
    UNION ALL SELECT 'Rohan', 'Python', 'teach', 'Technology'
    UNION ALL SELECT 'Rohan', 'Machine Learning', 'teach', 'Technology'
    UNION ALL SELECT 'Rohan', 'Football', 'learn', 'Sports'
    UNION ALL SELECT 'Priya', 'Yoga', 'teach', 'Wellness'
    UNION ALL SELECT 'Priya', 'Fitness', 'teach', 'Wellness'
    UNION ALL SELECT 'Priya', 'Painting', 'learn', 'Art'
    UNION ALL SELECT 'Karan', 'Basketball', 'teach', 'Sports'
    UNION ALL SELECT 'Karan', 'Football', 'teach', 'Sports'
    UNION ALL SELECT 'Karan', 'Guitar', 'learn', 'Music'
    UNION ALL SELECT 'Sanya', 'Painting', 'teach', 'Art'
    UNION ALL SELECT 'Sanya', 'Drawing', 'teach', 'Art'
    UNION ALL SELECT 'Sanya', 'Python', 'learn', 'Technology'
    UNION ALL SELECT 'Vikram', 'Mathematics', 'teach', 'Academics'
    UNION ALL SELECT 'Vikram', 'Physics', 'teach', 'Academics'
    UNION ALL SELECT 'Vikram', 'Singing', 'learn', 'Music'
    UNION ALL SELECT 'Neha', 'Singing', 'teach', 'Music'
    UNION ALL SELECT 'Neha', 'Piano', 'teach', 'Music'
    UNION ALL SELECT 'Neha', 'Spanish', 'learn', 'Languages'
    UNION ALL SELECT 'Arjun', 'Spanish', 'teach', 'Languages'
    UNION ALL SELECT 'Arjun', 'German', 'teach', 'Languages'
    UNION ALL SELECT 'Arjun', 'Basketball', 'learn', 'Sports'
) v ON v.name = users.name
WHERE users.email LIKE '%@skillswap.test';

INSERT INTO showcase_posts (user_id, media_url, media_type, description)
SELECT id, '/static/video/demo.mp4', 'video', 'A walkthrough of SkillSwap end to end.'
FROM users WHERE name = 'Riya';
