import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn, BookOpen } from 'lucide-react';
import { isFirebaseConfigured } from '../firebase/config';
import { signInWithGoogle } from '../firebase/auth';
import { useAuth } from '../hooks/useAuth';

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  // Check if Firebase is properly configured
  if (!isFirebaseConfigured()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Firebase Setup Required
            </h1>
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-3">
                To use Pin Potha, please create a <code className="bg-gray-200 px-1 rounded">.env</code> file in your project root with your Firebase configuration:
              </p>
              <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-x-auto">
{`VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id`}
              </pre>
            </div>
            <p className="text-sm text-gray-600">
              Get your configuration from{' '}
              <a 
                href="https://console.firebase.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Firebase Console
              </a>
              {' '}→ Project Settings → General → Your apps
            </p>
          </div>
        </div>
      </div>
    );
  }


  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
    } catch (err) {
      const error = err as any;
      if (error.code === 'auth/configuration-not-found') {
        setError('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pin Potha</h1>
          <p className="text-gray-600">Your personal memory keeper</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              Sign in with Google
            </>
          )}
        </button>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Sign in to start saving your memories</p>
        </div>
      </div>
    </div>
  );
};