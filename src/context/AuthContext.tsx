import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { sanitizeForFirestore } from '../lib/sanitizer';
import { UserProfile } from '../types';

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isGuest?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const GUEST_STORAGE_KEY = 'auramind_guest_user';

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  continueAsGuest: () => {},
  signOut: async () => {},
  authError: null,
  clearAuthError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
      if (savedGuest) {
        return JSON.parse(savedGuest);
      }
    } catch {
      // ignore localStorage errors
    }
    return null;
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (currentUser) {
            const mappedUser: AppUser = {
              uid: currentUser.uid,
              displayName: currentUser.displayName,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              isGuest: false,
            };
            setUser(mappedUser);
            localStorage.removeItem(GUEST_STORAGE_KEY);

            try {
              const userDocRef = doc(db, 'users', currentUser.uid, 'profiles', 'main');
              const snap = await getDoc(userDocRef);
              const now = Date.now();
              if (snap.exists()) {
                const data = snap.data() as UserProfile;
                const updatedProfile: UserProfile = {
                  ...data,
                  lastLoginAt: now,
                  displayName: currentUser.displayName || data.displayName,
                  photoURL: currentUser.photoURL || data.photoURL,
                  email: currentUser.email || data.email,
                };
                await setDoc(userDocRef, sanitizeForFirestore(updatedProfile), { merge: true });
                setProfile(updatedProfile);
              } else {
                const newProfile: UserProfile = {
                  uid: currentUser.uid,
                  displayName: currentUser.displayName,
                  email: currentUser.email,
                  photoURL: currentUser.photoURL,
                  createdAt: now,
                  lastLoginAt: now,
                };
                await setDoc(userDocRef, sanitizeForFirestore(newProfile));
                setProfile(newProfile);
              }
            } catch (err: any) {
              handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/profiles/main`);
              console.warn('Profile synchronization notice:', err);
            }
          } else {
            // Keep guest user if active, otherwise clear
            setUser((prev) => (prev?.isGuest ? prev : null));
            setProfile(null);
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Auth state observation note:', err);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn('Auth observer initialization exception:', err);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in was closed before completing. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else if (
        err.code === 'auth/invalid-api-key' ||
        err.code === 'auth/api-key-not-valid' ||
        err.message?.includes('invalid-api-key') ||
        err.message?.includes('api-key-not-valid')
      ) {
        setAuthError('Firebase API key is being configured. In the meantime, you can click "Explore in Guest Mode" below to use all AI and journal features immediately.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setAuthError(null);
      } else {
        setAuthError(err.message || 'Failed to authenticate with Google.');
      }
    }
  };

  const continueAsGuest = () => {
    const guestUser: AppUser = {
      uid: 'guest-' + Math.random().toString(36).substr(2, 9),
      displayName: 'Mindful Guest',
      email: null,
      photoURL: null,
      isGuest: true,
    };
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
    } catch {
      // storage unavailable
    }
    setUser(guestUser);
    setProfile({
      uid: guestUser.uid,
      displayName: 'Mindful Guest',
      email: null,
      photoURL: null,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    });
    setAuthError(null);
  };

  const signOut = async () => {
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
      await firebaseSignOut(auth);
    } catch (err: any) {
      console.warn('Sign-out handled:', err);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        continueAsGuest,
        signOut,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

