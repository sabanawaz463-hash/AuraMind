import { ChatMessage, ReflectionMode, MoodType, ReflectionAnalysis, SparkPrompt } from '../types';

export interface ReflectRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  mode: ReflectionMode;
  mood: MoodType;
  tags: string[];
  title?: string;
}

export interface ReflectResponse {
  reply: string;
  modelUsed: string;
}

export interface SummarizeResponse {
  analysis: ReflectionAnalysis;
  modelUsed: string;
}

export interface SparkPromptsResponse {
  prompts: SparkPrompt[];
  modelUsed: string;
}

export async function sendReflectionPrompt(req: ReflectRequest): Promise<ReflectResponse> {
  const response = await fetch('/api/reflect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${response.status})`);
  }

  return response.json();
}

export async function summarizeConversation(
  messages: ChatMessage[],
  currentTitle?: string
): Promise<SummarizeResponse> {
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, currentTitle }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Synthesis failed (${response.status})`);
  }

  return response.json();
}

export async function fetchSparkPrompts(category?: string, mood?: MoodType): Promise<SparkPromptsResponse> {
  const response = await fetch('/api/spark-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, mood }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Prompt spark failed (${response.status})`);
  }

  return response.json();
}
