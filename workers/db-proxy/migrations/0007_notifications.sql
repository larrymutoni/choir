CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    href TEXT NOT NULL,
    created_by_user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notification_recipients (
    notification_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    seen_at TEXT,
    PRIMARY KEY (notification_id, user_id),
    FOREIGN KEY (notification_id)
        REFERENCES notifications(id)
        ON DELETE CASCADE,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_recipients_user
    ON notification_recipients(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_recipients_unseen
    ON notification_recipients(user_id, seen_at);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
    ON notifications(created_at);
