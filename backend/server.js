// InitStory Backend — Express server
// Handles AI generation via DGrid Gateway (OpenAI-compatible API)
// DGrid endpoint: https://api.dgrid.ai/v1
// Models used:
//   - Text:  anthropic/claude-3-5-haiku  (narrative generation)
//   - Image: openai/dall-e-3             (scene illustration)

import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// ─── DGrid AI Client (OpenAI-compatible) ────────────────────────────────────
const dgrid = new OpenAI({
  baseURL: 'https://api.dgrid.ai/v1',
  apiKey:  process.env.DGRID_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://initstory.app',
    'X-Title':      'InitStory',
  },
})

// ─── Genre → Narrative Style Map ────────────────────────────────────────────
const GENRE_STYLES = {
  fantasy:   'epic fantasy with magic, mythical creatures, and ancient prophecies',
  'sci-fi':  'hard science fiction with advanced technology, space exploration, and AI',
  mystery:   'atmospheric mystery with suspense, clues, and unexpected twists',
  adventure: 'pulse-pounding adventure with exploration, danger, and heroism',
}

// ─── POST /api/generate ─────────────────────────────────────────────────────
// Body: { prompt: string, genre: string, characterName: string, characterLevel: number }
// Returns: { content: string, imageUri: string, title: string }
app.post('/api/generate', async (req, res) => {
  const { prompt, genre = 'fantasy', characterName = 'the hero', characterLevel = 1 } = req.body

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'prompt is required' })
  }

  const style = GENRE_STYLES[genre] || GENRE_STYLES.fantasy

  try {
    // 1. Generate narrative text via DGrid → claude-3-5-haiku
    const textResponse = await dgrid.chat.completions.create({
      model: 'anthropic/claude-3-5-haiku',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: `You are a master storyteller specializing in ${style}.
Write immersive, vivid scenes in 3-4 paragraphs (max 350 words).
The story features ${characterName}, a level-${characterLevel} character.
Higher level characters face greater challenges and wield more power.
Always end with an intriguing hook. No chapter headings.`,
        },
        {
          role: 'user',
          content: prompt.trim(),
        },
      ],
    })

    const content = textResponse.choices[0].message.content.trim()

    // 2. Generate title (short follow-up call)
    const titleResponse = await dgrid.chat.completions.create({
      model: 'anthropic/claude-3-5-haiku',
      max_tokens: 20,
      messages: [
        {
          role: 'user',
          content: `Give a 3-6 word dramatic title for this story scene. Only the title, no quotes:\n\n${content.slice(0, 200)}`,
        },
      ],
    })
    const title = titleResponse.choices[0].message.content.trim()

    // 3. Generate scene image via DGrid → dall-e-3
    let imageUri = ''
    try {
      const imageResponse = await dgrid.images.generate({
        model:   'openai/dall-e-3',
        prompt:  `${style} scene: ${prompt.slice(0, 150)}. Cinematic, detailed, painterly illustration.`,
        n:       1,
        size:    '1024x1024',
        quality: 'standard',
      })
      imageUri = imageResponse.data[0].url || ''
    } catch (imgErr) {
      console.warn('Image generation failed, proceeding without image:', imgErr.message)
      // Fallback: use a placeholder so the mint can still proceed
      imageUri = `https://api.dicebear.com/8.x/shapes/svg?seed=${encodeURIComponent(prompt.slice(0, 30))}`
    }

    res.json({ content, title, imageUri })
  } catch (err) {
    console.error('Generation error:', err)
    res.status(500).json({ error: err.message || 'Generation failed' })
  }
})

// ─── GET /api/health ─────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`InitStory backend running on http://localhost:${PORT}`)
  console.log('DGrid AI Gateway:', 'https://api.dgrid.ai/v1')
  console.log('Text model:  anthropic/claude-3-5-haiku')
  console.log('Image model: openai/dall-e-3')
})
