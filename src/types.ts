export type ReflectionMode = 'reflection' | 'brainstorm' | 'summary' | 'action';

export type MoodType =
  | 'Inspired'
  | 'Contemplative'
  | 'Focused'
  | 'Optimistic'
  | 'Overwhelmed'
  | 'Grateful'
  | 'Resetting'
  | 'Inquisitive';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ReflectionAnalysis {
  title?: string;
  summary?: string;
  keyTakeaways?: string[];
  actionItems?: string[];
  detectedMood?: MoodType;
  suggestedTags?: string[];
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  mode: ReflectionMode;
  mood: MoodType;
  tags: string[];
  messages: ChatMessage[];
  summary?: string;
  keyTakeaways?: string[];
  actionItems?: string[];
  isPinned?: boolean;
  wordCount?: number;
  modelUsed?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SparkPrompt {
  id: string;
  title: string;
  prompt: string;
  tag: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: number;
  lastLoginAt: number;
}
