import { Router } from 'express'
import {
  getAll, getTrending, getById,
  create, update, deleteRecipe, uploadImage,
} from '../controllers/recipeController.js'
import { exportPDF } from '../controllers/pdfController.js'
import { protect, optionalAuth } from '../middleware/authMiddleware.js'
import { isRecipeOwner } from '../middleware/rbacMiddleware.js'
import { upload, handleUploadError } from '../middleware/uploadMiddleware.js'

const router = Router()

// Public routes
router.get('/',          optionalAuth, getAll)
router.get('/trending',  getTrending)

// Image upload (auth required) — must be before /:id to avoid route conflict
router.post('/upload',   protect, upload.single('image'), handleUploadError, uploadImage)

// Single recipe (public, increments view count)
router.get('/:id',       optionalAuth, getById)

// PDF export
router.post('/:id/export-pdf', exportPDF)

// Protected CRUD
router.post('/',         protect, create)
router.put('/:id',       protect, isRecipeOwner, update)
router.delete('/:id',    protect, isRecipeOwner, deleteRecipe)

export default router
