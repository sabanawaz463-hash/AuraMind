import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

const MODEL_FALLBACK_LADDER = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

interface FallbackOptions {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
}

async function generateContentWithFallback(options: FallbackOptions) {
  const ai = getGenAI();
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.7,
        },
      });

      if (response && response.text) {
        return {
          text: response.text,
          modelUsed: modelName,
        };
      }
    } catch (err: any) {
      lastError = err;
      const statusCode = err?.status || err?.statusCode || (err?.message?.includes('429') ? 429 : 500);
      const isRecoverable =
        statusCode === 429 ||
        statusCode === 503 ||
        statusCode === 500 ||
        statusCode === 404 ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('UNAVAILABLE') ||
        err?.message?.includes('not found');

      console.warn(`[Gemini Fallback] Model ${modelName} failed: ${err.message}. Recoverable: ${isRecoverable}`);
      if (!isRecoverable && MODEL_FALLBACK_LADDER.indexOf(modelName) === MODEL_FALLBACK_LADDER.length - 1) {
        break;
      }
    }
  }

  throw lastError || new Error('All models in the resilient fallback ladder failed.');
}

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.post('/api/reflect', async (req: Request, res: Response) => {
  try {
    const data = req.body && typeof req.body === 'object' ? req.body : {};
    const { messages, mode, mood, tags } = data;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Valid messages array is required.' });
    }

    const modeDescriptions: Record<string, string> = {
      reflection: 'You are an empathetic, insightful philosophical reflection coach. Validate feelings, ask meaningful Socratic questions, illuminate subconscious assumptions, and help the user find emotional clarity and deep self-awareness.',
      brainstorm: 'You are a creative brainstorming partner and strategic catalyst. Challenge routine thinking, expand possibilities with novel lateral angles, offer surprising connections, and explore innovative solutions.',
      summary: 'You are a master synthesizer and cognitive clarity analyst. Distill core themes, detect behavioral patterns, highlight latent insights, and summarize the key essence into crisp, structured takeaways.',
      action: 'You are an executive productivity strategist and accountability coach. Turn fuzzy reflections into concrete, prioritized next steps, low-friction micro-habits, and clear action items.',
    };

    const selectedMode = typeof mode === 'string' && modeDescriptions[mode] ? mode : 'reflection';
    const systemPrompt = `You are AuraMind, an advanced, deeply mindful AI companion built for authentic journaling, deep self-reflection, and creative thinking.
Mode of Operation: ${modeDescriptions[selectedMode]}
Current user mood: ${mood || 'Not specified'}.
Current entry topic/tags: ${Array.isArray(tags) ? tags.join(', ') : 'None'}.

Instructions:
1. Always format your responses using clean Markdown with rich formatting (headings, lists, quotes, bold highlights).
2. Avoid generic platitudes, repetitive SaaS buzzwords, or unsolicited patronizing advice.
3. Be genuine, thoughtful, articulate, and deeply respectful of the user's personal thoughts.
4. Keep paragraph breaks generous for easy reading.
5. If the user shares deep vulnerability or challenges, offer balanced perspective and gentle inquiry.`;

    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content || m.text || '') }],
    }));

    const result = await generateContentWithFallback({
      contents: formattedContents,
      systemInstruction: systemPrompt,
      temperature: selectedMode === 'brainstorm' ? 0.85 : 0.65,
    });

    return res.json({
      reply: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('[API /api/reflect Error]:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate reflection response.',
    });
  }
});

app.post('/api/summarize', async (req: Request, res: Response) => {
  try {
    const data = req.body && typeof req.body === 'object' ? req.body : {};
    const { messages, currentTitle } = data;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Valid messages array is required.' });
    }

    const conversationTranscript = messages
      .map((m: any) => `${m.role === 'user' ? 'User' : 'AuraMind'}: ${m.content || m.text || ''}`)
      .join('\n\n');

    const prompt = `Analyze this journaling and reflection conversation transcript and extract structured synthesis.

Transcript:
"""
${conversationTranscript}
"""

Return your analysis in strict JSON format matching this schema:
{
  "title": "A crisp, memorable 3 to 6 word title capturing the central theme",
  "summary": "A 2 to 3 sentence high-level executive summary of what was explored and discovered",
  "keyTakeaways": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "actionItems": ["Actionable step 1", "Actionable step 2"],
  "detectedMood": "One of: Inspired | Contemplative | Focused | Optimistic | Overwhelmed | Grateful | Resetting | Inquisitive",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}

Do not include backticks around json or wrap in markdown block if possible, output strictly the valid raw JSON.`;

    const result = await generateContentWithFallback({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: 'You are a precise JSON distillation engine for personal reflections.',
      temperature: 0.3,
    });

    let parsed;
    try {
      const cleanJson = result.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {
        title: currentTitle || 'Journal Reflection',
        summary: result.text.slice(0, 300),
        keyTakeaways: ['Deep reflection session captured'],
        actionItems: [],
        detectedMood: 'Contemplative',
        suggestedTags: ['reflection', 'journal'],
      };
    }

    return res.json({
      analysis: parsed,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('[API /api/summarize Error]:', error);
    return res.status(500).json({
      error: error.message || 'Failed to synthesize reflection summary.',
    });
  }
});

app.post('/api/spark-prompts', async (req: Request, res: Response) => {
  try {
    const data = req.body && typeof req.body === 'object' ? req.body : {};
    const { category, mood } = data;

    const prompt = `Generate 5 diverse, deeply thought-provoking, non-cliché journaling prompts for a user feeling "${mood || 'open'}" who wants to explore "${category || 'personal growth'}".
Return strictly valid JSON array of objects:
[
  { "id": "1", "title": "Short prompt title", "prompt": "The detailed reflection question or thought experiment", "tag": "growth" },
  ...
]`;

    const result = await generateContentWithFallback({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: 'You are a master journaling curator that designs original, non-generic reflection questions.',
      temperature: 0.8,
    });

    let prompts = [];
    try {
      const cleanJson = result.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      prompts = JSON.parse(cleanJson);
    } catch {
      prompts = [
        { id: '1', title: 'Unexamined Assumptions', prompt: 'What belief did you rely on today that might not be 100% true?', tag: 'clarity' },
        { id: '2', title: 'Energy Audit', prompt: 'What activity or conversation gave you energy, and what drained it?', tag: 'energy' },
        { id: '3', title: 'Future Self Perspective', prompt: 'Looking back at this week from 10 years in the future, what will have mattered most?', tag: 'perspective' },
        { id: '4', title: 'Creative Spark', prompt: 'If failure were impossible, what unconventional experiment would you begin tomorrow?', tag: 'creation' },
      ];
    }

    return res.json({ prompts, modelUsed: result.modelUsed });
  } catch (error: any) {
    console.error('[API /api/spark-prompts Error]:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate spark prompts.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AuraMind Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
