import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl     = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseService = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

// Regular client — uses anon key, respects Row Level Security (RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client — uses service role key, bypasses RLS (use carefully)
export const supabaseAdmin = createClient(supabaseUrl, supabaseService || supabaseAnonKey)
