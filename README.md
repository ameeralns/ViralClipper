# YouTube to Viral Clips Processor

This service transforms long YouTube videos into short clips optimized for short-form video platforms. It uses Deepgram to analyze audio sentiment and Google Gemini to identify the most engaging moments, then automatically clips those segments for you.

## Features

- 🎬 Process YouTube videos into multiple viral-worthy clips
- 🔊 Analyze audio sentiment with Deepgram
- 🧠 AI-powered clip selection with Google Gemini
- 📝 Auto-generate short, catchy captions for each clip
- 🎞️ Automatic video cropping to vertical dimensions (9:16)
- 💾 Local storage of all processed clips and original transcripts

## Prerequisites

- Node.js (v14+)
- FFmpeg installed on your system
- Deepgram API key
- Google Gemini API key
- PocketBase running locally (or remotely)

## Setup

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
   ```

4. Set up PocketBase:
   - Download and run PocketBase from [pocketbase.io](https://pocketbase.io)
   - Create a collection named `videos` with fields:
     - `sourceUrl` (text)
     - `videoUrl` (text)
     - `requestId` (text)
     - `userId` (text)
     - `viralClips` (json)
     - `processedVideoPath` (text)
     - `finalVideoUrl` (text)

5. Start the server:
   ```
   node index.js
   ```

## Usage

### Process a YouTube video

```
GET /transcribe?videoUrl=https://example.com/video.mp4&userId=user123
```

Parameters:
- `videoUrl`: URL to the source video (YouTube or direct MP4 link)
- `userId`: Optional identifier for the user (for record keeping)

### Check processing status and get clips

```
GET /video/{requestId}
```

### View processed clips

Once processed, clips are available at:
- Individual clips: `http://localhost:3000/clips/clip_[requestId]_[index].mp4`
- Final compilation: `http://localhost:3000/clips/final_[requestId].mp4`

### List all processed videos

```
GET /reels
```

To filter by user:
```
GET /reels?userId=user123
```

## How It Works

1. Video is submitted through the `/transcribe` endpoint
2. Deepgram processes the audio, generating transcripts with sentiment scores and timestamps
3. Google Gemini analyzes the transcript to find the most engaging segments
4. FFmpeg cuts the video at the exact timestamps, adds captions, and crops to vertical format
5. Processed clips are saved locally and accessible via HTTP

## Customization

- Modify the Gemini prompt in the `/dgwebhook` handler to change clip selection criteria
- Adjust FFmpeg parameters to change video output format, resolution, etc.
- Update the caption style by modifying the drawtext filter options

## License

MIT 