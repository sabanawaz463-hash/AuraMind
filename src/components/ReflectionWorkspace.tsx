import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Tag,
  CheckCircle,
  FileDown,
  CloudCheck,
  CloudUpload,
  AlertCircle,
  CheckSquare,
  Square,
  Plus,
  X,
  Compass,
  Lightbulb,
  FileText,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  JournalEntry,
  ChatMessage,
  ReflectionMode,
  MoodType,
  ReflectionAnalysis,
} from '../types';
import { sendReflectionPrompt, summarizeConversation } from '../lib/api';
import { SpeechInputButton } from './SpeechInputButton';

interface ReflectionWorkspaceProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: Partial<JournalEntry>) => Promise<void>;
  onOpenExportModal: () => void;
  onOpenSparkModal: () => void;
  saveStatus: 'saved' | 'saving' | 'error';
  onRetrySave: () => void;
}

const MODES: Array<{
  id: ReflectionMode;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    id: 'reflection',
    label: 'Introspection',
    desc: 'Empathetic inquiry & deep emotional clarity',
    icon: Compass,
    color: 'text-amber-700 bg-amber-50 border-amber-300',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm',
    desc: 'Lateral angles & divergent ideation',
    icon: Lightbulb,
    color: 'text-blue-700 bg-blue-50 border-blue-300',
  },
  {
    id: 'summary',
    label: 'Synthesis',
    desc: 'Core takeaways & distilled themes',
    icon: FileText,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
  },
  {
    id: 'action',
    label: 'Action Plan',
    desc: 'Prioritized steps & micro-habits',
    icon: Target,
    color: 'text-indigo-700 bg-indigo-50 border-indigo-300',
  },
];

const MOODS: MoodType[] = [
  'Contemplative',
  'Inspired',
  'Focused',
  'Optimistic',
  'Grateful',
  'Overwhelmed',
  'Resetting',
  'Inquisitive',
];

export const ReflectionWorkspace: React.FC<ReflectionWorkspaceProps> = ({
  entry,
  onUpdateEntry,
  onOpenExportModal,
  onOpenSparkModal,
  saveStatus,
  onRetrySave,
}) => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastModelUsed, setLastModelUsed] = useState<string | null>(entry.modelUsed || null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages, isGenerating]);

  // Adjust textarea height dynamically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || isGenerating) return;

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const newMessages = [...entry.messages, userMessage];

    // Optimistically update entry messages
    await onUpdateEntry({
      messages: newMessages,
      updatedAt: Date.now(),
      // Auto-generate title from first prompt if untitled
      title:
        entry.title === 'Untitled Reflection' || !entry.title
          ? textToSend.slice(0, 40) + (textToSend.length > 40 ? '...' : '')
          : entry.title,
    });

    if (!customPrompt) {
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }

    setIsGenerating(true);

    try {
      const response = await sendReflectionPrompt({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        mode: entry.mode,
        mood: entry.mood,
        tags: entry.tags || [],
        title: entry.title,
      });

      const assistantMessage: ChatMessage = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        role: 'assistant',
        content: response.reply,
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setLastModelUsed(response.modelUsed);

      // Persist full conversation with response model
      await onUpdateEntry({
        messages: finalMessages,
        modelUsed: response.modelUsed,
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      console.error('Error generating reflection reply:', err);
      const errorMessage: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: `*Note: Unable to complete reflection response due to connection issue: ${err.message}. Please click Retry.*`,
        timestamp: Date.now(),
      };
      await onUpdateEntry({
        messages: [...newMessages, errorMessage],
        updatedAt: Date.now(),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (entry.messages.length === 0 || isSummarizing) return;
    setIsSummarizing(true);
    try {
      const res = await summarizeConversation(entry.messages, entry.title);
      if (res.analysis) {
        const analysis = res.analysis;
        await onUpdateEntry({
          title: analysis.title || entry.title,
          summary: analysis.summary || '',
          keyTakeaways: analysis.keyTakeaways || [],
          actionItems: analysis.actionItems || [],
          mood: analysis.detectedMood || entry.mood,
          tags: Array.from(new Set([...(entry.tags || []), ...(analysis.suggestedTags || [])])),
          updatedAt: Date.now(),
        });

        // Trigger celebratory confetti
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#D97706', '#B45309', '#F59E0B'],
        });
      }
    } catch (err) {
      console.error('Error summarizing session:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const cleanTag = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (!entry.tags.includes(cleanTag)) {
      onUpdateEntry({
        tags: [...entry.tags, cleanTag],
        updatedAt: Date.now(),
      });
    }
    setNewTagInput('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateEntry({
      tags: entry.tags.filter((t) => t !== tagToRemove),
      updatedAt: Date.now(),
    });
  };

  const handleToggleActionItem = (actionIndex: number) => {
    if (!entry.actionItems) return;
    const items = [...entry.actionItems];
    const item = items[actionIndex];
    if (item.startsWith('[DONE] ')) {
      items[actionIndex] = item.replace('[DONE] ', '');
    } else {
      items[actionIndex] = '[DONE] ' + item;
    }
    onUpdateEntry({ actionItems: items, updatedAt: Date.now() });
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-stone-50/50 overflow-hidden">
      {/* Top Session Control Bar */}
      <div className="border-b border-stone-200/80 bg-white px-4 sm:px-6 py-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Title and Cloud Save State */}
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <input
              id="reflection-title-input"
              type="text"
              value={entry.title}
              onChange={(e) => onUpdateEntry({ title: e.target.value, updatedAt: Date.now() })}
              placeholder="Untitled Reflection..."
              className="font-serif text-lg sm:text-xl font-bold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-amber-600 focus:outline-none w-full truncate py-0.5"
            />
            {/* Status indicator */}
            <div className="shrink-0 flex items-center text-xs">
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-medium">
                  <CheckCircle className="h-3 w-3" />
                  <span className="hidden sm:inline">Saved</span>
                </span>
              )}
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 font-medium animate-pulse">
                  <CloudUpload className="h-3 w-3" />
                  <span className="hidden sm:inline">Saving...</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <button
                  onClick={onRetrySave}
                  className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-semibold hover:bg-rose-100"
                >
                  <AlertCircle className="h-3 w-3" />
                  <span>Retry Save</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {entry.messages.length > 0 && (
              <button
                id="synthesize-insights-btn"
                onClick={handleGenerateSummary}
                disabled={isSummarizing || isGenerating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 active:scale-95 disabled:opacity-50 transition"
              >
                <Sparkles className={`h-3.5 w-3.5 ${isSummarizing ? 'animate-spin' : ''}`} />
                <span>{isSummarizing ? 'Synthesizing...' : 'Synthesize Insights'}</span>
              </button>
            )}

            <button
              id="export-reflection-btn"
              onClick={onOpenExportModal}
              title="Export reflection as Markdown, Text, or JSON"
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Mode Selector & Mood Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-stone-100">
          {/* Modes */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mr-1 shrink-0">
              Mode:
            </span>
            {MODES.map((m) => {
              const Icon = m.icon;
              const isSelected = entry.mode === m.id;
              return (
                <button
                  key={m.id}
                  id={`mode-btn-${m.id}`}
                  onClick={() => onUpdateEntry({ mode: m.id, updatedAt: Date.now() })}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    isSelected
                      ? `${m.color} shadow-xs ring-1 ring-stone-900/10`
                      : 'bg-stone-100/80 text-stone-600 hover:bg-stone-200/80'
                  }`}
                  title={m.desc}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mood Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
              Mood:
            </span>
            <select
              id="mood-select"
              value={entry.mood || 'Contemplative'}
              onChange={(e) =>
                onUpdateEntry({ mood: e.target.value as MoodType, updatedAt: Date.now() })
              }
              className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-medium text-stone-800 focus:border-amber-500 focus:outline-none"
            >
              {MOODS.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags Row */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pt-1">
          <Tag className="h-3 w-3 text-stone-400" />
          {entry.tags?.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700"
            >
              #{tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}

          {showTagInput ? (
            <div className="inline-flex items-center gap-1">
              <input
                type="text"
                placeholder="tag name"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="w-20 rounded border border-amber-400 px-1.5 py-0.5 text-[11px] focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleAddTag}
                className="rounded bg-stone-900 px-1.5 py-0.5 text-[10px] text-white"
              >
                Add
              </button>
              <button
                onClick={() => setShowTagInput(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center gap-0.5 rounded border border-dashed border-stone-300 px-1.5 py-0.5 text-[11px] text-stone-500 hover:border-stone-500"
            >
              <Plus className="h-3 w-3" />
              <span>Tag</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Conversation & Reflection Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Synthesis Banner if available */}
        {entry.summary && (
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/90 to-orange-50/50 p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-700" />
                <h3 className="font-serif text-sm font-bold text-amber-950">
                  AI Executive Synthesis
                </h3>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                Synthesized by Gemini
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
              {entry.summary}
            </p>

            {/* Key Takeaways */}
            {entry.keyTakeaways && entry.keyTakeaways.length > 0 && (
              <div className="mt-3 pt-3 border-t border-amber-200/60">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-900 mb-1.5">
                  Key Insights:
                </h4>
                <ul className="space-y-1 text-xs text-stone-700 list-disc list-inside">
                  {entry.keyTakeaways.map((takeaway, i) => (
                    <li key={i}>{takeaway}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {entry.actionItems && entry.actionItems.length > 0 && (
              <div className="mt-3 pt-3 border-t border-amber-200/60">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-900 mb-1.5">
                  Actionable Steps:
                </h4>
                <div className="space-y-1.5">
                  {entry.actionItems.map((action, i) => {
                    const isDone = action.startsWith('[DONE] ');
                    const cleanText = isDone ? action.replace('[DONE] ', '') : action;
                    return (
                      <div
                        key={i}
                        onClick={() => handleToggleActionItem(i)}
                        className="flex items-start gap-2 cursor-pointer group text-xs"
                      >
                        {isDone ? (
                          <CheckSquare className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-stone-400 group-hover:text-stone-700 mt-0.5 shrink-0" />
                        )}
                        <span
                          className={`${
                            isDone ? 'line-through text-stone-400' : 'text-stone-800 font-medium'
                          }`}
                        >
                          {cleanText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State Prompt Suggestions */}
        {entry.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60 mb-4 shadow-xs">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Begin Your Reflection
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-500 max-w-md leading-relaxed">
              Write freely about your day, a challenging emotion, a creative dilemma, or an upcoming goal.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <button
                onClick={onOpenSparkModal}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs transition active:scale-95"
              >
                <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                <span>Explore AI Spark Prompts</span>
              </button>
            </div>
          </div>
        )}

        {/* Messages Transcript */}
        {entry.messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isCopied = copiedId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-3xl ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isUser
                    ? 'bg-stone-900 text-white'
                    : 'bg-amber-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Bubble */}
              <div className="group relative flex-1 min-w-0">
                <div
                  className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-stone-900 text-white rounded-tr-xs'
                      : 'border border-stone-200/80 bg-white text-stone-800 shadow-xs rounded-tl-xs'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap font-normal">{msg.content}</p>
                  ) : (
                    <div className="prose prose-stone prose-xs sm:prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-serif prose-headings:font-bold prose-headings:text-stone-900">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Footer Meta & Copy */}
                <div
                  className={`mt-1 flex items-center gap-2 text-[10px] text-stone-400 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {!isUser && lastModelUsed && (
                    <span>• {lastModelUsed}</span>
                  )}
                  <button
                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                    className="opacity-0 group-hover:opacity-100 hover:text-stone-700 transition"
                    title="Copy message"
                  >
                    {isCopied ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isGenerating && (
          <div className="flex items-start gap-3 max-w-3xl mr-auto animate-in fade-in">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-white shadow-xs">
              <Bot className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs text-xs text-stone-500 rounded-tl-xs flex items-center gap-2">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span>AuraMind is reflecting thoughtfully...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Footer */}
      <div className="border-t border-stone-200/80 bg-white p-3 sm:p-4 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="mx-auto max-w-4xl"
        >
          <div className="relative rounded-2xl border border-stone-200 bg-stone-50/70 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20 transition shadow-xs">
            <textarea
              id="reflection-input-textarea"
              ref={textareaRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Write your ${entry.mode} reflection or thought... (Press Cmd+Enter to send)`}
              rows={2}
              className="w-full resize-none bg-transparent px-4 pt-3 pb-12 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
            />

            {/* Bottom Controls Bar inside textarea */}
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <SpeechInputButton
                  onTranscript={(transcript) => {
                    setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
                  }}
                  disabled={isGenerating}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[10px] text-stone-400">
                  Cmd+Enter ↵
                </span>
                <button
                  id="send-reflection-btn"
                  type="submit"
                  disabled={!inputText.trim() || isGenerating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 active:scale-95 disabled:opacity-30 transition"
                >
                  <span>Reflect</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
