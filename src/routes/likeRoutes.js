import { Router } from 'express'
import { toggleRecipeLike, getRecipeLikes } from '../controllers/likeController.js'
import { protect, optionalAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/recipe/:id',  optionalAuth, getRecipeLikes)
router.post('/recipe/:id', protect,      toggleRecipeLike)

export default router
