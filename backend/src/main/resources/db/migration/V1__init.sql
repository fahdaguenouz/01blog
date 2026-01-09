-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ROLES
-- =====================================================
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    bio TEXT,
    age INT NOT NULL CHECK (age >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    avatar_media_id UUID,
    impressions_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    readme TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================================================
-- MEDIA
-- =====================================================
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    size INT NOT NULL,
    url TEXT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_media_user
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
);

-- =====================================================
-- USER AVATAR
-- =====================================================
ALTER TABLE users
ADD CONSTRAINT fk_avatar_media
FOREIGN KEY (avatar_media_id)
REFERENCES media(id)
ON DELETE SET NULL;

-- =====================================================
-- CATEGORIES
-- =====================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(150) NOT NULL UNIQUE,
    description TEXT
);

-- =====================================================
-- POSTS
-- =====================================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  impressions_count INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_posts_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- =====================================================
-- POST ↔ CATEGORIES (M:N)
-- =====================================================
CREATE TABLE post_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL,
    category_id UUID NOT NULL,

    CONSTRAINT fk_post_categories_post
      FOREIGN KEY (post_id)
      REFERENCES posts(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_post_categories_category
      FOREIGN KEY (category_id)
      REFERENCES categories(id)
      ON DELETE CASCADE,

    CONSTRAINT uq_post_category UNIQUE (post_id, category_id)
);

-- =====================================================
-- POST_MEDIA (multi-media)
-- =====================================================
CREATE TABLE post_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL,
    media_id UUID NOT NULL,
    description TEXT,
    position INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_post_media_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_media_media FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
    CONSTRAINT uq_post_media_position UNIQUE (post_id, position)
);

-- =====================================================
-- COMMENTS
-- =====================================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_comments_user
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_comments_post
      FOREIGN KEY (post_id)
      REFERENCES posts(id)
      ON DELETE CASCADE
);

-- =====================================================
-- LIKES
-- =====================================================
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,

    UNIQUE (post_id, user_id),

    CONSTRAINT fk_likes_user
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_likes_post
      FOREIGN KEY (post_id)
      REFERENCES posts(id)
      ON DELETE CASCADE
);

-- =====================================================
-- SUBSCRIPTIONS
-- =====================================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID NOT NULL,
    subscribed_to_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (subscriber_id, subscribed_to_id),

    CONSTRAINT fk_subscriber
      FOREIGN KEY (subscriber_id)
      REFERENCES users(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_subscribed_to
      FOREIGN KEY (subscribed_to_id)
      REFERENCES users(id)
      ON DELETE CASCADE
);

-- =====================================================
-- REPORTS
-- =====================================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL,
    reported_user_id UUID NOT NULL,
    reported_post_id UUID,
    reported_comment_id UUID,
    category VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_reports_reporter
      FOREIGN KEY (reporter_id)
      REFERENCES users(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_reports_reported_user
      FOREIGN KEY (reported_user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_reports_reported_post
      FOREIGN KEY (reported_post_id)
      REFERENCES posts(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_reports_reported_comment
      FOREIGN KEY (reported_comment_id)
      REFERENCES comments(id)
      ON DELETE CASCADE
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    post_id UUID,
    type VARCHAR(50) NOT NULL,
    payload JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notifications_user
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_notifications_post
      FOREIGN KEY (post_id)
      REFERENCES posts(id)
      ON DELETE CASCADE
);

-- =====================================================
-- UNSEEN NOTIFICATIONS
-- =====================================================
CREATE TABLE unseen_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    notification_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_unseen_user
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_unseen_notification
      FOREIGN KEY (notification_id)
      REFERENCES notifications(id)
      ON DELETE CASCADE
);

-- =====================================================
-- SESSIONS
-- =====================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    token TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_sessions_user
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
);

-- =====================================================
-- SAVED POSTS
-- =====================================================
CREATE TABLE saved_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, post_id),

  CONSTRAINT fk_saved_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_saved_post
    FOREIGN KEY (post_id)
    REFERENCES posts(id)
    ON DELETE CASCADE
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_saved_posts_user_created ON saved_posts(user_id, created_at DESC);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at DESC);
CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_post_categories_post ON post_categories(post_id);
CREATE INDEX idx_post_categories_category ON post_categories(category_id);
