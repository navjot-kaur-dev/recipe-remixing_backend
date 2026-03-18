import { Router } from 'express'
import { getMealPlan, saveMealPlan, removeSlot } from '../controllers/mealPlannerController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/',           protect, getMealPlan)
router.post('/',          protect, saveMealPlan)
router.delete('/:slotKey', protect, removeSlot)

export default router
