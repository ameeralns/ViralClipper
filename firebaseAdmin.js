const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin with environment variables or service account
// For production, use environment variables to store your service account key
let app;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Parse the service account from environment variable
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
} else {
  // For local development, you can use a local service account file
  try {
    const serviceAccount = require('./service-account.json');
    app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    // Initialize without credentials for development
    app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'viral-clips-app',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  }
}

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

console.log('Firebase Admin initialized');

module.exports = { 
  app, 
  db, 
  storage,
  auth
}; 