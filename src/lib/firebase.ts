import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import firebaseConfigRaw from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigRaw.apiKey,
  authDomain: firebaseConfigRaw.authDomain,
  projectId: firebaseConfigRaw.projectId,
  storageBucket: firebaseConfigRaw.storageBucket,
  messagingSenderId: firebaseConfigRaw.messagingSenderId,
  appId: firebaseConfigRaw.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
// Ensure persistence across reloads
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase auth persistence warning:', err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Use the explicit Firestore database ID if provided in config
export const db = firebaseConfigRaw.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigRaw.firestoreDatabaseId)
  : getFirestore(app);

export default app;
