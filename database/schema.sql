-- ═══════════════════════════════════════════════════════════
--  RecipeRemixing — Supabase Database Schema
--  Run this entire file in Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
--  USERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  bio           TEXT,
  avatar_url    TEXT,
  interests     TEXT[],
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  RECIPES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  emoji            TEXT DEFAULT '🍳',
  image_url        TEXT,
  video_url        TEXT,
  category         TEXT,
  cuisine          TEXT,
  difficulty       TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  prep_time        INTEGER,
  cook_time        INTEGER,
  servings         INTEGER DEFAULT 4,
  instructions     TEXT,
  tags             TEXT[],
  is_collaborative BOOLEAN DEFAULT FALSE,
  views            INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  INGREDIENTS (linked to recipe)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingredients (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  amount    NUMERIC,
  unit      TEXT
);

-- ─────────────────────────────────────────────
--  SUBSTITUTIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS substitutions (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  from_ing  TEXT NOT NULL,
  to_ing    TEXT NOT NULL
);

-- ─────────────────────────────────────────────
--  NUTRITION
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID UNIQUE REFERENCES recipes(id) ON DELETE CASCADE,
  calories  INTEGER,
  protein   NUMERIC,
  carbs     NUMERIC,
  fat       NUMERIC,
  fiber     NUMERIC
);

-- ─────────────────────────────────────────────
--  LIKES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- ─────────────────────────────────────────────
--  COMMENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id  UUID REFERENCES recipes(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  rating     INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  COLLECTIONS (Bookmarks)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collections (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id  UUID REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- ─────────────────────────────────────────────
--  MEAL PLANNER
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan       JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  COMMUNITY THREADS (Forum)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_threads (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT,
  tag        TEXT,
  likes      INTEGER DEFAULT 0,
  replies    INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  THREAD REPLIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS thread_replies (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id  UUID REFERENCES community_threads(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  THREAD LIKES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS thread_likes (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES community_threads(id) ON DELETE CASCADE,
  UNIQUE(user_id, thread_id)
);

-- ─────────────────────────────────────────────
--  COLLABORATORS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collaborators (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id  UUID REFERENCES recipes(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

-- ─────────────────────────────────────────────
--  ANALYTICS (view tracking)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipe_views (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id  UUID REFERENCES recipes(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  USEFUL VIEWS
-- ─────────────────────────────────────────────

-- Recipe full details view (joins author info + counts)
CREATE OR REPLACE VIEW recipes_with_stats AS
SELECT
  r.*,
  u.name        AS author,
  u.username    AS author_username,
  u.avatar_url  AS author_avatar,
  COUNT(DISTINCT l.id)  AS likes_count,
  COUNT(DISTINCT c.id)  AS comments_count,
  COUNT(DISTINCT col.id) AS saves_count
FROM recipes r
LEFT JOIN users       u   ON r.user_id   = u.id
LEFT JOIN likes       l   ON r.id        = l.recipe_id
LEFT JOIN comments    c   ON r.id        = c.recipe_id
LEFT JOIN collections col ON r.id        = col.recipe_id
GROUP BY r.id, u.name, u.username, u.avatar_url;
