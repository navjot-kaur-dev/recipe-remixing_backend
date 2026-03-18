// Format a raw recipe row (from Supabase) into the shape
// the frontend RecipeCard and RecipeDetailPage expect
export const formatRecipe = (recipe, extras = {}) => {
  if (!recipe) return null
  return {
    id:              recipe.id,
    title:           recipe.title,
    description:     recipe.description,
    emoji:           recipe.emoji || '🍳',
    imageUrl:        recipe.image_url || '',
    videoUrl:        recipe.video_url || '',
    author:          recipe.author  || recipe.author_name  || 'Chef',
    authorInitials:  (recipe.author || 'CH').slice(0, 2).toUpperCase(),
    authorId:        recipe.user_id,
    category:        recipe.category,
    cuisine:         recipe.cuisine,
    difficulty:      recipe.difficulty,
    prepTime:        recipe.prep_time,
    cookTime:        recipe.cook_time,
    time:            recipe.prep_time && recipe.cook_time
                       ? `${recipe.prep_time + recipe.cook_time} min`
                       : recipe.prep_time ? `${recipe.prep_time} min` : '',
    servings:        recipe.servings || 4,
    tags:            recipe.tags || [],
    instructions:    recipe.instructions || '',
    isCollaborative: recipe.is_collaborative || false,
    views:           recipe.views || 0,
    likes:           parseInt(recipe.likes_count) || 0,
    saves:           parseInt(recipe.saves_count) || 0,
    rating:          recipe.avg_rating
                       ? parseFloat(recipe.avg_rating).toFixed(1)
                       : '0.0',
    badge:           extras.badge || getTrendingBadge(recipe),
    colorClass:      extras.colorClass || 'warm',
    ingredients:     extras.ingredients || [],
    substitutions:   extras.substitutions || [],
    nutrition:       extras.nutrition || null,
    comments:        extras.comments || [],
    createdAt:       recipe.created_at,
    ...extras,
  }
}

// Format a raw user row into the safe public shape
export const formatUser = (user) => {
  if (!user) return null
  return {
    id:        user.id,
    name:      user.name,
    username:  user.username,
    email:     user.email,
    bio:       user.bio || '',
    avatarUrl: user.avatar_url || '',
    interests: user.interests || [],
    createdAt: user.created_at,
  }
}

// Format a comment row
export const formatComment = (comment) => ({
  id:       comment.id,
  user:     comment.user_name || comment.author || 'User',
  username: comment.username  || '',
  initials: (comment.user_name || 'U').slice(0, 2).toUpperCase(),
  text:     comment.text,
  rating:   comment.rating || 5,
  time:     formatTimeAgo(comment.created_at),
  createdAt: comment.created_at,
})

// Auto-assign a badge based on recipe popularity
const getTrendingBadge = (recipe) => {
  const likes = parseInt(recipe.likes_count) || 0
  const views = recipe.views || 0
  if (views > 30000 || likes > 2000) return '#1 Trending'
  if (views > 15000 || likes > 1000) return 'Trending'
  if (views > 5000)                  return 'Popular'
  return 'New'
}

// Human-readable time ago
export const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'recently'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days  < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}
