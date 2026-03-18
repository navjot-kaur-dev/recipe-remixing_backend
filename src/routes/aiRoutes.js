import { Router } from 'express'
import { getSuggestions, getNutrition, duplicateCheck } from '../controllers/aiController.js'
import { protect, optionalAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Suggestions and nutrition are available to all users
// (including guests who haven't signed up yet)
router.post('/suggestions',    optionalAuth, getSuggestions)
router.post('/suggest',        optionalAuth, getSuggestions)   // alias fallback
router.post('/nutrition',      optionalAuth, getNutrition)
router.post('/analyze',        optionalAuth, getNutrition)     // alias fallback
router.post('/duplicate-check', protect,     duplicateCheck)
router.post('/check-duplicate', protect,     duplicateCheck)   // alias fallback

export default router
