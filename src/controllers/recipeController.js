import { supabaseAdmin } from '../config/supabaseClient.js'
import { formatRecipe } from '../utils/formatters.js'
import { validateRecipe } from '../utils/validators.js'

// Helper — fetch ingredients, substitutions, nutrition for a recipe
const fetchRecipeExtras = async (recipeId) => {
  const [ingr, subst, nutr, comms] = await Promise.all([
    supabaseAdmin.from('ingredients').select('*').eq('recipe_id', recipeId),
    supabaseAdmin.from('substitutions').select('*').eq('recipe_id', recipeId),
    supabaseAdmin.from('nutrition').select('*').eq('recipe_id', recipeId).single(),
    supabaseAdmin.from('comments').select('*, users(name,username)').eq('recipe_id', recipeId).order('created_at', { ascending: false }).limit(10),
  ])
  return {
    ingredients:   (ingr.data || []).map(i => ({ name:i.name, amount:i.amount, unit:i.unit })),
    substitutions: (subst.data || []).map(s => ({ from:s.from_ing, to:s.to_ing })),
    nutrition:     nutr.data ? { calories:nutr.data.calories, protein:nutr.data.protein, carbs:nutr.data.carbs, fat:nutr.data.fat, fiber:nutr.data.fiber } : null,
    comments:      (comms.data || []).map(c => ({
      id:       c.id,
      user:     c.users?.name || 'User',
      username: c.users?.username || '',
      initials: (c.users?.name || 'U').slice(0,2).toUpperCase(),
      text:     c.text,
      rating:   c.rating,
      time:     c.created_at,
    })),
  }
}

// ── GET /api/recipes ─────────────────────────────────
export const getAll = async (req, res) => {
  try {
    const { q, category, page = 1, limit = 12, sort } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    let query = supabaseAdmin
      .from('recipes_with_stats')
      .select('*')
      .range(offset, offset + parseInt(limit) - 1)

    if (q)        query = query.ilike('title', `%${q}%`)
    if (category && category !== 'All') query = query.eq('category', category)
    if (sort === 'trending') query = query.order('views', { ascending: false })
    else query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query
    if (error) throw error

    res.status(200).json({
      recipes: (data || []).map(r => formatRecipe(r)),
      total:   count || data?.length || 0,
      page:    parseInt(page),
    })
  } catch (err) {
    console.error('GetAll recipes error:', err)
    res.status(500).json({ message: 'Could not fetch recipes' })
  }
}

// ── GET /api/recipes/trending ────────────────────────
export const getTrending = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('recipes_with_stats')
      .select('*')
      .order('views', { ascending: false })
      .limit(6)

    if (error) throw error
    res.status(200).json({ recipes: (data || []).map(r => formatRecipe(r)) })
  } catch (err) {
    console.error('GetTrending error:', err)
    res.status(500).json({ message: 'Could not fetch trending recipes' })
  }
}

// ── GET /api/recipes/:id ─────────────────────────────
export const getById = async (req, res) => {
  try {
    const { id } = req.params
    const { data: recipe, error } = await supabaseAdmin
      .from('recipes_with_stats')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !recipe) return res.status(404).json({ message: 'Recipe not found' })

    // Increment view count
    await supabaseAdmin.from('recipes').update({ views: (recipe.views || 0) + 1 }).eq('id', id)

    const extras  = await fetchRecipeExtras(id)
    res.status(200).json({ recipe: formatRecipe(recipe, extras) })
  } catch (err) {
    console.error('GetById error:', err)
    res.status(500).json({ message: 'Could not fetch recipe' })
  }
}

// ── POST /api/recipes ────────────────────────────────
export const create = async (req, res) => {
  try {
    const { title, description, emoji, category, cuisine, difficulty,
            prepTime, cookTime, servings, instructions, tags,
            videoUrl, imageUrl, ingredients, substitutions, nutrition,
            isCollaborative } = req.body

    const errors = validateRecipe({ title, category, ingredients })
    if (errors.length) return res.status(400).json({ message: errors[0] })

    // Insert recipe
    const { data: recipe, error } = await supabaseAdmin
      .from('recipes')
      .insert({
        user_id:          req.user.id,
        title:            title.trim(),
        description:      description || '',
        emoji:            emoji || '🍳',
        category,
        cuisine,
        difficulty:       difficulty || 'Medium',
        prep_time:        parseInt(prepTime) || 0,
        cook_time:        parseInt(cookTime) || 0,
        servings:         parseInt(servings) || 4,
        instructions:     instructions || '',
        tags:             tags || [],
        video_url:        videoUrl || '',
        image_url:        imageUrl || '',
        is_collaborative: isCollaborative || false,
      })
      .select()
      .single()

    if (error) throw error

    // Insert ingredients
    if (ingredients?.length) {
      const ingrRows = ingredients.filter(i => i.name).map(i => ({
        recipe_id: recipe.id,
        name:      i.name,
        amount:    parseFloat(i.amount) || 1,
        unit:      i.unit || '',
      }))
      if (ingrRows.length) await supabaseAdmin.from('ingredients').insert(ingrRows)
    }

    // Insert substitutions
    if (substitutions?.length) {
      const substRows = substitutions.filter(s => s.from && s.to).map(s => ({
        recipe_id: recipe.id,
        from_ing:  s.from,
        to_ing:    s.to,
      }))
      if (substRows.length) await supabaseAdmin.from('substitutions').insert(substRows)
    }

    // Insert nutrition
    if (nutrition) {
      await supabaseAdmin.from('nutrition').insert({
        recipe_id: recipe.id,
        calories:  nutrition.calories || 0,
        protein:   nutrition.protein  || 0,
        carbs:     nutrition.carbs    || 0,
        fat:       nutrition.fat      || 0,
        fiber:     nutrition.fiber    || 0,
      })
    }

    res.status(201).json({
      message: 'Recipe created successfully',
      id:      recipe.id,
      recipe:  formatRecipe(recipe),
    })
  } catch (err) {
    console.error('Create recipe error:', err)
    res.status(500).json({ message: 'Could not create recipe' })
  }
}

// ── PUT /api/recipes/:id ─────────────────────────────
export const update = async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, emoji, category, cuisine, difficulty,
            prepTime, cookTime, servings, instructions, tags,
            videoUrl, imageUrl } = req.body

    const { data, error } = await supabaseAdmin
      .from('recipes')
      .update({
        title, description, emoji, category, cuisine,
        difficulty,
        prep_time:   parseInt(prepTime) || 0,
        cook_time:   parseInt(cookTime) || 0,
        servings:    parseInt(servings) || 4,
        instructions, tags,
        video_url:   videoUrl,
        image_url:   imageUrl,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.status(200).json({ message: 'Recipe updated', recipe: formatRecipe(data) })
  } catch (err) {
    console.error('Update recipe error:', err)
    res.status(500).json({ message: 'Could not update recipe' })
  }
}

// ── DELETE /api/recipes/:id ──────────────────────────
export const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await supabaseAdmin.from('recipes').delete().eq('id', id)
    if (error) throw error
    res.status(200).json({ message: 'Recipe deleted successfully' })
  } catch (err) {
    console.error('Delete recipe error:', err)
    res.status(500).json({ message: 'Could not delete recipe' })
  }
}

// ── POST /api/recipes/upload ─────────────────────────
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    const filename  = `recipes/${req.user.id}-${Date.now()}-${req.file.originalname}`
    const { error } = await supabaseAdmin.storage
      .from('recipe-images')
      .upload(filename, req.file.buffer, { contentType: req.file.mimetype, upsert: true })

    if (error) throw error

    const { data: urlData } = supabaseAdmin.storage.from('recipe-images').getPublicUrl(filename)
    res.status(200).json({ imageUrl: urlData.publicUrl, url: urlData.publicUrl })
  } catch (err) {
    console.error('Upload image error:', err)
    res.status(500).json({ message: 'Image upload failed' })
  }
}
