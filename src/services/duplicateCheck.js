import { supabaseAdmin } from '../config/supabaseClient.js'
import { geminiModel } from '../config/aiConfig.js'

// ── Check if a recipe already exists in the database ──
// Strategy:
//   1. Fast DB check — look for exact or near-exact title matches
//   2. If suspicious match found, use Gemini to compare ingredients
//   Returns: { isDuplicate: bool, similarRecipe?: { id, title }, confidence: number }

export const checkDuplicate = async (title, ingredients = []) => {
  try {
    // Step 1: Fast fuzzy title search in DB
    const { data: similarTitles } = await supabaseAdmin
      .from('recipes')
      .select('id, title')
      .ilike('title', `%${title.slice(0, 20)}%`)
      .limit(5)

    if (!similarTitles?.length) {
      return { isDuplicate: false, confidence: 0 }
    }

    // Step 2: If we found a very close title match, check with Gemini
    const exactMatch = similarTitles.find(
      r => r.title.toLowerCase().trim() === title.toLowerCase().trim()
    )

    if (exactMatch) {
      return {
        isDuplicate:   true,
        confidence:    100,
        similarRecipe: { id: exactMatch.id, title: exactMatch.title },
        message:       `A recipe named "${exactMatch.title}" already exists.`,
      }
    }

    // Step 3: Use Gemini to intelligently compare if ingredients are provided
    if (ingredients.length > 0 && similarTitles.length > 0) {
      const ingredientsList = ingredients.join(', ')
      const existingTitles  = similarTitles.map(r => r.title).join(', ')

      const prompt = `
You are a recipe similarity checker.
New recipe title: "${title}"
New recipe ingredients: ${ingredientsList}
Existing similar recipe titles in our database: ${existingTitles}

Is the new recipe a duplicate or very similar to any of the existing ones?
Respond ONLY with valid JSON, no other text:
{
  "isDuplicate": false,
  "confidence": 20,
  "reason": "Short explanation"
}
confidence is 0-100. Use 80+ for likely duplicates.
`

      try {
        const result  = await geminiModel.generateContent(prompt)
        const text    = result.response.text()
        const cleaned = text.replace(/```json\n?/gi,'').replace(/```\n?/gi,'').trim()
        const parsed  = JSON.parse(cleaned)

        return {
          isDuplicate:   parsed.isDuplicate && parsed.confidence >= 70,
          confidence:    parsed.confidence  || 0,
          similarRecipe: parsed.isDuplicate ? similarTitles[0] : null,
          message:       parsed.reason,
        }
      } catch {
        // Gemini comparison failed — be conservative, say not a duplicate
        return { isDuplicate: false, confidence: 20 }
      }
    }

    // Similar titles found but no definitive match
    return {
      isDuplicate:   false,
      confidence:    30,
      similarRecipe: similarTitles[0],
      message:       `Found a recipe with a similar name: "${similarTitles[0].title}". Consider differentiating your recipe.`,
    }
  } catch (err) {
    console.error('DuplicateCheck error:', err)
    return { isDuplicate: false, confidence: 0 }
  }
}
