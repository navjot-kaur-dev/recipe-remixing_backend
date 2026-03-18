// ── PDF Export Service ────────────────────────────────
// Generates a simple HTML-based PDF recipe card.
// Since we avoid heavy PDF libraries, we generate an
// HTML string and return it with proper headers so the
// browser renders it as a printable document.
//
// To upgrade to a real PDF (binary), install:
//   npm install puppeteer
// Then use the puppeteer block commented out below.

export const generateRecipePDF = async (recipe) => {
  const ingredientRows = (recipe.ingredients || [])
    .map(i => `<tr><td style="padding:6px 12px;border-bottom:1px solid #f0ede4">${i.name}</td><td style="padding:6px 12px;border-bottom:1px solid #f0ede4;color:#c84b11;font-weight:600">${i.amount || ''} ${i.unit || ''}</td></tr>`)
    .join('')

  const instructionSteps = (recipe.instructions || '')
    .split('\n')
    .filter(Boolean)
    .map((step, i) => `<div style="display:flex;gap:14px;margin-bottom:14px"><div style="min-width:28px;height:28px;background:#c84b11;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px">${i+1}</div><p style="color:#5a4f38;line-height:1.7;margin:0;padding-top:4px">${step}</p></div>`)
    .join('')

  const tags = (recipe.tags || [])
    .map(t => `<span style="background:#faebd0;color:#8b4513;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600">${t}</span>`)
    .join(' ')

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${recipe.title} — RecipeRemixing</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; background: #faf8f3; color: #1a1208; padding: 40px; max-width: 800px; margin: 0 auto; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div style="border-bottom:3px solid #c84b11;padding-bottom:20px;margin-bottom:24px">
    <div style="font-size:13px;color:#c84b11;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">RecipeRemixing</div>
    <h1 style="font-size:32px;font-weight:700;color:#1a1208;margin-bottom:8px">${recipe.emoji || '🍳'} ${recipe.title}</h1>
    <p style="color:#5a4f38;margin-bottom:12px">${recipe.description || ''}</p>
    <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:#9a8f78">
      <span>👤 ${recipe.author || 'Chef'}</span>
      ${recipe.time ? `<span>⏱ ${recipe.time}</span>` : ''}
      ${recipe.servings ? `<span>👥 ${recipe.servings} servings</span>` : ''}
      ${recipe.difficulty ? `<span>📊 ${recipe.difficulty}</span>` : ''}
    </div>
    ${tags ? `<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">${tags}</div>` : ''}
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px">
    <div>
      <h2 style="font-size:18px;margin-bottom:14px;color:#1a1208;border-bottom:1px solid #f0ede4;padding-bottom:8px">Ingredients</h2>
      <table style="width:100%;border-collapse:collapse">
        <tbody>${ingredientRows}</tbody>
      </table>
      ${recipe.nutrition ? `
      <div style="margin-top:24px">
        <h2 style="font-size:18px;margin-bottom:14px;color:#1a1208;border-bottom:1px solid #f0ede4;padding-bottom:8px">Nutrition</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
          <div style="background:#fff;padding:8px 12px;border-radius:8px"><div style="color:#c84b11;font-weight:700;font-size:18px">${recipe.nutrition.calories}</div><div style="color:#9a8f78">Calories</div></div>
          <div style="background:#fff;padding:8px 12px;border-radius:8px"><div style="color:#2d6a4f;font-weight:700;font-size:18px">${recipe.nutrition.protein}g</div><div style="color:#9a8f78">Protein</div></div>
          <div style="background:#fff;padding:8px 12px;border-radius:8px"><div style="color:#e8a020;font-weight:700;font-size:18px">${recipe.nutrition.carbs}g</div><div style="color:#9a8f78">Carbs</div></div>
          <div style="background:#fff;padding:8px 12px;border-radius:8px"><div style="color:#c84b11;font-weight:700;font-size:18px">${recipe.nutrition.fat}g</div><div style="color:#9a8f78">Fat</div></div>
        </div>
      </div>` : ''}
    </div>

    <div>
      <h2 style="font-size:18px;margin-bottom:14px;color:#1a1208;border-bottom:1px solid #f0ede4;padding-bottom:8px">Instructions</h2>
      ${instructionSteps}
    </div>
  </div>

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #f0ede4;font-size:12px;color:#9a8f78;text-align:center">
    Exported from RecipeRemixing • Cook. Share. Remix Together.
  </div>
</body>
</html>`

  return html
}

// ── Puppeteer upgrade (optional) ─────────────────────
// If you want a real binary PDF instead of HTML, run:
//   npm install puppeteer
// Then replace generateRecipePDF with:
//
// import puppeteer from 'puppeteer'
// export const generateRecipePDF = async (recipe) => {
//   const html    = await buildHTML(recipe) // same html above
//   const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
//   const page    = await browser.newPage()
//   await page.setContent(html, { waitUntil: 'networkidle0' })
//   const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
//   await browser.close()
//   return pdfBuffer
// }
