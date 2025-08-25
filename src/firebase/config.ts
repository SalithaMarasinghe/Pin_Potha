// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // TODO: Replace with your actual Firebase project configuration
  // Get these values from Firebase Console > Project Settings > General > Your apps
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Check if we're using demo/placeholder values
export const isFirebaseConfigured = () => {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET &&
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
  );
};

// Only show warnings in development
if (import.meta.env.DEV && !isFirebaseConfigured()) {
  console.warn('🔥 Firebase Configuration Required');
  console.warn('Create a .env file in your project root with your Firebase config:');
  console.warn('VITE_FIREBASE_API_KEY=your-api-key');
  console.warn('VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com');
  console.warn('VITE_FIREBASE_PROJECT_ID=your-project-id');
  console.warn('VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com');
  console.warn('VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id');
  console.warn('VITE_FIREBASE_APP_ID=your-app-id');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;