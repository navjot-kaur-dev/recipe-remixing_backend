# 🍳 RecipeRemixing — Backend API

Node.js + Express + Supabase + Gemini AI

---

## 🚀 Quick Start

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Fill in your .env file
Open `.env` and add your keys:
```env
PORT=5000
CLIENT_URL=http://localhost:5173

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

JWT_SECRET=any-long-random-string-here
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=your-gemini-api-key
```

### Step 3 — Set up your Supabase database
1. Go to https://supabase.com → your project → SQL Editor
2. Paste and run `database/schema.sql`  (creates all tables)
3. Paste and run `database/seed.sql`    (adds sample data — optional)

### Step 4 — Start the server
```bash
npm run dev
```
Server starts at **http://localhost:5000**

Test it: open http://localhost:5000/api/health in your browser.
You should see: `{ "status": "ok", "message": "RecipeRemixing API is running" }`

---

## 📁 Folder Structure

```
recipe-remixing-backend/
├── database/
│   ├── schema.sql              ← Run this first in Supabase SQL Editor
│   └── seed.sql                ← Run this second (sample data)
├── src/
│   ├── config/
│   │   ├── supabaseClient.js   ← Supabase connection (regular + admin)
│   │   └── aiConfig.js         ← Google Gemini AI setup
│   ├── controllers/
│   │   ├── authController.js       ← register, login, logout, getMe
│   │   ├── recipeController.js     ← CRUD for recipes
│   │   ├── commentController.js    ← CRUD for comments
│   │   ├── likeController.js       ← toggle likes on recipes
│   │   ├── collectionController.js ← bookmarks / saved recipes
│   │   ├── mealPlannerController.js← weekly meal plan save/load
│   │   ├── analyticsController.js  ← views, likes, saves stats
│   │   ├── communityController.js  ← forum threads + replies
│   │   ├── collabController.js     ← recipe collaboration
│   │   ├── aiController.js         ← routes requests to Gemini service
│   │   └── pdfController.js        ← recipe PDF export
│   ├── middleware/
│   │   ├── authMiddleware.js    ← JWT verification (protect, optionalAuth)
│   │   ├── errorHandler.js      ← global error + 404 handlers
│   │   ├── rbacMiddleware.js    ← ownership checks (isRecipeOwner etc.)
│   │   └── uploadMiddleware.js  ← multer image upload config
│   ├── routes/
│   │   ├── index.js             ← mounts all routers under /api
│   │   ├── authRoutes.js
│   │   ├── recipeRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── likeRoutes.js
│   │   ├── collectionRoutes.js
│   │   ├── mealPlannerRoutes.js
│   │   ├── analyticsRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── communityRoutes.js
│   │   └── collabRoutes.js
│   ├── services/
│   │   ├── geminiService.js     ← all Gemini AI prompts
│   │   ├── duplicateCheck.js    ← recipe uniqueness checking
│   │   └── pdfExportService.js  ← HTML recipe card generation
│   └── utils/
│       ├── constants.js         ← app-wide constants
│       ├── validators.js        ← input validation helpers
│       └── formatters.js        ← shape DB rows into frontend-ready objects
├── server.js                    ← entry point
├── .env                         ← fill this in (never commit to git!)
├── .gitignore
└── package.json
```

---

## 📋 All API Routes

### Auth — `/api/auth`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | Public | Create new account |
| POST | `/api/auth/login` | Public | Login, get JWT token |
| POST | `/api/auth/logout` | Required | Logout |
| GET | `/api/auth/me` | Required | Get current user |
| POST | `/api/auth/refresh` | Required | Refresh JWT token |

### Recipes — `/api/recipes`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/recipes` | Optional | Get all recipes (supports ?q= ?category= ?page=) |
| GET | `/api/recipes/trending` | Public | Get top recipes by views |
| GET | `/api/recipes/:id` | Optional | Get single recipe (increments views) |
| POST | `/api/recipes` | Required | Create new recipe |
| PUT | `/api/recipes/:id` | Owner only | Update recipe |
| DELETE | `/api/recipes/:id` | Owner only | Delete recipe |
| POST | `/api/recipes/upload` | Required | Upload recipe image |
| POST | `/api/recipes/:id/export-pdf` | Public | Download recipe as HTML/PDF |

### Comments — `/api/comments`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/comments/recipe/:id` | Public | Get all comments for a recipe |
| POST | `/api/comments/recipe/:id` | Required | Post a comment |
| PUT | `/api/comments/:commentId` | Owner only | Edit comment |
| DELETE | `/api/comments/:commentId` | Owner only | Delete comment |

### Likes — `/api/likes`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/likes/recipe/:id` | Optional | Get like count + user liked status |
| POST | `/api/likes/recipe/:id` | Required | Toggle like on recipe |

### Collections/Bookmarks — `/api/collections`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/collections` | Required | Get all bookmarked recipes |
| POST | `/api/collections/:recipeId` | Required | Bookmark a recipe |
| DELETE | `/api/collections/:recipeId` | Required | Remove bookmark |

### Meal Planner — `/api/meal-planner`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/meal-planner` | Required | Get weekly meal plan |
| POST | `/api/meal-planner` | Required | Save weekly meal plan |
| DELETE | `/api/meal-planner/:slotKey` | Required | Remove one slot |

### Analytics — `/api/analytics`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/analytics/overview` | Required | Total views/likes/saves for user's recipes |
| GET | `/api/analytics/weekly` | Required | Day-by-day data for last 7 days |
| GET | `/api/analytics/recipe/:id` | Required | Stats for a specific recipe |

### AI — `/api/ai`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/ai/suggestions` | Optional | Get recipe suggestions from ingredients |
| POST | `/api/ai/nutrition` | Optional | Analyze nutrition from ingredient text |
| POST | `/api/ai/duplicate-check` | Required | Check if recipe already exists |

### Community/Forum — `/api/community`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/community` | Public | Get all forum threads |
| GET | `/api/community/:id` | Public | Get thread + its replies |
| POST | `/api/community` | Required | Create new thread |
| POST | `/api/community/:id/reply` | Required | Reply to thread |
| POST | `/api/community/:id/like` | Required | Toggle like on thread |

### Collaboration — `/api/collab`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/collab/invite/:recipeId` | Required | Invite collaborator by email |
| GET | `/api/collab/:recipeId` | Required | Get collaborators list |
| PUT | `/api/collab/:recipeId` | Collab/Owner | Save collaborative edit |

---

## 🔑 How Authentication Works

1. User registers or logs in → backend returns a `token` (JWT string)
2. Frontend stores it: `localStorage.setItem('rr_token', token)`
3. Every protected request sends: `Authorization: Bearer <token>`
4. `authMiddleware.js` verifies the token and sets `req.user`

**Expected login response shape:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "name": "Arjun Kumar",
    "username": "arjun_chef",
    "email": "arjun@example.com",
    "bio": "",
    "avatarUrl": ""
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🤖 Gemini AI Setup

1. Go to https://makersuite.google.com/app/apikey
2. Create an API key
3. Add to `.env`: `GEMINI_API_KEY=your-key-here`

The AI features use `gemini-1.5-flash` model (fast + free tier available).
If the key is missing, all AI endpoints return fallback mock responses — the app still works.

---

## 🗄️ Supabase Setup

1. Go to https://supabase.com → New Project
2. Once created, go to **Project Settings → API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY`
4. Go to **SQL Editor** → paste and run `database/schema.sql`
5. Optionally run `database/seed.sql` for sample data

### Supabase Storage (for image uploads)
1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named: `recipe-images`
3. Set it to **Public**
4. Image uploads will work automatically

---

## 🐛 Common Issues

| Problem | Fix |
|---------|-----|
| `CORS error` in browser | Make sure `CLIENT_URL=http://localhost:5173` in `.env` |
| `JWT secret missing` | Add `JWT_SECRET=any-long-random-string` in `.env` |
| `Supabase connection failed` | Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` |
| `Cannot POST /api/auth/login` → 404 | Server not running — run `npm run dev` |
| AI returns mock data | Add `GEMINI_API_KEY` to `.env` |
| Image upload fails | Create `recipe-images` bucket in Supabase Storage |
| `nodemon: command not found` | Run `npm install` first |
