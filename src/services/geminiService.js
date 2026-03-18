import { geminiModel } from '../config/aiConfig.js'

// ── Helper: safely parse Gemini's text response as JSON ──
const parseGeminiJSON = (text) => {
  try {
    // Gemini sometimes wraps JSON in markdown code blocks — strip them
    const cleaned = text
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/gi, '')
      .trim()
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

// ── Recipe Suggestions from ingredients ──────────────
// Returns: [{ name, emoji, match, time, tags, description }]
export const getRecipeSuggestions = async (ingredients, dietary = '') => {
  const ingredientList = Array.isArray(ingredients)
    ? ingredients.join(', ')
    : ingredients

  const dietaryNote = dietary ? `Dietary restrictions: ${dietary}.` : ''

  const prompt = `
You are a professional chef AI assistant.
A user has these ingredients: ${ingredientList}.
${dietaryNote}

Suggest exactly 6 recipes they can make. Respond ONLY with a valid JSON array, no extra text.
Format:
[
  {
    "name": "Recipe Name",
    "emoji": "🍛",
    "match": 95,
    "time": "30 min",
    "tags": ["Indian", "Spicy"],
    "description": "One sentence about this dish."
  }
]

Rules:
- match is a number 0-100 showing how well it fits the ingredients
- Sort by match descending
- emoji must be a single food emoji
- Keep tags to 2 items max
`

  try {
    const result = await geminiModel.generateContent(prompt)
    const text   = result.response.text()
    const parsed = parseGeminiJSON(text)

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }

    // If JSON parse fails, return structured fallback
    console.warn('Gemini suggestions: could not parse JSON, using fallback')
    return getFallbackSuggestions(ingredientList)
  } catch (err) {
    console.error('Gemini suggestions error:', err.message)
    return getFallbackSuggestions(ingredientList)
  }
}

// ── Nutrition Analysis ───────────────────────────────
// Returns: { calories, protein, carbs, fat, fiber, vitamins[] }
export const analyzeNutrition = async (ingredientsText) => {
  const prompt = `
You are a nutrition expert AI.
Analyze the nutritional content of: ${ingredientsText}

Respond ONLY with a valid JSON object, no extra text:
{
  "calories": 450,
  "protein": 32,
  "carbs": 48,
  "fat": 18,
  "fiber": 6,
  "vitamins": ["Vitamin A", "Vitamin C", "Iron", "Calcium"]
}

Rules:
- All numeric values should be realistic estimates per serving
- vitamins array should list 3-5 key nutrients present
- calories is total kcal
- protein, carbs, fat, fiber are in grams
`

  try {
    const result = await geminiModel.generateContent(prompt)
    const text   = result.response.text()
    const parsed = parseGeminiJSON(text)

    if (parsed && typeof parsed.calories === 'number') {
      return parsed
    }

    console.warn('Gemini nutrition: could not parse JSON, using fallback')
    return { calories: 400, protein: 25, carbs: 45, fat: 15, fiber: 5, vitamins: ['Vitamin C', 'Iron', 'Calcium'] }
  } catch (err) {
    console.error('Gemini nutrition error:', err.message)
    return { calories: 400, protein: 25, carbs: 45, fat: 15, fiber: 5, vitamins: ['Vitamin C', 'Iron', 'Calcium'] }
  }
}

// ── Fallback suggestions when Gemini is unavailable ──
const getFallbackSuggestions = (ingredients) => [
  { name: 'Quick Stir Fry', emoji: '🥘', match: 90, time: '20 min', tags: ['Quick', 'Asian'], description: 'A fast and tasty stir fry with your available ingredients.' },
  { name: 'Simple Omelette', emoji: '🍳', match: 80, time: '10 min', tags: ['Breakfast', 'Easy'], description: 'A fluffy omelette perfect for any meal.' },
  { name: 'Veggie Bowl', emoji: '🥗', match: 75, time: '15 min', tags: ['Healthy', 'Quick'], description: 'A nutritious bowl using your fresh ingredients.' },
]
