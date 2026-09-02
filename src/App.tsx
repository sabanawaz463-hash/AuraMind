import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db } from './lib/firebase';
import { sanitizeForFirestore } from './lib/sanitizer';
import { JournalEntry, ReflectionMode, MoodType } from './types';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { HistorySidebar } from './components/HistorySidebar';
import { ReflectionWorkspace } from './components/ReflectionWorkspace';
import { SparkPromptsModal } from './components/SparkPromptsModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { ExportModal } from './components/ExportModal';

const createDefaultEntry = (userId: string, customPrompt?: string, suggestedTitle?: string): JournalEntry => ({
  id: 'ref-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
  userId,
  title: suggestedTitle || 'Untitled Reflection',
  mode: 'reflection',
  mood: 'Contemplative',
  tags: ['daily'],
  messages: customPrompt
    ? [
        {
          id: 'msg-init-' + Date.now(),
          role: 'user',
          content: customPrompt,
          timestamp: Date.now(),
        },
      ]
    : [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isPinned: false,
});

const MainDashboard: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Modals state
  const [isSparkModalOpen, setIsSparkModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Subscribe to user-isolated Firestore collection
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setActiveEntry(null);
      return;
    }

    const interactionsRef = collection(db, 'users', user.uid, 'interactions');
    const q = query(interactionsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push(docSnap.data() as JournalEntry);
        });

        setEntries(fetched);

        // If no active entry is selected, select the first or create one
        setActiveEntry((prev) => {
          if (prev) {
            const found = fetched.find((e) => e.id === prev.id);
            return found || prev;
          }
          if (fetched.length > 0) {
            return fetched[0];
          }
          const defaultEntry = createDefaultEntry(user.uid);
          return defaultEntry;
        });
      },
      (error) => {
        console.error('Firestore real-time subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Persist entry changes to Firestore
  const handleUpdateEntry = useCallback(
    async (updatedFields: Partial<JournalEntry>) => {
      if (!user || !activeEntry) return;

      const updatedEntry: JournalEntry = {
        ...activeEntry,
        ...updatedFields,
        updatedAt: Date.now(),
      };

      setActiveEntry(updatedEntry);
      setSaveStatus('saving');

      try {
        const docRef = doc(db, 'users', user.uid, 'interactions', updatedEntry.id);
        await setDoc(docRef, sanitizeForFirestore(updatedEntry), { merge: true });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to save reflection to Firestore:', err);
        setSaveStatus('error');
      }
    },
    [user, activeEntry]
  );

  const handleNewReflection = useCallback(
    (customPrompt?: string, suggestedTitle?: string) => {
      if (!user) return;
      const newEntry = createDefaultEntry(user.uid, customPrompt, suggestedTitle);
      setActiveEntry(newEntry);
      setIsSidebarOpen(false);

      // Save initial draft to Firestore
      const docRef = doc(db, 'users', user.uid, 'interactions', newEntry.id);
      setDoc(docRef, sanitizeForFirestore(newEntry)).catch((err) => {
        console.error('Failed to create initial draft in Firestore:', err);
      });
    },
    [user]
  );

  const handleDeleteEntry = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) return;
      if (!window.confirm('Are you sure you want to delete this reflection?')) return;

      try {
        const docRef = doc(db, 'users', user.uid, 'interactions', id);
        await deleteDoc(docRef);

        if (activeEntry?.id === id) {
          const remaining = entries.filter((item) => item.id !== id);
          if (remaining.length > 0) {
            setActiveEntry(remaining[0]);
          } else {
            handleNewReflection();
          }
        }
      } catch (err) {
        console.error('Failed to delete reflection from Firestore:', err);
      }
    },
    [user, entries, activeEntry, handleNewReflection]
  );

  const handleTogglePin = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) return;
      const target = entries.find((item) => item.id === id);
      if (!target) return;

      try {
        const updated = { ...target, isPinned: !target.isPinned, updatedAt: Date.now() };
        const docRef = doc(db, 'users', user.uid, 'interactions', id);
        await setDoc(docRef, sanitizeForFirestore(updated), { merge: true });
      } catch (err) {
        console.error('Failed to toggle pin state:', err);
      }
    },
    [user, entries]
  );

  if (!user) {
    return <LandingHero />;
  }

  // Ensure an active entry always exists
  const currentWorkspaceEntry = activeEntry || createDefaultEntry(user.uid);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col selection:bg-amber-100 selection:text-amber-900">
      <Navbar
        onNewReflection={() => handleNewReflection()}
        onOpenSparkModal={() => setIsSparkModalOpen(true)}
        onOpenAnalyticsModal={() => setIsAnalyticsModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        entryCount={entries.length}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for History */}
        <HistorySidebar
          entries={entries}
          activeEntryId={currentWorkspaceEntry.id}
          onSelectEntry={(selected) => setActiveEntry(selected)}
          onDeleteEntry={handleDeleteEntry}
          onTogglePin={handleTogglePin}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Primary Interactive Reflection Workspace */}
        <ReflectionWorkspace
          entry={currentWorkspaceEntry}
          onUpdateEntry={handleUpdateEntry}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenSparkModal={() => setIsSparkModalOpen(true)}
          saveStatus={saveStatus}
          onRetrySave={() => handleUpdateEntry({})}
        />
      </div>

      {/* Modals */}
      <SparkPromptsModal
        isOpen={isSparkModalOpen}
        onClose={() => setIsSparkModalOpen(false)}
        onSelectPrompt={(prompt, title) => handleNewReflection(prompt, title)}
        currentMood={currentWorkspaceEntry.mood}
      />

      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        entries={entries}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentEntry={currentWorkspaceEntry}
        allEntries={entries}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}
