# Deployment Guide

This application is split into two parts for deployment:
1. Frontend (React) - Deploy to Vercel
2. Backend (Node.js) - Deploy to Render

## Frontend Deployment (Vercel)

1. Sign up or log in to [Vercel](https://vercel.com)

2. Import your GitHub repository:
   - Select "Add New" → "Project"
   - Connect to your GitHub account and select the repository
   - Configure the project:
     - Framework Preset: Create React App
     - Root Directory: `client`
     - Build Command: `npm run build`
     - Output Directory: `build`

3. Add Environment Variables:
   - Go to Settings → Environment Variables
   - Add `REACT_APP_API_URL` with your backend URL (from Render deployment)

4. Deploy!

## Backend Deployment (Render)

1. Sign up or log in to [Render](https://render.com)

2. Create a new Web Service:
   - Connect your GitHub repository
   - Configure the service:
     - Name: `viralclipper-api` (or your preferred name)
     - Root Directory: `.` (root directory)
     - Runtime: Node
     - Build Command: `cp api-package.json package.json && npm install`
     - Start Command: `node index.js`

3. Add Environment Variables:
   - `PORT` = 3000
   - `FIREBASE_STORAGE_BUCKET` = your-firebase-bucket-name
   - `BASE_URL` = your-render-service-url
   - Add all other variables from your local `.env` file

4. Add Secret Files:
   - Under "Secret Files" in Render:
   - Add your Firebase service account JSON as `service-account.json`

5. Install Buildpacks:
   - Add the Python buildpack (needed for yt-dlp)
   - Add the FFmpeg buildpack

6. After deployment, update your frontend configuration:
   - Copy your Render service URL
   - Update the environment variable in Vercel to use this URL

## Updating CORS After Deployment

After deploying both services, update the CORS configuration in your backend code to include your actual Vercel URL:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-actual-vercel-app-url.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
```

Then redeploy your backend. 