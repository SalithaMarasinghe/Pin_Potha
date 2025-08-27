# Pin Potha - Personal Memory Keeper

A beautiful React web application for storing and managing personal memories with media attachments, built with Firebase and TailwindCSS.

## Features

- **Authentication**: Google Sign-In with Firebase Auth
- **Memory Storage**: Create, read, update, and delete memory entries
- **Media Support**: Upload and manage images, videos, and audio files
- **Real-time Data**: Automatic synchronization with Firestore
- **Responsive Design**: Works perfectly on mobile and desktop
- **Secure**: User-specific data with Firebase Security Rules

## Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS
- **Backend**: Firebase (Auth, Firestore, Storage, Hosting)
- **UI Components**: Lucide React icons, React DatePicker
- **Build Tool**: Vite

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable the following services:
   - Authentication (Google provider)
   - Firestore Database
   - Storage
   - Hosting

### 2. Firebase Configuration

1. Get your Firebase configuration from Project Settings
2. Copy `.env.example` to `.env`
3. Update the `.env` file with your Firebase project configuration
4. Get your config from Firebase Console > Project Settings > General > Your apps
5. Update `.firebaserc` with your project ID

### 3. Install Dependencies

```bash
npm install
```

### 4. Development

```bash
npm run dev
```

### 5. Firebase Setup

Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

Login to Firebase:
```bash
firebase login
```

Deploy security rules:
```bash
firebase deploy --only firestore:rules,storage
```

### 6. Build and Deploy

```bash
npm run build
firebase deploy
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Login.tsx       # Login page with Google Auth
│   ├── Dashboard.tsx   # Main dashboard
│   ├── EntryModal.tsx  # View entry details
│   ├── AddEditEntryModal.tsx  # Create/edit entries
│   └── ProtectedRoute.tsx     # Route protection
├── firebase/           # Firebase services
│   ├── config.ts      # Firebase configuration
│   ├── auth.ts        # Authentication functions
│   ├── firestore.ts   # Database operations
│   └── storage.ts     # File upload/download
├── hooks/             # React hooks
│   └── useAuth.ts     # Authentication hook
└── App.tsx            # Main app component
```

## Security

- Firestore rules ensure users can only access their own data
- Storage rules restrict file access to the file owner
- All operations require authentication

## Features Overview

### Authentication
- Google Sign-In integration
- Automatic redirect to dashboard after login
- Persistent login state

### Dashboard
- Grid layout of memory cards
- Sort by creation date (newest first)
- Click to view details
- Add new entry button

### Entry Management
- Create entries with name, description, and date
- Upload multiple media files (images, videos, audio)
- Edit existing entries
- Delete entries (with confirmation)

### Media Handling
- Drag and drop file upload
- Preview media in modals
- Support for images, videos, and audio
- Automatic file type detection

## Environment Setup

Make sure to set up your Firebase project with:
1. Authentication > Sign-in method > Google (enabled)
2. Firestore Database (in production mode)
3. Storage (with proper rules)
4. Hosting (for deployment)

## License

This project is open source and available under the MIT License.