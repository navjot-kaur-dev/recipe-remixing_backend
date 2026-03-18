import { supabaseAdmin } from '../config/supabaseClient.js'

// ── GET /api/meal-planner ────────────────────────────
export const getMealPlan = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('meal_plans')
      .select('plan')
      .eq('user_id', req.user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    res.status(200).json({ plan: data?.plan || {} })
  } catch (err) {
    console.error('GetMealPlan error:', err)
    res.status(500).json({ message: 'Could not fetch meal plan' })
  }
}

// ── POST /api/meal-planner ───────────────────────────
export const saveMealPlan = async (req, res) => {
  try {
    const { plan } = req.body
    if (!plan || typeof plan !== 'object') {
      return res.status(400).json({ message: 'Invalid plan data' })
    }

    // Upsert — insert if not exists, update if exists
    const { data, error } = await supabaseAdmin
      .from('meal_plans')
      .upsert(
        { user_id: req.user.id, plan, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) throw error

    res.status(200).json({ message: 'Meal plan saved', plan: data.plan })
  } catch (err) {
    console.error('SaveMealPlan error:', err)
    res.status(500).json({ message: 'Could not save meal plan' })
  }
}

// ── DELETE /api/meal-planner/:slotKey ────────────────
export const removeSlot = async (req, res) => {
  try {
    const { slotKey } = req.params

    // Fetch current plan
    const { data: existing } = await supabaseAdmin
      .from('meal_plans')
      .select('plan')
      .eq('user_id', req.user.id)
      .single()

    const currentPlan = existing?.plan || {}
    delete currentPlan[decodeURIComponent(slotKey)]

    const { error } = await supabaseAdmin
      .from('meal_plans')
      .upsert(
        { user_id: req.user.id, plan: currentPlan, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (error) throw error

    res.status(200).json({ message: 'Slot removed', plan: currentPlan })
  } catch (err) {
    console.error('RemoveSlot error:', err)
    res.status(500).json({ message: 'Could not remove meal plan slot' })
  }
}
