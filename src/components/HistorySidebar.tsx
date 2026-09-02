import React, { useState } from 'react';
import {
  Search,
  Pin,
  Trash2,
  Calendar,
  Sparkles,
  Filter,
  X,
  MessageSquare,
  FileDown,
} from 'lucide-react';
import { JournalEntry, ReflectionMode, MoodType } from '../types';

interface HistorySidebarProps {
  entries: JournalEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string, e: React.MouseEvent) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onOpenExportModal: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  entries,
  activeEntryId,
  onSelectEntry,
  onDeleteEntry,
  onTogglePin,
  onOpenExportModal,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterMode, setSelectedFilterMode] = useState<string>('all');
  const [selectedFilterMood, setSelectedFilterMood] = useState<string>('all');

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      (entry.title && entry.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      entry.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesMode = selectedFilterMode === 'all' || entry.mode === selectedFilterMode;
    const matchesMood = selectedFilterMood === 'all' || entry.mood === selectedFilterMood;

    return matchesSearch && matchesMode && matchesMood;
  });

  // Sort: pinned first, then newest updated first
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
  });

  const getModeBadge = (mode: ReflectionMode) => {
    switch (mode) {
      case 'reflection':
        return <span className="rounded bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 text-[10px]">🧘 Reflect</span>;
      case 'brainstorm':
        return <span className="rounded bg-blue-50 text-blue-800 border border-blue-200/60 px-1.5 py-0.5 text-[10px]">💡 Brainstorm</span>;
      case 'summary':
        return <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-1.5 py-0.5 text-[10px]">📝 Summary</span>;
      case 'action':
        return <span className="rounded bg-indigo-50 text-indigo-800 border border-indigo-200/60 px-1.5 py-0.5 text-[10px]">🎯 Action</span>;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="history-sidebar"
        className={`fixed md:sticky top-16 z-30 flex h-[calc(100vh-4rem)] w-80 flex-col border-r border-stone-200/80 bg-white transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header & Search */}
        <div className="border-b border-stone-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-700" />
              <h2 className="font-serif text-sm font-bold text-stone-900">
                Reflection History
              </h2>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
                {entries.length}
              </span>
            </div>

            <button
              onClick={onOpenExportModal}
              title="Export reflections"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition"
            >
              <FileDown className="h-4 w-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <input
              id="search-reflections-input"
              type="text"
              placeholder="Search reflections, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50/70 pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <select
              id="mode-filter-select"
              value={selectedFilterMode}
              onChange={(e) => setSelectedFilterMode(e.target.value)}
              className="rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-700 focus:outline-none"
            >
              <option value="all">All Modes</option>
              <option value="reflection">Reflect</option>
              <option value="brainstorm">Brainstorm</option>
              <option value="summary">Summary</option>
              <option value="action">Action</option>
            </select>

            <select
              id="mood-filter-select"
              value={selectedFilterMood}
              onChange={(e) => setSelectedFilterMood(e.target.value)}
              className="rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-700 focus:outline-none"
            >
              <option value="all">All Moods</option>
              <option value="Inspired">Inspired</option>
              <option value="Contemplative">Contemplative</option>
              <option value="Focused">Focused</option>
              <option value="Optimistic">Optimistic</option>
              <option value="Overwhelmed">Overwhelmed</option>
              <option value="Grateful">Grateful</option>
              <option value="Resetting">Resetting</option>
              <option value="Inquisitive">Inquisitive</option>
            </select>
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {sortedEntries.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400">
              {entries.length === 0
                ? 'No reflections yet. Begin by writing in the workspace.'
                : 'No reflections match your search query.'}
            </div>
          ) : (
            sortedEntries.map((entry) => {
              const isActive = entry.id === activeEntryId;
              const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={entry.id}
                  id={`entry-item-${entry.id}`}
                  onClick={() => {
                    onSelectEntry(entry);
                    if (window.innerWidth < 768) {
                      onClose();
                    }
                  }}
                  className={`group relative flex cursor-pointer flex-col gap-1.5 rounded-xl p-3 text-left transition ${
                    isActive
                      ? 'bg-amber-50/80 border border-amber-300/80 shadow-xs'
                      : 'hover:bg-stone-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <h3 className="line-clamp-1 font-serif text-xs font-bold text-stone-900 group-hover:text-amber-900">
                      {entry.title || 'Untitled Reflection'}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        title={entry.isPinned ? 'Unpin' : 'Pin to top'}
                        onClick={(e) => onTogglePin(entry.id, e)}
                        className={`rounded p-1 transition ${
                          entry.isPinned
                            ? 'text-amber-600 bg-amber-100/70'
                            : 'text-stone-300 opacity-0 group-hover:opacity-100 hover:text-stone-600'
                        }`}
                      >
                        <Pin className="h-3 w-3" />
                      </button>
                      <button
                        title="Delete reflection"
                        onClick={(e) => onDeleteEntry(entry.id, e)}
                        className="rounded p-1 text-stone-300 opacity-0 group-hover:opacity-100 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Snippet or Last Message */}
                  <p className="line-clamp-2 text-[11px] text-stone-500 font-normal leading-relaxed">
                    {entry.summary ||
                      (entry.messages.length > 0
                        ? entry.messages[entry.messages.length - 1].content
                        : 'Empty session')}
                  </p>

                  {/* Metadata Row */}
                  <div className="mt-1 flex items-center justify-between text-[10px] text-stone-400">
                    <div className="flex items-center gap-1.5">
                      {getModeBadge(entry.mode)}
                      {entry.mood && (
                        <span className="rounded bg-stone-100 px-1 py-0.5 text-stone-600">
                          {entry.mood}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0">{dateStr}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
