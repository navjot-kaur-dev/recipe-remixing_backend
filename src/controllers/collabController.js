import { supabaseAdmin } from '../config/supabaseClient.js'

// ── POST /api/collab/invite/:recipeId ────────────────
export const inviteCollaborator = async (req, res) => {
  try {
    const { recipeId } = req.params
    const { email } = req.body

    if (!email) return res.status(400).json({ message: 'Email is required' })

    // Find the user to invite
    const { data: invitedUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !invitedUser) {
      return res.status(404).json({ message: 'No user found with that email address' })
    }

    if (invitedUser.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot invite yourself' })
    }

    // Add collaborator
    const { error } = await supabaseAdmin
      .from('collaborators')
      .insert({ recipe_id: recipeId, user_id: invitedUser.id, role: 'editor' })

    if (error && error.message.includes('duplicate')) {
      return res.status(409).json({ message: `${invitedUser.name} is already a collaborator` })
    }
    if (error) throw error

    // Mark recipe as collaborative
    await supabaseAdmin
      .from('recipes')
      .update({ is_collaborative: true })
      .eq('id', recipeId)

    res.status(200).json({
      message: `${invitedUser.name} has been added as a collaborator`,
      collaborator: { id: invitedUser.id, name: invitedUser.name, email: invitedUser.email },
    })
  } catch (err) {
    console.error('InviteCollaborator error:', err)
    res.status(500).json({ message: 'Could not invite collaborator' })
  }
}

// ── GET /api/collab/:recipeId ────────────────────────
export const getCollaborators = async (req, res) => {
  try {
    const { recipeId } = req.params

    const { data, error } = await supabaseAdmin
      .from('collaborators')
      .select('role, users(id, name, username, avatar_url)')
      .eq('recipe_id', recipeId)

    if (error) throw error

    const collaborators = (data || []).map(c => ({
      id:        c.users?.id,
      name:      c.users?.name,
      username:  c.users?.username,
      avatarUrl: c.users?.avatar_url,
      role:      c.role,
    }))

    res.status(200).json({ collaborators })
  } catch (err) {
    console.error('GetCollaborators error:', err)
    res.status(500).json({ message: 'Could not fetch collaborators' })
  }
}

// ── PUT /api/collab/:recipeId ────────────────────────
export const saveCollabEdit = async (req, res) => {
  try {
    const { recipeId } = req.params

    // Verify user is a collaborator or owner
    const [ownerRes, collabRes] = await Promise.all([
      supabaseAdmin.from('recipes').select('user_id').eq('id', recipeId).single(),
      supabaseAdmin.from('collaborators').select('id').eq('recipe_id', recipeId).eq('user_id', req.user.id).single(),
    ])

    const isOwner = ownerRes.data?.user_id === req.user.id
    const isCollab = !!collabRes.data

    if (!isOwner && !isCollab) {
      return res.status(403).json({ message: 'Not authorised to edit this recipe' })
    }

    const { title, description, instructions, ingredients, tags } = req.body

    const { data, error } = await supabaseAdmin
      .from('recipes')
      .update({ title, description, instructions, tags, updated_at: new Date().toISOString() })
      .eq('id', recipeId)
      .select()
      .single()

    if (error) throw error

    res.status(200).json({ message: 'Collaborative edit saved', recipe: data })
  } catch (err) {
    console.error('SaveCollabEdit error:', err)
    res.status(500).json({ message: 'Could not save edit' })
  }
}
