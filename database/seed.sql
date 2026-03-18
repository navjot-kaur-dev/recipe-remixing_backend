-- ═══════════════════════════════════════════════════════
--  RecipeRemixing — Seed Data
--  Run AFTER schema.sql in Supabase → SQL Editor
--  NOTE: Passwords below are hashed version of "password123"
-- ═══════════════════════════════════════════════════════

-- Sample users (password = "password123" for all)
INSERT INTO users (id, name, username, email, password_hash, bio) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Arjun Kumar',  'arjun_chef',   'arjun@example.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Passionate about Asian cuisine'),
  ('22222222-2222-2222-2222-222222222222', 'Priya Sharma', 'priya_cooks',  'priya@example.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vegan food lover'),
  ('33333333-3333-3333-3333-333333333333', 'Marco Rossi',  'marco_pasta',  'marco@example.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Italian food specialist')
ON CONFLICT (email) DO NOTHING;

-- Sample recipes
INSERT INTO recipes (id, user_id, title, description, emoji, category, cuisine, difficulty, prep_time, cook_time, servings, tags, views, is_collaborative) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   'Slow-Cooked Spicy Tonkotsu Ramen',
   'A deeply rich pork bone broth simmered for 12 hours, topped with chashu pork and soft-boiled eggs.',
   '🍜', 'Asian', 'Japanese', 'Hard', 30, 150, 4,
   ARRAY['Asian','Noodles','Spicy','Comfort Food'], 21000, true),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222',
   'Rainbow Vegan Buddha Bowl',
   'A nourishing bowl packed with roasted chickpeas, avocado, quinoa and tahini dressing.',
   '🥗', 'Vegan', 'Fusion', 'Easy', 20, 25, 2,
   ARRAY['Vegan','Healthy','Quick Meal','Gluten-Free'], 14200, false),

  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333',
   'Classic Creamy Carbonara',
   'A true Roman carbonara — no cream, just eggs, Pecorino and guanciale.',
   '🍝', 'Pasta', 'Italian', 'Medium', 10, 15, 4,
   ARRAY['Pasta','Italian','Quick Meal','Classic'], 32000, false)
ON CONFLICT DO NOTHING;

-- Sample ingredients
INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pork bones',     2,   'kg'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ramen noodles',  300, 'g'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Soy sauce',      4,   'tbsp'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Miso paste',     3,   'tbsp'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cooked quinoa',  2,   'cups'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Avocado',        1,   ''),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cherry tomatoes',200, 'g'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Spaghetti',      400, 'g'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Guanciale',      150, 'g'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Egg yolks',      4,   ''),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Pecorino Romano',80,  'g')
ON CONFLICT DO NOTHING;

-- Sample nutrition
INSERT INTO nutrition (recipe_id, calories, protein, carbs, fat, fiber) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 580, 38, 52, 22, 4),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 380, 18, 42, 16, 12),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 620, 28, 72, 24, 3)
ON CONFLICT DO NOTHING;

-- Sample community threads
INSERT INTO community_threads (user_id, title, tag, likes, replies) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Best way to achieve restaurant-quality char on chicken tikka?',    'Tips & Tricks',    87,  24),
  ('22222222-2222-2222-2222-222222222222', 'Can I substitute coconut cream in carbonara for dairy-free?',      'Ingredient Swaps', 54,  18),
  ('33333333-3333-3333-3333-333333333333', 'My soufflé keeps collapsing — what am I doing wrong?',             'Recipe Help',      102, 31),
  ('11111111-1111-1111-1111-111111111111', 'Weekly meal prep ideas for a family of 4 — share yours!',          'Tips & Tricks',    312, 89)
ON CONFLICT DO NOTHING;
