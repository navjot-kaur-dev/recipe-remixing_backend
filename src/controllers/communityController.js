import { supabaseAdmin } from '../config/supabaseClient.js'
import { formatTimeAgo } from '../utils/formatters.js'

// ── GET /api/community ───────────────────────────────
export const getThreads = async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    let query = supabaseAdmin
      .from('community_threads')
      .select('*, users(name, username, avatar_url)')
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    if (category && category !== 'All Topics') {
      query = query.eq('tag', category)
    }

    const { data, error } = await query
    if (error) throw error

    const threads = (data || []).map(t => ({
      id:       t.id,
      title:    t.title,
      body:     t.body,
      tag:      t.tag,
      author:   t.users?.name     || 'User',
      username: t.users?.username || '',
      initials: (t.users?.name || 'U').slice(0, 2).toUpperCase(),
      likes:    t.likes   || 0,
      replies:  t.replies || 0,
      time:     formatTimeAgo(t.created_at),
      createdAt: t.created_at,
    }))

    res.status(200).json({ threads })
  } catch (err) {
    console.error('GetThreads error:', err)
    res.status(500).json({ message: 'Could not fetch threads' })
  }
}

// ── GET /api/community/:id ───────────────────────────
export const getThread = async (req, res) => {
  try {
    const { id } = req.params

    const [threadRes, repliesRes] = await Promise.all([
      supabaseAdmin
        .from('community_threads')
        .select('*, users(name, username)')
        .eq('id', id)
        .single(),
      supabaseAdmin
        .from('thread_replies')
        .select('*, users(name, username)')
        .eq('thread_id', id)
        .order('created_at', { ascending: true }),
    ])

    if (threadRes.error || !threadRes.data) {
      return res.status(404).json({ message: 'Thread not found' })
    }

    const thread = threadRes.data
    const replies = (repliesRes.data || []).map(r => ({
      id:       r.id,
      text:     r.text,
      author:   r.users?.name || 'User',
      initials: (r.users?.name || 'U').slice(0, 2).toUpperCase(),
      time:     formatTimeAgo(r.created_at),
    }))

    res.status(200).json({
      thread: {
        id:       thread.id,
        title:    thread.title,
        body:     thread.body,
        tag:      thread.tag,
        author:   thread.users?.name || 'User',
        initials: (thread.users?.name || 'U').slice(0, 2).toUpperCase(),
        likes:    thread.likes   || 0,
        replies:  thread.replies || 0,
        time:     formatTimeAgo(thread.created_at),
      },
      replies,
    })
  } catch (err) {
    console.error('GetThread error:', err)
    res.status(500).json({ message: 'Could not fetch thread' })
  }
}

// ── POST /api/community ──────────────────────────────
export const createThread = async (req, res) => {
  try {
    const { title, body, tag } = req.body
    if (!title?.trim()) return res.status(400).json({ message: 'Thread title is required' })

    const { data, error } = await supabaseAdmin
      .from('community_threads')
      .insert({
        user_id: req.user.id,
        title:   title.trim(),
        body:    body || '',
        tag:     tag  || 'General',
        likes:   0,
        replies: 0,
      })
      .select('*, users(name, username)')
      .single()

    if (error) throw error

    res.status(201).json({
      message: 'Thread created',
      thread: {
        id:       data.id,
        title:    data.title,
        body:     data.body,
        tag:      data.tag,
        author:   data.users?.name || req.user.name,
        initials: (req.user.name || 'U').slice(0, 2).toUpperCase(),
        likes:    0,
        replies:  0,
        time:     'Just now',
      },
    })
  } catch (err) {
    console.error('CreateThread error:', err)
    res.status(500).json({ message: 'Could not create thread' })
  }
}

// ── POST /api/community/:id/reply ────────────────────
export const replyToThread = async (req, res) => {
  try {
    const { id: thread_id } = req.params
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ message: 'Reply text is required' })

    // Insert reply
    const { data, error } = await supabaseAdmin
      .from('thread_replies')
      .insert({ thread_id, user_id: req.user.id, text: text.trim() })
      .select()
      .single()

    if (error) throw error

    // Increment reply count on thread
    await supabaseAdmin.rpc('increment_thread_replies', { thread_id })
      .catch(() => {
        // If RPC not set up, do a manual update
        supabaseAdmin.from('community_threads')
          .select('replies').eq('id', thread_id).single()
          .then(({ data: t }) => {
            supabaseAdmin.from('community_threads')
              .update({ replies: (t?.replies || 0) + 1 })
              .eq('id', thread_id)
          })
      })

    res.status(201).json({
      message: 'Reply posted',
      reply: {
        id:       data.id,
        text:     data.text,
        author:   req.user.name,
        initials: req.user.name.slice(0, 2).toUpperCase(),
        time:     'Just now',
      },
    })
  } catch (err) {
    console.error('ReplyToThread error:', err)
    res.status(500).json({ message: 'Could not post reply' })
  }
}

// ── POST /api/community/:id/like ─────────────────────
export const toggleThreadLike = async (req, res) => {
  try {
    const { id: thread_id } = req.params
    const user_id = req.user.id

    const { data: existing } = await supabaseAdmin
      .from('thread_likes')
      .select('id')
      .eq('user_id', user_id)
      .eq('thread_id', thread_id)
      .single()

    // Get current likes count
    const { data: thread } = await supabaseAdmin
      .from('community_threads')
      .select('likes')
      .eq('id', thread_id)
      .single()

    const currentLikes = thread?.likes || 0

    if (existing) {
      await supabaseAdmin.from('thread_likes').delete().eq('id', existing.id)
      await supabaseAdmin.from('community_threads')
        .update({ likes: Math.max(0, currentLikes - 1) })
        .eq('id', thread_id)
      return res.status(200).json({ liked: false, likes: Math.max(0, currentLikes - 1) })
    } else {
      await supabaseAdmin.from('thread_likes').insert({ user_id, thread_id })
      await supabaseAdmin.from('community_threads')
        .update({ likes: currentLikes + 1 })
        .eq('id', thread_id)
      return res.status(200).json({ liked: true, likes: currentLikes + 1 })
    }
  } catch (err) {
    console.error('ToggleThreadLike error:', err)
    res.status(500).json({ message: 'Could not toggle like' })
  }
}
