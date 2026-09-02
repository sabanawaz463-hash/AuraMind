import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { sanitizeForFirestore } from '../lib/sanitizer';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  authError: null,
  clearAuthError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
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
          console.error('Error synchronizing user profile:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      // Friendly message
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in was cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setAuthError(err.message || 'Failed to authenticate with Google.');
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      console.error('Sign-out Error:', err);
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
