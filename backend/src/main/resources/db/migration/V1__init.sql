-- Enable UUID and JSONB-ready schema objects
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROLES normalization (add to V1 or as V2__roles.sql)
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- USERS first (without avatar FK to break the cycle)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    username VARCHAR NOT NULL UNIQUE,
    email VARCHAR NOT NULL UNIQUE,
    password VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'active',
    role VARCHAR NOT NULL,
    avatar_media_id UUID, -- FK added after media table
    impressions_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    readme TEXT,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- MEDIA next (references users)
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    media_type VARCHAR NOT NULL,
    size INT NOT NULL,
    url TEXT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_media_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Now add the avatar FK to users -> media
ALTER TABLE users
  ADD CONSTRAINT fk_avatar_media FOREIGN KEY (avatar_media_id) REFERENCES media(id);

-- POSTS
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'active',
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    impressions_count INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- POST_MEDIA
CREATE TABLE post_media (
    post_id UUID NOT NULL,
    media_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (post_id, media_id),
    CONSTRAINT fk_post_media_post FOREIGN KEY (post_id) REFERENCES posts(id),
    CONSTRAINT fk_post_media_media FOREIGN KEY (media_id) REFERENCES media(id)
);

-- COMMENTS
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id)
);

-- LIKES
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    UNIQUE (post_id, user_id),
    CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_likes_post FOREIGN KEY (post_id) REFERENCES posts(id)
);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID NOT NULL,
    subscribed_to_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL,
    UNIQUE (subscriber_id, subscribed_to_id),
    CONSTRAINT fk_subscriber FOREIGN KEY (subscriber_id) REFERENCES users(id),
    CONSTRAINT fk_subscribed_to FOREIGN KEY (subscribed_to_id) REFERENCES users(id)
);

-- REPORTS
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL,
    reported_user_id UUID NOT NULL,
    reported_post_id UUID,
    reported_comment_id UUID,
    category VARCHAR NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id),
    CONSTRAINT fk_reports_reported_user FOREIGN KEY (reported_user_id) REFERENCES users(id),
    CONSTRAINT fk_reports_reported_post FOREIGN KEY (reported_post_id) REFERENCES posts(id),
    CONSTRAINT fk_reports_reported_comment FOREIGN KEY (reported_comment_id) REFERENCES comments(id)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    post_id UUID,
    type VARCHAR NOT NULL,
    payload JSONB,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_notifications_post FOREIGN KEY (post_id) REFERENCES posts(id)
);

-- UNSEEN NOTIFICATIONS
CREATE TABLE unseen_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    notification_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_unseen_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_unseen_notification FOREIGN KEY (notification_id) REFERENCES notifications(id)
);

CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at DESC);
CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
