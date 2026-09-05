import React, { useState } from 'react';
import { X, FileDown, Copy, Check, FileText, Code2, Download } from 'lucide-react';
import { JournalEntry } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEntry?: JournalEntry | null;
  allEntries: JournalEntry[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  currentEntry,
  allEntries,
}) => {
  const [exportScope, setExportScope] = useState<'current' | 'all'>('current');
  const [exportFormat, setExportFormat] = useState<'markdown' | 'text' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const entriesToExport = exportScope === 'current' && currentEntry ? [currentEntry] : allEntries;

  const generateMarkdown = (): string => {
    let md = `# AuraMind Journal & Reflection Export\nGenerated: ${new Date().toLocaleString()}\n\n---\n\n`;

    entriesToExport.forEach((entry, idx) => {
      md += `## ${idx + 1}. ${entry.title || 'Untitled Reflection'}\n`;
      md += `**Date:** ${new Date(entry.createdAt).toLocaleDateString()} | **Mode:** ${entry.mode} | **Mood:** ${entry.mood}\n`;
      if (entry.tags && entry.tags.length > 0) {
        md += `**Tags:** ${entry.tags.join(', ')}\n`;
      }
      md += `\n`;

      if (entry.summary) {
        md += `### 📝 Executive Summary\n${entry.summary}\n\n`;
      }

      if (entry.keyTakeaways && entry.keyTakeaways.length > 0) {
        md += `### 💡 Key Takeaways\n`;
        entry.keyTakeaways.forEach((t) => (md += `- ${t}\n`));
        md += `\n`;
      }

      if (entry.actionItems && entry.actionItems.length > 0) {
        md += `### 🎯 Action Items\n`;
        entry.actionItems.forEach((a) => (md += `- [ ] ${a}\n`));
        md += `\n`;
      }

      md += `### 💬 Conversation Transcript\n\n`;
      entry.messages.forEach((msg) => {
        const speaker = msg.role === 'user' ? '👤 **You**' : '✨ **AuraMind (Gemini)**';
        md += `${speaker} *(${new Date(msg.timestamp).toLocaleTimeString()})*:\n\n${msg.content}\n\n`;
      });

      md += `---\n\n`;
    });

    return md;
  };

  const generatePlainText = (): string => {
    let text = `AURAMIND REFLECTIONS EXPORT\nExported: ${new Date().toLocaleString()}\n=========================================\n\n`;

    entriesToExport.forEach((entry, idx) => {
      text += `[${idx + 1}] ${entry.title || 'Untitled'}\n`;
      text += `Date: ${new Date(entry.createdAt).toLocaleString()}\n`;
      text += `Mode: ${entry.mode} | Mood: ${entry.mood}\n`;
      if (entry.tags?.length) text += `Tags: ${entry.tags.join(', ')}\n`;
      text += `-----------------------------------------\n`;

      if (entry.summary) {
        text += `SUMMARY:\n${entry.summary}\n\n`;
      }

      text += `TRANSCRIPT:\n`;
      entry.messages.forEach((msg) => {
        text += `${msg.role === 'user' ? 'YOU' : 'GEMINI'}: ${msg.content}\n\n`;
      });
      text += `=========================================\n\n`;
    });

    return text;
  };

  const generateJSON = (): string => {
    return JSON.stringify(entriesToExport, null, 2);
  };

  const getExportContent = () => {
    if (exportFormat === 'markdown') return generateMarkdown();
    if (exportFormat === 'text') return generatePlainText();
    return generateJSON();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getExportContent());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownload = () => {
    const content = getExportContent();
    const ext = exportFormat === 'markdown' ? 'md' : exportFormat === 'json' ? 'json' : 'txt';
    const mime =
      exportFormat === 'json' ? 'application/json' : 'text/plain;charset=utf-8';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auramind-reflections-${new Date().toISOString().split('T')[0]}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="export-modal"
        className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
              <FileDown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Export Reflections
              </h3>
              <p className="text-xs text-stone-500">
                Download or copy your private journal entries in readable formats
              </p>
            </div>
          </div>
          <button
            id="close-export-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">
              Export Scope
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setExportScope('current')}
                disabled={!currentEntry}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold text-center transition ${
                  exportScope === 'current'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                } disabled:opacity-40`}
              >
                Current Reflection Only
              </button>
              <button
                onClick={() => setExportScope('all')}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold text-center transition ${
                  exportScope === 'all'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                All Reflections ({allEntries.length})
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">
              File Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'markdown', label: 'Markdown (.md)', icon: FileText },
                { id: 'text', label: 'Plain Text (.txt)', icon: FileDown },
                { id: 'json', label: 'JSON Data (.json)', icon: Code2 },
              ].map((fmt) => {
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => setExportFormat(fmt.id as any)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      exportFormat === fmt.id
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">
              Live Preview
            </label>
            <textarea
              readOnly
              value={getExportContent()}
              rows={7}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/70 p-3 font-mono text-xs text-stone-800 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4">
          <button
            id="copy-export-content-btn"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 active:scale-95 transition"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
          </button>

          <button
            id="download-export-file-btn"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 active:scale-95 transition"
          >
            <Download className="h-4 w-4" />
            <span>Download File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
