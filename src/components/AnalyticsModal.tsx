import React from 'react';
import { X, BarChart3, Flame, BookOpen, Clock, Heart, Award } from 'lucide-react';
import { JournalEntry } from '../types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  entries,
}) => {
  if (!isOpen) return null;

  const totalEntries = entries.length;
  const totalWords = entries.reduce((acc, curr) => {
    const text = curr.messages.map((m) => m.content).join(' ');
    return acc + (text ? text.trim().split(/\s+/).length : 0);
  }, 0);

  const uniqueDays = new Set(
    entries.map((e) => new Date(e.createdAt).toISOString().split('T')[0])
  );
  const activeStreak = uniqueDays.size;

  const modeCounts: Record<string, number> = {
    reflection: 0,
    brainstorm: 0,
    summary: 0,
    action: 0,
  };
  entries.forEach((e) => {
    if (modeCounts[e.mode] !== undefined) {
      modeCounts[e.mode]++;
    }
  });

  const moodCounts: Record<string, number> = {};
  entries.forEach((e) => {
    if (e.mood) {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    }
  });

  const topMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="analytics-modal"
        className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Reflection & Habit Analytics
              </h3>
              <p className="text-xs text-stone-500">
                Personal growth metrics derived from your private Firestore logs
              </p>
            </div>
          </div>
          <button
            id="close-analytics-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* High-Level Metric Tiles */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 text-center">
            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 mb-2">
              <BookOpen className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-stone-900">{totalEntries}</p>
            <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mt-0.5">
              Reflections
            </p>
          </div>

          <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 text-center">
            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 mb-2">
              <Flame className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-stone-900">{activeStreak}</p>
            <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mt-0.5">
              Unique Days
            </p>
          </div>

          <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 text-center">
            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 mb-2">
              <Clock className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-stone-900">{totalWords.toLocaleString()}</p>
            <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mt-0.5">
              Words Reflected
            </p>
          </div>

          <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 text-center">
            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 mb-2">
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-stone-900">
              {entries.filter((e) => e.summary).length}
            </p>
            <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mt-0.5">
              Synthesized
            </p>
          </div>
        </div>

        {/* Mode Breakdown */}
        <div className="mt-6 rounded-xl border border-stone-200 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
            Reflection Modes Distribution
          </h4>
          <div className="space-y-2.5">
            {[
              { key: 'reflection', label: '🧘 Introspective Reflection', count: modeCounts.reflection, color: 'bg-amber-500' },
              { key: 'brainstorm', label: '💡 Creative Brainstorming', count: modeCounts.brainstorm, color: 'bg-blue-500' },
              { key: 'summary', label: '📝 Executive Summaries', count: modeCounts.summary, color: 'bg-emerald-500' },
              { key: 'action', label: '🎯 Action Planning', count: modeCounts.action, color: 'bg-indigo-500' },
            ].map((m) => {
              const pct = totalEntries > 0 ? Math.round((m.count / totalEntries) * 100) : 0;
              return (
                <div key={m.key}>
                  <div className="flex items-center justify-between text-xs font-medium text-stone-700 mb-1">
                    <span>{m.label}</span>
                    <span>
                      {m.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className={`h-full rounded-full ${m.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mood Distribution */}
        <div className="mt-6 rounded-xl border border-stone-200 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-rose-500" />
            Top Emotional States Reflected
          </h4>
          {topMoods.length === 0 ? (
            <p className="text-xs text-stone-500 italic">
              Record a few entries to view your emotional patterns.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {topMoods.map(([mood, count]) => (
                <div
                  key={mood}
                  className="rounded-lg bg-stone-50 border border-stone-200/80 p-3 text-center"
                >
                  <span className="text-sm font-semibold text-stone-800 block">{mood}</span>
                  <span className="text-xs text-amber-700 font-medium">{count} session{count === 1 ? '' : 's'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
