import { supabaseAdmin } from '../config/supabaseClient.js'

// ── POST /api/likes/recipe/:id (toggle) ──────────────
export const toggleRecipeLike = async (req, res) => {
  try {
    const { id: recipe_id } = req.params
    const user_id = req.user.id

    // Check if already liked
    const { data: existing } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('user_id', user_id)
      .eq('recipe_id', recipe_id)
      .single()

    if (existing) {
      // Unlike
      await supabaseAdmin.from('likes').delete().eq('id', existing.id)
      const { count } = await supabaseAdmin.from('likes').select('*', { count:'exact', head:true }).eq('recipe_id', recipe_id)
      return res.status(200).json({ liked: false, likesCount: count || 0 })
    } else {
      // Like
      await supabaseAdmin.from('likes').insert({ user_id, recipe_id })
      const { count } = await supabaseAdmin.from('likes').select('*', { count:'exact', head:true }).eq('recipe_id', recipe_id)
      return res.status(200).json({ liked: true, likesCount: count || 0 })
    }
  } catch (err) {
    console.error('Toggle like error:', err)
    res.status(500).json({ message: 'Could not toggle like' })
  }
}

// ── GET /api/likes/recipe/:id ────────────────────────
export const getRecipeLikes = async (req, res) => {
  try {
    const { id: recipe_id } = req.params

    const { count } = await supabaseAdmin
      .from('likes')
      .select('*', { count:'exact', head:true })
      .eq('recipe_id', recipe_id)

    let userLiked = false
    if (req.user) {
      const { data } = await supabaseAdmin
        .from('likes')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('recipe_id', recipe_id)
        .single()
      userLiked = !!data
    }

    res.status(200).json({ likesCount: count || 0, userLiked })
  } catch (err) {
    console.error('GetRecipeLikes error:', err)
    res.status(500).json({ message: 'Could not fetch likes' })
  }
}
