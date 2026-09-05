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
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { sanitizeForFirestore } from './lib/sanitizer';
import { JournalEntry } from './types';
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

const getStorageKey = (uid: string) => `auramind_entries_${uid}`;

const loadLocalEntries = (uid: string): JournalEntry[] => {
  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return [];
};

const saveLocalEntries = (uid: string, entries: JournalEntry[]) => {
  try {
    localStorage.setItem(getStorageKey(uid), JSON.stringify(entries));
  } catch {
    // ignore
  }
};

const MainDashboard: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const [isSparkModalOpen, setIsSparkModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setActiveEntry(null);
      return;
    }

    // If guest, use local storage engine
    if (user.isGuest) {
      const local = loadLocalEntries(user.uid);
      if (local.length > 0) {
        setEntries(local);
        setActiveEntry(local[0]);
      } else {
        const initial = createDefaultEntry(user.uid);
        setEntries([initial]);
        setActiveEntry(initial);
        saveLocalEntries(user.uid, [initial]);
      }
      return;
    }

    // If authenticated user, attach real-time Firestore listener with fallback
    const interactionsPath = `users/${user.uid}/interactions`;
    const interactionsRef = collection(db, 'users', user.uid, 'interactions');
    const q = query(interactionsRef, orderBy('createdAt', 'desc'));

    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched: JournalEntry[] = [];
          snapshot.forEach((docSnap) => {
            fetched.push(docSnap.data() as JournalEntry);
          });

          setEntries(fetched);
          saveLocalEntries(user.uid, fetched);

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
          handleFirestoreError(error, OperationType.LIST, interactionsPath);
          const cached = loadLocalEntries(user.uid);
          if (cached.length > 0) {
            setEntries(cached);
            setActiveEntry((prev) => prev || cached[0]);
          } else {
            const def = createDefaultEntry(user.uid);
            setEntries([def]);
            setActiveEntry(def);
          }
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, interactionsPath);
    }

    return () => unsubscribe();
  }, [user]);

  const handleUpdateEntry = useCallback(
    async (updatedFields: Partial<JournalEntry>) => {
      if (!user || !activeEntry) return;

      const updatedEntry: JournalEntry = {
        ...activeEntry,
        ...updatedFields,
        updatedAt: Date.now(),
      };

      setActiveEntry(updatedEntry);
      setEntries((prev) => {
        const next = prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e));
        saveLocalEntries(user.uid, next);
        return next;
      });
      setSaveStatus('saving');

      if (user.isGuest) {
        setSaveStatus('saved');
        return;
      }

      const docPath = `users/${user.uid}/interactions/${updatedEntry.id}`;
      try {
        const docRef = doc(db, 'users', user.uid, 'interactions', updatedEntry.id);
        await setDoc(docRef, sanitizeForFirestore(updatedEntry), { merge: true });
        setSaveStatus('saved');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
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
      setEntries((prev) => {
        const next = [newEntry, ...prev.filter((e) => e.id !== newEntry.id)];
        saveLocalEntries(user.uid, next);
        return next;
      });
      setIsSidebarOpen(false);

      if (user.isGuest) return;

      const docPath = `users/${user.uid}/interactions/${newEntry.id}`;
      const docRef = doc(db, 'users', user.uid, 'interactions', newEntry.id);
      setDoc(docRef, sanitizeForFirestore(newEntry)).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, docPath);
      });
    },
    [user]
  );

  const handleDeleteEntry = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) return;
      if (!window.confirm('Are you sure you want to delete this reflection?')) return;

      const remaining = entries.filter((item) => item.id !== id);
      setEntries(remaining);
      saveLocalEntries(user.uid, remaining);

      if (activeEntry?.id === id) {
        if (remaining.length > 0) {
          setActiveEntry(remaining[0]);
        } else {
          handleNewReflection();
        }
      }

      if (user.isGuest) return;

      const docPath = `users/${user.uid}/interactions/${id}`;
      try {
        const docRef = doc(db, 'users', user.uid, 'interactions', id);
        await deleteDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, docPath);
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

      const updated = { ...target, isPinned: !target.isPinned, updatedAt: Date.now() };
      setEntries((prev) => {
        const next = prev.map((item) => (item.id === id ? updated : item));
        saveLocalEntries(user.uid, next);
        return next;
      });

      if (user.isGuest) return;

      const docPath = `users/${user.uid}/interactions/${id}`;
      try {
        const docRef = doc(db, 'users', user.uid, 'interactions', id);
        await setDoc(docRef, sanitizeForFirestore(updated), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, docPath);
      }
    },
    [user, entries]
  );

  if (!user) {
    return <LandingHero />;
  }

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

        <ReflectionWorkspace
          entry={currentWorkspaceEntry}
          onUpdateEntry={handleUpdateEntry}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenSparkModal={() => setIsSparkModalOpen(true)}
          saveStatus={saveStatus}
          onRetrySave={() => handleUpdateEntry({})}
        />
      </div>

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

