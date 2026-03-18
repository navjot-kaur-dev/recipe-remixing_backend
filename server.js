import express        from 'express'
import cors           from 'cors'
import helmet         from 'helmet'
import dotenv         from 'dotenv'
import rateLimit      from 'express-rate-limit'
import routes         from './src/routes/index.js'
import { errorHandler, notFound } from './src/middleware/errorHandler.js'

// Load environment variables first
dotenv.config()

const app  = express()
const PORT = process.env.PORT || 5000

// ── Security Middleware ───────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images to load
}))

// ── CORS ─────────────────────────────────────────────
// Allows your Vite frontend at localhost:5173 to talk to this API
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5174',  // Vite sometimes uses 5174 if 5173 is busy
    'http://localhost:3000',  // Create React App fallback
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Body Parsers ──────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ── Rate Limiting ─────────────────────────────────────
// Prevents abuse — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again in 15 minutes.' },
})

app.use('/api/', limiter)
app.use('/api/auth/login',    authLimiter)
app.use('/api/auth/register', authLimiter)

// ── Root Health Check ─────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🍳 RecipeRemixing API is running!',
    version: '1.0.0',
    docs:    'GET /api/health to verify all systems',
  })
})

// ── All API Routes ────────────────────────────────────
app.use('/api', routes)

// ── 404 Handler ───────────────────────────────────────
app.use(notFound)

// ── Global Error Handler ──────────────────────────────
app.use(errorHandler)

// ── Start Server ──────────────────────────────────────
app.listen(PORT, () => {
  console.log('')
  console.log('  🍳  RecipeRemixing Backend')
  console.log(`  ✅  Server running on http://localhost:${PORT}`)
  console.log(`  🌍  Accepting requests from: ${process.env.CLIENT_URL || 'http://localhost:5173'}`)
  console.log(`  🗄️   Supabase: ${process.env.SUPABASE_URL ? 'Connected ✓' : 'NOT configured ✗'}`)
  console.log(`  🤖  Gemini AI: ${process.env.GEMINI_API_KEY ? 'Connected ✓' : 'NOT configured ✗'}`)
  console.log('')
})

export default app
