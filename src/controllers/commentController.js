import { supabaseAdmin } from '../config/supabaseClient.js'
import { formatComment } from '../utils/formatters.js'

// ── GET /api/comments/recipe/:id ─────────────────────
export const getByRecipe = async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabaseAdmin
      .from('comments')
      .select('*, users(name, username, avatar_url)')
      .eq('recipe_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const comments = (data || []).map(c => ({
      id:       c.id,
      user:     c.users?.name     || 'User',
      username: c.users?.username || '',
      initials: (c.users?.name || 'U').slice(0,2).toUpperCase(),
      text:     c.text,
      rating:   c.rating || 5,
      time:     c.created_at,
    }))

    res.status(200).json({ comments })
  } catch (err) {
    console.error('GetByRecipe comments error:', err)
    res.status(500).json({ message: 'Could not fetch comments' })
  }
}

// ── POST /api/comments/recipe/:id ────────────────────
export const createComment = async (req, res) => {
  try {
    const { id: recipe_id } = req.params
    const { text, rating }  = req.body

    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' })

    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert({
        recipe_id,
        user_id: req.user.id,
        text:    text.trim(),
        rating:  parseInt(rating) || 5,
      })
      .select('*, users(name, username)')
      .single()

    if (error) throw error

    res.status(201).json({
      message: 'Comment posted',
      comment: {
        id:       data.id,
        user:     data.users?.name || req.user.name,
        username: data.users?.username || req.user.username,
        initials: (req.user.name || 'U').slice(0,2).toUpperCase(),
        text:     data.text,
        rating:   data.rating,
        time:     data.created_at,
      },
    })
  } catch (err) {
    console.error('Create comment error:', err)
    res.status(500).json({ message: 'Could not post comment' })
  }
}

// ── PUT /api/comments/:commentId ─────────────────────
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ message: 'Text is required' })

    const { data, error } = await supabaseAdmin
      .from('comments')
      .update({ text: text.trim(), updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select()
      .single()

    if (error) throw error
    res.status(200).json({ message: 'Comment updated', comment: data })
  } catch (err) {
    console.error('Update comment error:', err)
    res.status(500).json({ message: 'Could not update comment' })
  }
}

// ── DELETE /api/comments/:commentId ──────────────────
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const { error } = await supabaseAdmin.from('comments').delete().eq('id', commentId)
    if (error) throw error
    res.status(200).json({ message: 'Comment deleted' })
  } catch (err) {
    console.error('Delete comment error:', err)
    res.status(500).json({ message: 'Could not delete comment' })
  }
}
