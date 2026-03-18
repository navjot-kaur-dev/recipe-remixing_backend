import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../config/supabaseClient.js'
import { formatUser } from '../utils/formatters.js'
import { isValidEmail, isValidPassword, isValidUsername } from '../utils/validators.js'
import { BCRYPT_ROUNDS } from '../utils/constants.js'

// Generate a signed JWT for a user
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

// ── POST /api/auth/register ──────────────────────────
export const register = async (req, res) => {
  try {
    const { name, username, email, password, bio, interests } = req.body

    // Validate inputs
    if (!name?.trim())                return res.status(400).json({ message: 'Name is required' })
    if (!isValidEmail(email))         return res.status(400).json({ message: 'Valid email is required' })
    if (!isValidPassword(password))   return res.status(400).json({ message: 'Password must be at least 6 characters' })
    if (!isValidUsername(username))   return res.status(400).json({ message: 'Username must be 3-30 chars, letters/numbers/underscore only' })

    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) return res.status(409).json({ message: 'An account with this email already exists' })

    // Check username taken
    const { data: usernameTaken } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()

    if (usernameTaken) return res.status(409).json({ message: 'Username is already taken' })

    // Hash password
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    // Insert new user
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        name:          name.trim(),
        username:      username.toLowerCase().trim(),
        email:         email.toLowerCase().trim(),
        password_hash,
        bio:           bio || '',
        interests:     interests || [],
      })
      .select()
      .single()

    if (error) throw error

    const token = generateToken(newUser.id)

    res.status(201).json({
      message: 'Account created successfully',
      user:    formatUser(newUser),
      token,
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: 'Server error during registration' })
  }
}

// ── POST /api/auth/login ─────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    // Find user by email
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = generateToken(user.id)

    res.status(200).json({
      message: 'Login successful',
      user:    formatUser(user),
      token,
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Server error during login' })
  }
}

// ── POST /api/auth/logout ────────────────────────────
export const logout = async (req, res) => {
  // JWT is stateless — client just deletes the token
  // If you add a token blacklist table later, invalidate here
  res.status(200).json({ message: 'Logged out successfully' })
}

// ── GET /api/auth/me ─────────────────────────────────
export const getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single()

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({ user: formatUser(user) })
  } catch (err) {
    console.error('GetMe error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ── POST /api/auth/refresh ───────────────────────────
export const refreshToken = async (req, res) => {
  try {
    const token = generateToken(req.user.id)
    res.status(200).json({ token })
  } catch {
    res.status(500).json({ message: 'Could not refresh token' })
  }
}
