import { Router } from 'express'
import { getAll, save, remove } from '../controllers/collectionController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/',             protect, getAll)
router.post('/:recipeId',   protect, save)
router.delete('/:recipeId', protect, remove)

export default router
