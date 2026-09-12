CREATE TABLE IF NOT EXISTS users (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    name                  VARCHAR(80) NOT NULL,
    email                 VARCHAR(120) UNIQUE NULL,
    password_hash         VARCHAR(255) NULL,
    bio                   VARCHAR(280) DEFAULT '',
    avatar_url            VARCHAR(255) DEFAULT '',
    experience_level      VARCHAR(20) NULL,
    availability          VARCHAR(120) NULL,
    interests             VARCHAR(255) NULL,
    learning_preference   VARCHAR(20) NULL,
    last_seen             TIMESTAMP NULL DEFAULT NULL,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    skill_name  VARCHAR(80) NOT NULL,
    skill_type  ENUM('teach', 'learn') NOT NULL,
    category    ENUM('Technology','Art','Music','Languages','Sports','Academics',
                      'Cooking','Business','Wellness','Crafts','Writing','Games','Other')
                NOT NULL DEFAULT 'Other',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS connections (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_a_id   INT NOT NULL,
    user_b_id   INT NOT NULL,
    status      ENUM('pending', 'accepted') NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    connection_id     INT NOT NULL,
    sender_id         INT NOT NULL,
    body              TEXT NOT NULL,
    attachment_url    VARCHAR(255) NULL,
    attachment_type   ENUM('image', 'video') NULL,
    read_at           TIMESTAMP NULL DEFAULT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedback (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    connection_id  INT NOT NULL,
    from_user_id   INT NOT NULL,
    to_user_id     INT NOT NULL,
    rating         TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment        VARCHAR(280) DEFAULT '',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS showcase_posts (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    media_url    VARCHAR(255) NOT NULL,
    media_type   ENUM('image', 'video') NOT NULL,
    description  VARCHAR(500) DEFAULT '',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
