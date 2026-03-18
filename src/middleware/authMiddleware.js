import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../config/supabaseClient.js'

// ── Verify JWT and attach user to req.user ──
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorised — no token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Fetch fresh user from DB to ensure they still exist
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, username, email, avatar_url')
      .eq('id', decoded.id)
      .single()

    if (error || !user) {
      return res.status(401).json({ message: 'Not authorised — user not found' })
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired — please log in again' })
    }
    return res.status(401).json({ message: 'Not authorised — invalid token' })
  }
}

// ── Optional auth — attaches user if token present, continues either way ──
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return next()

    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, username, email, avatar_url')
      .eq('id', decoded.id)
      .single()

    if (user) req.user = user
  } catch {
    // Invalid token — just continue without user
  }
  next()
}
