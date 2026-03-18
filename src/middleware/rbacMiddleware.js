import { supabaseAdmin } from '../config/supabaseClient.js'

// Check if the logged-in user owns a recipe before allowing edit/delete
export const isRecipeOwner = async (req, res, next) => {
  try {
    const { id } = req.params
    const { data: recipe, error } = await supabaseAdmin
      .from('recipes')
      .select('user_id')
      .eq('id', id)
      .single()

    if (error || !recipe) {
      return res.status(404).json({ message: 'Recipe not found' })
    }
    if (recipe.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised — you do not own this recipe' })
    }
    next()
  } catch {
    res.status(500).json({ message: 'Server error checking ownership' })
  }
}

// Check if user owns a comment
export const isCommentOwner = async (req, res, next) => {
  try {
    const { commentId } = req.params
    const { data: comment, error } = await supabaseAdmin
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single()

    if (error || !comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }
    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised — you do not own this comment' })
    }
    next()
  } catch {
    res.status(500).json({ message: 'Server error checking ownership' })
  }
}
