import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Lock,
  MessageSquareQuote,
  Compass,
  Cpu,
  Database,
  ArrowRight,
  Mic,
  FileDown,
  Shield,
  CheckCircle2,
} from 'lucide-react';

export const LandingHero: React.FC = () => {
  const { signInWithGoogle, continueAsGuest, authError, clearAuthError, loading } = useAuth();

  return (
    <div className="relative min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
      {/* Top Banner */}
      <div className="w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-stone-900">
            AuraMind
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            id="top-guest-btn"
            onClick={continueAsGuest}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-50 transition active:scale-95"
          >
            <span>Guest Mode</span>
          </button>
          <button
            id="top-signin-btn"
            onClick={signInWithGoogle}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-stone-800 transition active:scale-95 disabled:opacity-50"
          >
            <span>Sign In with Google</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Hero Container */}
      <main className="mx-auto max-w-5xl px-6 py-12 md:py-16 text-center">
        {/* Security & AI Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-900 mb-8 shadow-xs">
          <Shield className="h-3.5 w-3.5 text-amber-700" />
          <span>User-Isolated Firestore Database & Gemini 3.6 Flash Engine</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-stone-900 max-w-3xl mx-auto leading-[1.15]">
          A mindful sanctuary for your{' '}
          <span className="italic font-serif text-amber-700 underline decoration-amber-300/60 decoration-wavy underline-offset-8">
            thoughts, reflections,
          </span>{' '}
          and breakthroughs.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Converse with Gemini to deconstruct complex emotions, brainstorm novel ideas,
          and synthesize actionable life insights. Every word is cryptographically isolated
          to your private Firestore storage.
        </p>

        {/* Auth Error Banner if any */}
        {authError && (
          <div className="mt-6 mx-auto max-w-md rounded-xl bg-rose-50 border border-rose-200 p-4 text-left flex items-start justify-between gap-3 text-sm text-rose-800 animate-in fade-in">
            <p>{authError}</p>
            <button
              onClick={clearAuthError}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Primary CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="hero-google-signin-btn"
            onClick={signInWithGoogle}
            disabled={loading}
            className="flex h-12 w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-stone-900 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-stone-900/10 hover:bg-stone-800 hover:shadow-stone-900/20 active:scale-95 transition disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google Sign-In</span>
          </button>

          <button
            id="hero-guest-btn"
            onClick={continueAsGuest}
            className="flex h-12 w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-100 hover:text-stone-900 active:scale-95 transition"
          >
            <span>Explore in Guest Mode</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            Zero passwords stored
          </span>
          <span>•</span>
          <span>Owner-bound Security Rules</span>
          <span>•</span>
          <span>Instant Private Session</span>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs hover:border-amber-300/80 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 mb-4 border border-amber-200/50">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">4 Reflection Modes</h3>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              Switch fluidly between Deep Introspection, Divergent Brainstorming, Executive Summarization, and Action Planning.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs hover:border-amber-300/80 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 mb-4 border border-amber-200/50">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">Firestore Cloud Isolation</h3>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              Strict owner-bound security rules ensure that your prompts, mood logs, and AI conversations are only readable by you.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs hover:border-amber-300/80 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 mb-4 border border-amber-200/50">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">Resilient Gemini Engine</h3>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              Powered by Gemini 3.6 Flash with automated multi-tier fallback ladders for high availability and zero downtime.
            </p>
          </div>
        </div>

        {/* Feature Highlights Pills */}
        <div className="mt-12 rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-8 text-left shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-4">
            Included Productivity Features
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-stone-700">
            <div className="flex items-center gap-2.5">
              <Mic className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Voice Speech-to-Text</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MessageSquareQuote className="h-4 w-4 text-amber-600 shrink-0" />
              <span>AI Executive Synthesis</span>
            </div>
            <div className="flex items-center gap-2.5">
              <FileDown className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Multi-Format Markdown Export</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Mood & Streak Analytics</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white px-6 py-6 text-center text-xs text-stone-500">
        <p>AuraMind • Engineered with Google Gemini API & Firebase Firestore • Zero-credential storage guarantee</p>
      </footer>
    </div>
  );
};
