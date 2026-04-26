import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const openai = new OpenAI({
  apiKey: process.env.DGRID_API_KEY,
  baseURL: 'https://api.dgrid.ai/v1',
});

app.post('/api/generate', async (req, res) => {
  try {
    const {
      prompt,
      genre = 'fantasy',
      characterName = 'Hero',
      characterLevel = 1,
    } = req.body || {};

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const safePrompt = prompt.trim().slice(0, 300);
    const safeGenre = String(genre).slice(0, 40);
    const safeCharacterName = String(characterName).slice(0, 80);
    const safeCharacterLevel = Number.isFinite(Number(characterLevel))
      ? Math.max(1, Math.min(100, Number(characterLevel)))
      : 1;

    const textResponse = await openai.chat.completions.create({
      model: 'qwen/qwen3.6-plus',
      messages: [{
        role: 'user',
        content: `Write a short engaging story: ${safePrompt}. Character: ${safeCharacterName} (Level ${safeCharacterLevel}). Genre: ${safeGenre}`
      }],
      max_tokens: 700,
      temperature: 0.85,
    });

    const content = textResponse.choices[0].message.content;

    const imagePrompt = `High quality digital art, ${safeGenre} scene: ${safePrompt}. Character ${safeCharacterName}. Masterpiece.`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=768&height=768&nologo=true&nofeed=true&model=flux`;

    res.json({
      content,
      title: safePrompt.slice(0, 40),
      imageUri: imageUrl,
      image_url: imageUrl,
    });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 InitStory backend running on http://localhost:${PORT}`);
  console.log('📝 Text model: qwen/qwen3.6-plus');
  console.log('🎨 Image model: Flux (Pollinations)');
});
