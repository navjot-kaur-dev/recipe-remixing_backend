import { Router } from 'express'
import { getOverview, getRecipeStats, getWeekly } from '../controllers/analyticsController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/overview',     protect, getOverview)
router.get('/weekly',       protect, getWeekly)
router.get('/recipe/:id',   protect, getRecipeStats)

export default router
