import { Router } from 'express'
import {
  getThreads, getThread, createThread,
  replyToThread, toggleThreadLike,
} from '../controllers/communityController.js'
import { protect, optionalAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/',              optionalAuth, getThreads)
router.get('/:id',           optionalAuth, getThread)
router.post('/',             protect,      createThread)
router.post('/:id/reply',    protect,      replyToThread)
router.post('/:id/like',     protect,      toggleThreadLike)

export default router
