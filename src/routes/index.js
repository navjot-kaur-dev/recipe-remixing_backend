import { Router } from 'express'
import authRoutes        from './authRoutes.js'
import recipeRoutes      from './recipeRoutes.js'
import commentRoutes     from './commentRoutes.js'
import likeRoutes        from './likeRoutes.js'
import collectionRoutes  from './collectionRoutes.js'
import mealPlannerRoutes from './mealPlannerRoutes.js'
import analyticsRoutes   from './analyticsRoutes.js'
import aiRoutes          from './aiRoutes.js'
import communityRoutes   from './communityRoutes.js'
import collabRoutes      from './collabRoutes.js'

const router = Router()

router.use('/auth',         authRoutes)
router.use('/recipes',      recipeRoutes)
router.use('/comments',     commentRoutes)
router.use('/likes',        likeRoutes)
router.use('/collections',  collectionRoutes)
router.use('/meal-planner', mealPlannerRoutes)
router.use('/mealplanner',  mealPlannerRoutes)   // alias fallback
router.use('/analytics',    analyticsRoutes)
router.use('/ai',           aiRoutes)
router.use('/community',    communityRoutes)
router.use('/forum',        communityRoutes)     // alias fallback
router.use('/collab',       collabRoutes)

// Health check — hit /api/health to confirm backend is running
router.get('/health', (req, res) => {
  res.status(200).json({
    status:  'ok',
    message: 'RecipeRemixing API is running',
    time:    new Date().toISOString(),
  })
})

export default router
