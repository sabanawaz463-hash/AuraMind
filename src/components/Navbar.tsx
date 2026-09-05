import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  LogOut,
  BarChart3,
  Lightbulb,
  PlusCircle,
  Menu,
  X,
  ShieldCheck,
  User,
} from 'lucide-react';

interface NavbarProps {
  onNewReflection: () => void;
  onOpenSparkModal: () => void;
  onOpenAnalyticsModal: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  entryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewReflection,
  onOpenSparkModal,
  onOpenAnalyticsModal,
  onToggleSidebar,
  isSidebarOpen,
  entryCount,
}) => {
  const { user, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <button
            id="toggle-sidebar-btn"
            onClick={onToggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 md:hidden"
            aria-label="Toggle reflection history sidebar"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-tight text-stone-900">
                AuraMind
              </span>
              <span className="ml-2 hidden rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200/60 sm:inline-block">
                AI Reflection & Journal
              </span>
            </div>
          </div>
        </div>

        {/* Center: Action Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            id="nav-new-reflection-btn"
            onClick={onNewReflection}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-stone-800 active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            New Reflection
          </button>

          <button
            id="nav-spark-prompts-btn"
            onClick={onOpenSparkModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
          >
            <Lightbulb className="h-4 w-4 text-amber-600" />
            Spark Prompts
          </button>

          <button
            id="nav-analytics-btn"
            onClick={onOpenAnalyticsModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
          >
            <BarChart3 className="h-4 w-4 text-stone-600" />
            Analytics
          </button>
        </div>

        {/* Right: Security & User Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-stone-500 bg-stone-100/70 border border-stone-200/70 rounded-full px-2.5 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Firestore User-Isolated</span>
          </div>

          <div className="relative">
            <button
              id="user-profile-menu-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 rounded-full border border-stone-200 bg-white p-1 text-stone-700 hover:ring-2 hover:ring-amber-500/20"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User profile'}
                  className="h-8 w-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-stone-700">
                  <User className="h-4 w-4" />
                </div>
              )}
            </button>

            {showProfileMenu && (
              <div
                id="user-profile-dropdown"
                className="absolute right-0 mt-2 w-64 rounded-xl border border-stone-200 bg-white p-3 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 z-50"
              >
                <div className="border-b border-stone-100 pb-2.5 mb-2">
                  <p className="text-sm font-semibold text-stone-900 truncate">
                    {user?.displayName || 'Reflective Mind'}
                  </p>
                  <p className="text-xs text-stone-500 truncate">{user?.email}</p>
                  <p className="mt-1 text-[11px] text-amber-700 font-medium">
                    {entryCount} total saved reflection{entryCount === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="space-y-1">
                  <button
                    id="mobile-nav-new-btn"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNewReflection();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-stone-700 hover:bg-stone-100 md:hidden"
                  >
                    <PlusCircle className="h-4 w-4 text-stone-600" />
                    New Reflection
                  </button>

                  <button
                    id="mobile-nav-sparks-btn"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenSparkModal();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-stone-700 hover:bg-stone-100 md:hidden"
                  >
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    Spark Prompts
                  </button>

                  <button
                    id="mobile-nav-analytics-btn"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenAnalyticsModal();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-stone-700 hover:bg-stone-100 md:hidden"
                  >
                    <BarChart3 className="h-4 w-4 text-stone-600" />
                    Analytics
                  </button>

                  <button
                    id="sign-out-btn"
                    onClick={() => {
                      setShowProfileMenu(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
                  >
                    <LogOut className="h-4 w-4 text-rose-600" />
                    Sign Out of AuraMind
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
