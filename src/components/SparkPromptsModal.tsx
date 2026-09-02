import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, ArrowRight, Lightbulb } from 'lucide-react';
import { SparkPrompt, MoodType } from '../types';
import { fetchSparkPrompts } from '../lib/api';

interface SparkPromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string, suggestedTitle: string) => void;
  currentMood: MoodType;
}

const DEFAULT_SPARKS: SparkPrompt[] = [
  {
    id: '1',
    title: 'The Unspoken Constraint',
    prompt: 'What invisible rule or expectation am I currently holding myself to that no longer serves where I want to go?',
    tag: 'Self-Awareness',
  },
  {
    id: '2',
    title: 'Energy Flow & Friction',
    prompt: 'Which single commitment or thought pattern drained the most energy from my day, and what alternative response is available?',
    tag: 'Clarity',
  },
  {
    id: '3',
    title: 'Divergent Experiment',
    prompt: 'If I were guaranteed not to face judgement or failure, what bold creative project or life shift would I initiate this quarter?',
    tag: 'Creativity',
  },
  {
    id: '4',
    title: 'Micro-Wins & Gratitude',
    prompt: 'What small, easily overlooked moment brought genuine peace or satisfaction to me in the past 48 hours?',
    tag: 'Gratitude',
  },
  {
    id: '5',
    title: 'The Decade Lens',
    prompt: 'When I look back at my present dilemma from 10 years into the future, what advice would my future self offer me right now?',
    tag: 'Perspective',
  },
  {
    id: '6',
    title: 'Radical Honesty',
    prompt: 'What truth about my current workload or relationships am I currently avoiding acknowledging to myself?',
    tag: 'Deep Truth',
  },
];

export const SparkPromptsModal: React.FC<SparkPromptsModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
  currentMood,
}) => {
  const [prompts, setPrompts] = useState<SparkPrompt[]>(DEFAULT_SPARKS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFetchSparks = async () => {
    setLoading(true);
    try {
      const res = await fetchSparkPrompts(selectedCategory, currentMood);
      if (res.prompts && res.prompts.length > 0) {
        setPrompts(res.prompts);
      }
    } catch (err) {
      console.error('Failed to fetch new sparks:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Sparks' },
    { id: 'self-discovery', label: 'Self Discovery' },
    { id: 'creativity', label: 'Creativity' },
    { id: 'decision-making', label: 'Decisions & Goals' },
    { id: 'resilience', label: 'Resilience' },
  ];

  const filteredPrompts =
    selectedCategory === 'all'
      ? prompts
      : prompts.filter(
          (p) =>
            p.tag.toLowerCase().includes(selectedCategory.toLowerCase()) ||
            selectedCategory === 'all'
        );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="spark-prompts-modal"
        className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Spark Journal Prompts
              </h3>
              <p className="text-xs text-stone-500">
                Thought-provoking reflection starters curated by Gemini AI
              </p>
            </div>
          </div>
          <button
            id="close-spark-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Categories & Refresh */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-stone-100">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            id="refresh-ai-sparks-btn"
            onClick={handleFetchSparks}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 active:scale-95 disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Generate New AI Sparks</span>
          </button>
        </div>

        {/* Prompt List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {filteredPrompts.map((item) => (
            <div
              key={item.id}
              className="group rounded-xl border border-stone-200/80 bg-stone-50/50 p-4 transition hover:border-amber-400 hover:bg-amber-50/30 hover:shadow-xs"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h4 className="text-sm font-semibold text-stone-900 group-hover:text-amber-900">
                  {item.title}
                </h4>
                <span className="rounded-md bg-stone-200/70 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                  {item.tag}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-serif">
                "{item.prompt}"
              </p>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    onSelectPrompt(item.prompt, item.title);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 transition active:scale-95"
                >
                  <span>Reflect on this</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
