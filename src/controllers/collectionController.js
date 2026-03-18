import { supabaseAdmin } from '../config/supabaseClient.js'
import { formatRecipe } from '../utils/formatters.js'

// ── GET /api/collections ─────────────────────────────
export const getAll = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('collections')
      .select('recipe_id, recipes_with_stats(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const recipes = (data || [])
      .filter(c => c.recipes_with_stats)
      .map(c => formatRecipe(c.recipes_with_stats))

    res.status(200).json({ bookmarks: recipes, collections: recipes })
  } catch (err) {
    console.error('GetAll collections error:', err)
    res.status(500).json({ message: 'Could not fetch bookmarks' })
  }
}

// ── POST /api/collections/:recipeId ─────────────────
export const save = async (req, res) => {
  try {
    const { recipeId } = req.params

    const { error } = await supabaseAdmin
      .from('collections')
      .insert({ user_id: req.user.id, recipe_id: recipeId })

    // Ignore duplicate error (already saved)
    if (error && !error.message.includes('duplicate')) throw error

    res.status(200).json({ message: 'Recipe saved to bookmarks' })
  } catch (err) {
    console.error('Save collection error:', err)
    res.status(500).json({ message: 'Could not save bookmark' })
  }
}

// ── DELETE /api/collections/:recipeId ───────────────
export const remove = async (req, res) => {
  try {
    const { recipeId } = req.params
    const { error } = await supabaseAdmin
      .from('collections')
      .delete()
      .eq('user_id', req.user.id)
      .eq('recipe_id', recipeId)

    if (error) throw error
    res.status(200).json({ message: 'Bookmark removed' })
  } catch (err) {
    console.error('Remove collection error:', err)
    res.status(500).json({ message: 'Could not remove bookmark' })
  }
}
