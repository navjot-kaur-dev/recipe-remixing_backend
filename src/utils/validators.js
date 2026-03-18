export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const isValidPassword = (password) =>
  typeof password === 'string' && password.length >= 6

export const isValidUsername = (username) =>
  /^[a-zA-Z0-9_]{3,30}$/.test(username)

export const sanitizeString = (str) =>
  typeof str === 'string' ? str.trim() : ''

export const validateRecipe = (body) => {
  const errors = []
  if (!body.title?.trim())          errors.push('Title is required')
  if (!body.category?.trim())       errors.push('Category is required')
  if (!Array.isArray(body.ingredients) || body.ingredients.length === 0)
    errors.push('At least one ingredient is required')
  return errors
}
