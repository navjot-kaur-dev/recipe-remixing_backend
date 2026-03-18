import { Router } from 'express'
import { inviteCollaborator, getCollaborators, saveCollabEdit } from '../controllers/collabController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/invite/:recipeId', protect, inviteCollaborator)
router.get('/:recipeId',         protect, getCollaborators)
router.put('/:recipeId',         protect, saveCollabEdit)

export default router
