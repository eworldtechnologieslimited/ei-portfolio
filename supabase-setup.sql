-- ═══ SUPABASE SQL SETUP ═══
-- Run all of this in your Supabase SQL Editor

-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  cover_image TEXT,
  excerpt TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog categories
CREATE TABLE IF NOT EXISTS blog_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  page_section TEXT,
  cv_type TEXT,
  country TEXT,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site content (editable from admin)
CREATE TABLE IF NOT EXISTS site_content (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CV file metadata
CREATE TABLE IF NOT EXISTS cv_files (
  id BIGSERIAL PRIMARY KEY,
  cv_type TEXT NOT NULL,
  filename TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_files ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read posts" ON blog_posts FOR SELECT USING (status='published');
CREATE POLICY "Public read categories" ON blog_categories FOR SELECT USING (true);
CREATE POLICY "Public read content" ON site_content FOR SELECT USING (true);

-- Anon write (for admin panel using anon key)
CREATE POLICY "Anon all posts" ON blog_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon all categories" ON blog_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon all analytics" ON analytics_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon all submissions" ON contact_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon all content" ON site_content FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon all cv_files" ON cv_files FOR ALL USING (true) WITH CHECK (true);