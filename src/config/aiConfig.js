import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'
dotenv.config()

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not set — AI features will use fallback responses')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Use gemini-1.5-flash — fast and cost-effective for our use cases
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

export default geminiModel
