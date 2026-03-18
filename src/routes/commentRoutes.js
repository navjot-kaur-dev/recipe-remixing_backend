import { Router } from 'express'
import { getByRecipe, createComment, updateComment, deleteComment } from '../controllers/commentController.js'
import { protect } from '../middleware/authMiddleware.js'
import { isCommentOwner } from '../middleware/rbacMiddleware.js'

const router = Router()

router.get('/recipe/:id',    getByRecipe)
router.post('/recipe/:id',   protect, createComment)
router.put('/:commentId',    protect, isCommentOwner, updateComment)
router.delete('/:commentId', protect, isCommentOwner, deleteComment)

export default router
