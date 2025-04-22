# YouTube to Viral Clips Processor

This service transforms long YouTube videos into short clips optimized for short-form video platforms. It uses Deepgram to analyze audio sentiment and Google Gemini or OpenAI to identify the most engaging moments, then automatically clips those segments for you.

## Features

- 🎬 Process YouTube videos into multiple viral-worthy clips
- 🔊 Analyze audio sentiment with Deepgram
- 🧠 AI-powered clip selection with Google Gemini or OpenAI
- 📝 Auto-generate short, catchy captions for each clip
- 🎞️ Automatic video cropping to vertical dimensions (9:16)
- 🔐 Firebase Authentication for secure access
- 📱 Responsive web interface for easy clip management
- 🌍 Global content delivery through Firebase Hosting

## Prerequisites

- Node.js (v14+)
- FFmpeg installed on your system
- Deepgram API key
- Google Gemini API key or OpenAI API key
- Firebase project with Firestore and Storage enabled

## Setup for Development

### Backend Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with:
   ```
   DEEPGRAM_API_KEY=your_deepgram_api_key
   GOOGLE_API_KEY=your_google_api_key
   BASE_URL=http://localhost:3000
   PORT=3000
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   ```

4. Download your Firebase service account key from the Firebase console and save it as `service-account.json` in the root directory

5. Start the server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with your Firebase configuration:
   ```
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=1234567890
   REACT_APP_FIREBASE_APP_ID=1:1234567890:web:abcdef1234567890
   REACT_APP_API_URL=http://localhost:3000
   ```

4. Start the React development server:
   ```
   npm start
   ```

## Deployment to Firebase

1. Install the Firebase CLI:
   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```
   firebase login
   ```

3. Initialize your project (if not already done):
   ```
   firebase init
   ```

4. Build the React client:
   ```
   cd client
   npm run build
   ```

5. Deploy to Firebase:
   ```
   firebase deploy
   ```

## Architecture

### Backend (Node.js/Express)
- Downloads and processes videos using FFmpeg
- Integrates with Deepgram for transcription and sentiment analysis
- Uses AI (Google Gemini or OpenAI) for clip selection
- Uploads processed clips to Firebase Storage
- Stores video metadata in Firestore

### Frontend (React)
- Material UI components for a responsive interface
- Authentication using Firebase Auth
- Video upload and management
- Clip library with search and filter capabilities
- Sharing and download features

## Security

- Firebase Authentication for user management
- Firestore security rules to control data access
- Storage security rules to protect video assets
- Backend validation for all requests

## Scaling Considerations

- Firebase Functions for serverless backend processing
- Cloud Storage for video storage with CDN capabilities
- Firestore for scalable document database

## License

MIT 