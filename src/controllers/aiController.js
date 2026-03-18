import { getRecipeSuggestions, analyzeNutrition } from '../services/geminiService.js'
import { checkDuplicate } from '../services/duplicateCheck.js'

// ── POST /api/ai/suggestions ─────────────────────────
export const getSuggestions = async (req, res) => {
  try {
    const { ingredients, dietary } = req.body

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ message: 'At least one ingredient is required' })
    }

    const suggestions = await getRecipeSuggestions(ingredients, dietary || '')

    res.status(200).json({ suggestions })
  } catch (err) {
    console.error('AI suggestions error:', err)
    res.status(500).json({ message: 'Could not generate suggestions' })
  }
}

// ── POST /api/ai/nutrition ───────────────────────────
export const getNutrition = async (req, res) => {
  try {
    const { ingredients } = req.body

    if (!ingredients) {
      return res.status(400).json({ message: 'Ingredients text is required' })
    }

    const nutrition = await analyzeNutrition(ingredients)

    res.status(200).json({ nutrition })
  } catch (err) {
    console.error('AI nutrition error:', err)
    res.status(500).json({ message: 'Could not analyze nutrition' })
  }
}

// ── POST /api/ai/duplicate-check ─────────────────────
export const duplicateCheck = async (req, res) => {
  try {
    const { title, ingredients } = req.body

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Recipe title is required' })
    }

    const result = await checkDuplicate(title, ingredients || [])

    res.status(200).json(result)
  } catch (err) {
    console.error('AI duplicate check error:', err)
    res.status(500).json({ message: 'Could not check recipe uniqueness' })
  }
}
