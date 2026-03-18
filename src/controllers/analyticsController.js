import { supabaseAdmin } from '../config/supabaseClient.js'

// ── GET /api/analytics/overview ──────────────────────
// Returns total views, likes, saves, comments for the
// logged-in user's recipes
export const getOverview = async (req, res) => {
  try {
    const userId = req.user.id

    // Get all recipe IDs belonging to this user
    const { data: userRecipes } = await supabaseAdmin
      .from('recipes')
      .select('id, views')
      .eq('user_id', userId)

    if (!userRecipes?.length) {
      return res.status(200).json({
        totalViews: 0, totalLikes: 0, totalComments: 0,
        totalSaves: 0, recipesShared: 0, avgRating: 0, shares: 0,
      })
    }

    const recipeIds  = userRecipes.map(r => r.id)
    const totalViews = userRecipes.reduce((sum, r) => sum + (r.views || 0), 0)

    // Parallel count queries
    const [likes, comments, saves, ratings] = await Promise.all([
      supabaseAdmin.from('likes').select('*', { count:'exact', head:true }).in('recipe_id', recipeIds),
      supabaseAdmin.from('comments').select('*', { count:'exact', head:true }).in('recipe_id', recipeIds),
      supabaseAdmin.from('collections').select('*', { count:'exact', head:true }).in('recipe_id', recipeIds),
      supabaseAdmin.from('comments').select('rating').in('recipe_id', recipeIds),
    ])

    const allRatings = (ratings.data || []).map(r => r.rating).filter(Boolean)
    const avgRating  = allRatings.length
      ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(2)
      : 0

    res.status(200).json({
      totalViews,
      totalLikes:    likes.count    || 0,
      totalComments: comments.count || 0,
      totalSaves:    saves.count    || 0,
      recipesShared: recipeIds.length,
      avgRating:     parseFloat(avgRating),
      shares:        0, // extend with a shares table if needed
    })
  } catch (err) {
    console.error('Analytics overview error:', err)
    res.status(500).json({ message: 'Could not fetch analytics' })
  }
}

// ── GET /api/analytics/recipe/:id ────────────────────
export const getRecipeStats = async (req, res) => {
  try {
    const { id } = req.params

    const [recipe, likes, comments, saves] = await Promise.all([
      supabaseAdmin.from('recipes').select('id, title, views').eq('id', id).single(),
      supabaseAdmin.from('likes').select('*', { count:'exact', head:true }).eq('recipe_id', id),
      supabaseAdmin.from('comments').select('rating').eq('recipe_id', id),
      supabaseAdmin.from('collections').select('*', { count:'exact', head:true }).eq('recipe_id', id),
    ])

    if (!recipe.data) return res.status(404).json({ message: 'Recipe not found' })

    const allRatings = (comments.data || []).map(r => r.rating).filter(Boolean)
    const avgRating  = allRatings.length
      ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
      : 0

    res.status(200).json({
      recipeId:    id,
      title:       recipe.data.title,
      views:       recipe.data.views || 0,
      likes:       likes.count || 0,
      comments:    allRatings.length,
      saves:       saves.count || 0,
      avgRating:   parseFloat(avgRating),
    })
  } catch (err) {
    console.error('Recipe stats error:', err)
    res.status(500).json({ message: 'Could not fetch recipe stats' })
  }
}

// ── GET /api/analytics/weekly ─────────────────────────
// Returns day-by-day view data for last 7 days (for bar chart)
export const getWeekly = async (req, res) => {
  try {
    const userId = req.user.id
    const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const now    = new Date()

    // Build 7-day buckets
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(now.getDate() - (6 - i))
      return {
        day:   days[d.getDay()],
        date:  d.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 3000) + 500, // Real: query recipe_views table
        likes: Math.floor(Math.random() * 200)  + 50,
      }
    })

    // Real implementation would query recipe_views table:
    // SELECT DATE(viewed_at) as day, COUNT(*) as views
    // FROM recipe_views WHERE recipe_id IN (user's recipes)
    // AND viewed_at >= NOW() - INTERVAL '7 days'
    // GROUP BY DATE(viewed_at)

    res.status(200).json({ data: weekData })
  } catch (err) {
    console.error('Weekly analytics error:', err)
    res.status(500).json({ message: 'Could not fetch weekly analytics' })
  }
}
