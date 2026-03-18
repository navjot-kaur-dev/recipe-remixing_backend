import { supabaseAdmin } from '../config/supabaseClient.js'
import { generateRecipePDF } from '../services/pdfExportService.js'

// ── POST /api/recipes/:id/export-pdf ─────────────────
export const exportPDF = async (req, res) => {
  try {
    const { id } = req.params

    // Fetch full recipe with all related data
    const [recipeRes, ingrRes, nutrRes] = await Promise.all([
      supabaseAdmin.from('recipes_with_stats').select('*').eq('id', id).single(),
      supabaseAdmin.from('ingredients').select('*').eq('recipe_id', id),
      supabaseAdmin.from('nutrition').select('*').eq('recipe_id', id).single(),
    ])

    if (!recipeRes.data) {
      return res.status(404).json({ message: 'Recipe not found' })
    }

    const recipe = {
      ...recipeRes.data,
      author:      recipeRes.data.author || 'Chef',
      ingredients: ingrRes.data || [],
      nutrition:   nutrRes.data || null,
      time:        recipeRes.data.prep_time && recipeRes.data.cook_time
                     ? `${recipeRes.data.prep_time + recipeRes.data.cook_time} min`
                     : '',
    }

    const html = await generateRecipePDF(recipe)

    // Return as downloadable HTML file
    // The browser will open/save it — user can use browser Print → Save as PDF
    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Content-Disposition', `attachment; filename="${recipe.title.replace(/\s+/g, '-')}.html"`)
    res.status(200).send(html)
  } catch (err) {
    console.error('Export PDF error:', err)
    res.status(500).json({ message: 'Could not export recipe' })
  }
}
