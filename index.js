require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Deepgram } = require('@deepgram/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const PocketBase = require('pocketbase/cjs');
const ffmpeg = require('fluent-ffmpeg');
const ytdlp = require('yt-dlp-exec');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Define directories for local storage
const TRANSCRIPTIONS_DIR = path.join(__dirname, 'transcriptions');
const PROCESSED_CLIPS_DIR = path.join(__dirname, 'processed_clips');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const TEMP_DIR = path.join(__dirname, 'temp'); // Directory for temporary YouTube downloads
const CLIENT_BUILD_DIR = path.join(__dirname, 'client/build');

// Create directories if they don't exist
if (!fs.existsSync(TRANSCRIPTIONS_DIR)) {
    fs.mkdirSync(TRANSCRIPTIONS_DIR);
}
if (!fs.existsSync(PROCESSED_CLIPS_DIR)) {
    fs.mkdirSync(PROCESSED_CLIPS_DIR);
}
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

// Serve static files for processed clips and uploads
app.use('/clips', express.static(PROCESSED_CLIPS_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/temp', express.static(TEMP_DIR));

// API Routes prefix
const apiRouter = express.Router();

const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

// Flag to determine which AI provider to use
const USE_GEMINI = process.env.USE_GEMINI === 'true';

// Initialize AI clients based on configuration
let genAI = null;
let openai = null;

if (USE_GEMINI) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    console.log('Google Gemini AI integration enabled');
} else {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
    console.log('OpenAI integration enabled');
}

// Flag to check if PocketBase should be used
const USE_POCKETBASE = process.env.USE_POCKETBASE === 'true';

// Initialize PocketBase conditionally
let pb = null;
if (USE_POCKETBASE) {
    pb = new PocketBase('http://127.0.0.1:8090');
    console.log('PocketBase integration enabled');
} else {
    console.log('PocketBase integration disabled');
}

// Track processed requests to avoid duplicates
const processedRequestIds = new Set();

// Helper function to check if a URL is a YouTube URL
function isYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
}

// Function to download YouTube video
async function downloadYouTubeVideo(videoUrl) {
    console.log('Downloading YouTube video from:', videoUrl);
    
    // Generate a unique filename
    const filename = `youtube_${crypto.randomUUID()}.mp4`;
    const outputPath = path.join(TEMP_DIR, filename);
    
    try {
        console.log('Starting download with yt-dlp...');
        console.log('Output path:', outputPath);
        
        // Use yt-dlp to download the video with audio (removing extractAudio option)
        await ytdlp(videoUrl, {
            output: outputPath,
            // Removed extractAudio to get both video and audio
            format: 'best[ext=mp4]/best', // Prefer MP4 format
            noCheckCertificates: true,
            preferFreeFormats: true,
            noWarnings: true,
            forceOverwrite: true
        });
        
        // Verify file exists and log its size
        if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            console.log(`YouTube video download completed: ${outputPath} (${stats.size} bytes)`);
        } else {
            // Check if yt-dlp added an extension
            const mp4Path = `${outputPath}.mp4`;
            if (fs.existsSync(mp4Path)) {
                const stats = fs.statSync(mp4Path);
                console.log(`YouTube video download completed with auto extension: ${mp4Path} (${stats.size} bytes)`);
                return {
                    filePath: mp4Path,
                    publicUrl: `${process.env.BASE_URL}/temp/${filename}.mp4`
                };
            } else {
                // List directory contents for debugging
                console.log('File not found. Directory contents:');
                const dirContents = fs.readdirSync(TEMP_DIR);
                console.log(dirContents);
                throw new Error('Downloaded file not found at expected location');
            }
        }
        
        // Return both the local file path and public URL
        return {
            filePath: outputPath,
            publicUrl: `${process.env.BASE_URL}/temp/${filename}`
        };
    } catch (error) {
        console.error('YouTube download error:', error);
        throw new Error(`Failed to download YouTube video: ${error.message}`);
    }
}

// Function to analyze transcript with OpenAI
async function analyzeWithOpenAI(prompt) {
    console.log('Sending prompt to OpenAI...');
    
    // Extract the transcript portion from the prompt with a more flexible regex
    let fullTranscript;
    const transcriptMatch = prompt.match(/Here is the transcript to analyze.*?(\[\{.*?\}\])/s);
    
    if (!transcriptMatch) {
        console.error('Failed to extract transcript with regex. Trying alternate approach...');
        // Try to find the JSON array more generally
        const jsonMatch = prompt.match(/\[\s*\{[^]*?\}\s*\]/s);
        if (!jsonMatch) {
            throw new Error('Could not parse transcript from prompt');
        }
        fullTranscript = JSON.parse(jsonMatch[0]);
        console.log(`Found transcript with ${fullTranscript.length} segments using alternate method`);
    } else {
        fullTranscript = JSON.parse(transcriptMatch[1]);
        console.log(`Full transcript has ${fullTranscript.length} segments`);
    }
    
    // Small transcript, process as is
    if (fullTranscript.length <= 20) {
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            messages: [
                { role: "system", content: "You are a video editor specializing in finding viral clips. Return only valid JSON." },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
            response_format: { type: "json_object" }
        });
        
        console.log('OpenAI response received');
        
        // Extract and parse the JSON
        const responseText = completion.choices[0].message.content;
        return JSON.parse(responseText);
    }
    
    // Otherwise, implement adaptive chunking based on transcript length
    console.log('Implementing adaptive chunking based on transcript length...');
    
    // Calculate an appropriate chunk size based on transcript length
    let chunkSize;
    if (fullTranscript.length < 50) {
        chunkSize = 20; // Small videos
    } else if (fullTranscript.length < 100) {
        chunkSize = 25; // Medium videos
    } else if (fullTranscript.length < 300) {
        chunkSize = 40; // Long videos
    } else {
        // For very long videos, split into approximately 8-10 chunks
        chunkSize = Math.ceil(fullTranscript.length / 8);
        
        // Cap maximum chunk size to avoid token limits
        chunkSize = Math.min(chunkSize, 60);
    }
    
    // Ensure minimum chunk size
    chunkSize = Math.max(chunkSize, 10);
    
    // Estimate average tokens per segment
    // Assume average of 15 words per segment × 1.3 tokens per word
    const estTokensPerSegment = 20;
    
    // Calculate estimated tokens for a chunk
    const estChunkTokens = chunkSize * estTokensPerSegment;
    
    // If estimated tokens exceed ~8K, reduce chunk size further
    if (estChunkTokens > 8000) {
        chunkSize = Math.floor(8000 / estTokensPerSegment);
        console.log(`Adjusted chunk size to ${chunkSize} to stay within token limits`);
    }
    
    console.log(`Using adaptive chunk size of ${chunkSize} segments`);
    
    const chunks = [];
    
    // Split transcript into chunks
    for (let i = 0; i < fullTranscript.length; i += chunkSize) {
        chunks.push(fullTranscript.slice(i, i + chunkSize));
    }
    
    console.log(`Split transcript into ${chunks.length} chunks`);
    
    // Process each chunk with OpenAI in parallel
    const allClips = [];
    const systemPrompt = "You are a video editor specializing in finding viral clips. Return only valid JSON.";
    
    // Create an array of promises for parallel processing
    const chunkPromises = chunks.map((chunk, i) => {
        return new Promise(async (resolve) => {
            console.log(`Starting processing for chunk ${i+1}/${chunks.length} with ${chunk.length} segments...`);
            
            // Create a smaller prompt for this chunk
            const chunkPrompt = `
            Here is a chunk of transcript to analyze, with phrase-level timing and sentiment scores:
            ${JSON.stringify(chunk, null, 2)}

            You are a TikTok video editor who specializes in finding viral moments. Your task:

            1. Find the most emotionally engaging quotes in this chunk using the sentiment scores.
            2. Use the exact timestamps for precise clip timing.
            3. Create short, catchy captions (max 4 words, no emojis).
            4. Each clip should be at minimum 15-20 seconds long for maximum engagement.
            5. Prioritize segments with sentiment_score > 0.2 or < -0.2
            6. Look for complete thoughts and natural conversation breaks.

            Required JSON format:
            {
              "clips": [
                {
                  "clip_caption": "3 words maximum caption",
                  "start_time": "use the exact start_time from the transcript",
                  "end_time": "use the exact end_time from the transcript",
                  "quote": "exact quote from transcript",
                  "sentiment_score": "average sentiment score for this segment"
                }
              ]
            }

            Note: This is chunk ${i+1} of ${chunks.length}. Focus only on finding good clips in this chunk.
            Return only valid JSON with the clips array.`;
            
            try {
                const completion = await openai.chat.completions.create({
                    model: process.env.OPENAI_MODEL || 'gpt-4o',
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: chunkPrompt }
                    ],
                    temperature: 0.2,
                    response_format: { type: "json_object" }
                });
                
                // Extract the clips array
                const chunkResponse = JSON.parse(completion.choices[0].message.content);
                const chunkClips = chunkResponse.clips || [];
                
                console.log(`Found ${chunkClips.length} potential clips in chunk ${i+1}`);
                resolve(chunkClips);
            } catch (error) {
                console.error(`Error processing chunk ${i+1}:`, error);
                resolve([]); // Return empty array on error so Promise.all doesn't fail
            }
        });
    });
    
    // Wait for all chunks to be processed in parallel
    console.log(`Processing ${chunks.length} chunks in parallel...`);
    const startTime = Date.now();
    
    const chunkResults = await Promise.all(chunkPromises);
    
    // Calculate time taken
    const timeElapsed = (Date.now() - startTime) / 1000;
    console.log(`Parallel processing completed in ${timeElapsed.toFixed(2)} seconds`);
    
    // Combine all results
    chunkResults.forEach(clips => {
        allClips.push(...clips);
    });
    
    console.log(`Total clips found across all chunks: ${allClips.length}`);
    
    // If we found enough clips, return them
    if (allClips.length >= 3) {
        return allClips;
    }
    
    // If we didn't find enough clips, try one more time with the best segments
    if (allClips.length < 3) {
        console.log('Not enough clips found, trying again with high-sentiment segments...');
        
        // Sort the transcript by absolute sentiment score to find the most emotional segments
        const sortedTranscript = [...fullTranscript].sort((a, b) => {
            return Math.abs(b.sentiment_score) - Math.abs(a.sentiment_score);
        });
        
        // Take the top segments - adapt this number based on transcript length
        const topSegmentCount = Math.min(Math.ceil(fullTranscript.length / 5), 30);
        const topSegments = sortedTranscript.slice(0, topSegmentCount);
        
        console.log(`Using top ${topSegmentCount} emotional segments for final attempt`);
        
        const finalPrompt = `
        Here are the most emotionally charged segments from the transcript:
        ${JSON.stringify(topSegments, null, 2)}

        You are a TikTok video editor who specializes in finding viral moments. Your task:

        1. Find at least 3 emotionally engaging quotes using the sentiment scores.
        2. Use the exact timestamps for precise clip timing.
        3. Create short, catchy captions (max 4 words, no emojis).
        4. Each clip should be at minimum 15-20 seconds long for maximum engagement.
        5. Prioritize segments with sentiment_score > 0.2 or < -0.2
        6. Look for complete thoughts and natural conversation breaks.

        Required JSON format:
        {
          "clips": [
            {
              "clip_caption": "3 words maximum caption",
              "start_time": "use the exact start_time from the transcript",
              "end_time": "use the exact end_time from the transcript",
              "quote": "exact quote from transcript",
              "sentiment_score": "average sentiment score for this segment"
            }
          ]
        }

        CRITICAL: You MUST return at least 3 clips of good quality.
        Return only valid JSON with the clips array.`;
        
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: finalPrompt }
            ],
            temperature: 0.2,
            response_format: { type: "json_object" }
        });
        
        console.log('Final OpenAI response received');
        
        // Extract and parse the JSON
        const responseText = completion.choices[0].message.content;
        const finalResponse = JSON.parse(responseText);
        return finalResponse.clips || [];
    }
}

// Function to analyze transcript with Gemini
async function analyzeWithGemini(prompt) {
    console.log('Sending prompt to Gemini...');
    
    try {
        // First try gemini-pro
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        console.log('Gemini response received from gemini-pro');
        
        // Extract JSON from markdown if present
        let jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                       responseText.match(/```\n([\s\S]*?)\n```/);
        
        if (jsonMatch) {
            // Parse the content inside the markdown code block
            return JSON.parse(jsonMatch[1]);
        } else {
            // Try parsing the entire response as JSON
            return JSON.parse(responseText);
        }
    } catch (geminiProError) {
        console.error('Error with gemini-pro, trying gemini-1.0-pro:', geminiProError);
        
        // Fallback to gemini-1.0-pro if gemini-pro fails
        try {
            const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
            const fallbackResult = await fallbackModel.generateContent(prompt);
            const fallbackResponseText = fallbackResult.response.text();
            console.log('Gemini response received from gemini-1.0-pro');
            
            // Extract JSON from markdown if present
            let jsonMatch = fallbackResponseText.match(/```json\n([\s\S]*?)\n```/) || 
                           fallbackResponseText.match(/```\n([\s\S]*?)\n```/);
            
            if (jsonMatch) {
                // Parse the content inside the markdown code block
                return JSON.parse(jsonMatch[1]);
            } else {
                // Try parsing the entire response as JSON
                return JSON.parse(fallbackResponseText);
            }
        } catch (fallbackError) {
            console.error('Error with gemini-1.0-pro:', fallbackError);
            throw new Error('All Gemini models failed');
        }
    }
}

// Health check endpoint
apiRouter.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'YouTube to Viral Clips Processor is running',
        ai_provider: USE_GEMINI ? 'Google Gemini' : 'OpenAI'
    });
});

apiRouter.get('/transcribe', async (req, res) => {
    const { videoUrl, userId } = req.query;
    console.log('videoUrl =', videoUrl);
    console.log('userId =', userId);

    if (!videoUrl) {
        return res.status(400).json({ error: 'videoUrl is required' });
    }

    try {
        let mediaFilePath;
        let localVideoUrl = videoUrl;
        
        // If this is a YouTube URL, download it first
        if (isYouTubeUrl(videoUrl)) {
            console.log('YouTube URL detected, downloading...');
            try {
                const downloadResult = await downloadYouTubeVideo(videoUrl);
                mediaFilePath = downloadResult.filePath;
                localVideoUrl = downloadResult.publicUrl;
                console.log('Downloaded to:', mediaFilePath);
            } catch (downloadError) {
                console.error('YouTube download failed:', downloadError);
                return res.status(500).json({
                    error: 'Failed to download YouTube video',
                    details: downloadError.message
                });
            }
        } else {
            // For direct media URLs, we should download them too
            try {
                console.log('Direct media URL detected, downloading...');
                const response = await axios({
                    method: 'get',
                    url: videoUrl,
                    responseType: 'arraybuffer'
                });
                
                // Save to a temporary file
                const filename = `direct_${crypto.randomUUID()}.mp4`;
                mediaFilePath = path.join(TEMP_DIR, filename);
                fs.writeFileSync(mediaFilePath, response.data);
                localVideoUrl = `${process.env.BASE_URL}/temp/${filename}`;
                console.log('Downloaded direct media to:', mediaFilePath);
            } catch (downloadError) {
                console.error('Direct media download failed:', downloadError);
                return res.status(500).json({
                    error: 'Failed to download media',
                    details: downloadError.message
                });
            }
        }
        
        // Remove the buffer reading since we'll use streams
        console.log('Sending file to Deepgram via stream...');

        // Get MIME type based on file extension
        const mimeType = path.extname(mediaFilePath).toLowerCase() === '.mp4' ? 'video/mp4' : 'audio/mp3';
        console.log(`Using MIME type: ${mimeType}`);
        
        // Create a readable stream instead of loading the entire file
        const fileStream = fs.createReadStream(mediaFilePath);
        
        // Use the file stream with proper mimetype
        const response = await deepgram.transcription.preRecorded(
            { stream: fileStream, mimetype: mimeType },
            {
                model: 'general',
                language: 'en-US',
                sentiment: true,
                detect_topics: true,
                summarize: true,
                detect_entities: true
            }
        );

        console.log('Deepgram response received, processing transcript...');
        const requestId = crypto.randomUUID();

        // Create record in PocketBase if enabled
        let record = null;
        if (USE_POCKETBASE && pb) {
            try {
                record = await pb.collection('videos').create({
                    sourceUrl: videoUrl,
                    videoUrl: localVideoUrl,
                    requestId: requestId,
                    userId: userId || 'anonymous'
                });
                console.log('PocketBase record created:', record);
            } catch (pbError) {
                console.error('PocketBase error:', pbError);
                // Continue execution even if PocketBase fails
            }
        } else {
            console.log('Skipping PocketBase record creation (disabled)');
        }

        // Process the transcript synchronously
        const transcript = response.results?.channels[0]?.alternatives[0]?.transcript || '';
        
        // Write the full transcript to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const transcriptFilename = path.join(TRANSCRIPTIONS_DIR, `transcription-${timestamp}.json`);
        
        try {
            fs.writeFileSync(
                transcriptFilename, 
                JSON.stringify(response, null, 2),
                'utf8'
            );
            console.log(`Transcript saved to: ${transcriptFilename}`);
        } catch (writeError) {
            console.error('Error writing transcript to file:', writeError);
        }

        console.log('Transcript length:', transcript.length);

        // Extract transcript with word-level timing and sentiment data
        const words = response.results?.channels[0]?.alternatives[0]?.words || [];
        const sentimentSegments = response.results?.sentiments?.segments || [];
        
        // Create a simplified transcript with sentiment segments
        const annotatedTranscript = sentimentSegments.map(segment => {
            // Find the first and last word in this segment for timing
            const firstWord = words[segment.start_word] || { start: 0 };
            const lastWord = words[segment.end_word] || { end: 0 };
            
            return {
                text: segment.text,
                sentiment: segment.sentiment,
                sentiment_score: segment.sentiment_score,
                start_time: firstWord.start,
                end_time: lastWord.end,
                duration: lastWord.end - firstWord.start
            };
        });

        // Filter out very short segments (less than 2 seconds)
        const filteredTranscript = annotatedTranscript.filter(segment => 
            segment.duration >= 2 && segment.text.trim().length > 0
        );

        console.log(`Filtered transcript from ${annotatedTranscript.length} to ${filteredTranscript.length} segments`);

        // Setup prompt for AI
        const prompt = `
        Here is the transcript to analyze, with phrase-level timing and sentiment scores:
        ${JSON.stringify(filteredTranscript, null, 2)}

        You are a TikTok video editor who specializes in finding viral moments. Your task:

        1. Find the most emotionally engaging quotes using the sentiment scores.
        2. Use the exact timestamps for precise clip timing.
        3. Create short, catchy captions (max 4 words, no emojis).
        4. Each clip should be at minimum 15-20 seconds long for maximum engagement.
        5. Prioritize segments with sentiment_score > 0.2 or < -0.2
        6. You may combine consecutive segments to form longer clips.
        7. Look for complete thoughts and natural conversation breaks.

        Required JSON format:
        {
          "clips": [
            {
              "clip_caption": "3 words maximum caption",
              "start_time": "use the exact start_time from the transcript",
              "end_time": "use the exact end_time from the transcript",
              "quote": "exact quote from transcript",
              "sentiment_score": "average sentiment score for this segment"
            }
          ]
        }

        CRITICAL REQUIREMENTS:
        - Must return at least three clips in the array
        - Each clip must be at minimum 15-20 seconds long
        - Must use exact timestamps from the transcript
        - Must be valid JSON
        - No commentary or explanations
        - No emojis or special characters in captions
        - Captions must be 3 words or less. Use small words.
        - Quote must match exactly with the text field
        - Prioritize segments with strong sentiment scores
        - Look for complete conversational exchanges
        - Avoid cutting mid-sentence

        Return only the JSON object with the clips array.`;

        try {
            // Use the selected AI provider to analyze the transcript
            let parsedResponse;
            
            if (USE_GEMINI && genAI) {
                const result = await analyzeWithGemini(prompt);
                // Extract the clips array if the response is an object with a clips property
                parsedResponse = result.clips || result;
            } else if (openai) {
                const result = await analyzeWithOpenAI(prompt);
                // Extract the clips array if the response is an object with a clips property
                parsedResponse = result.clips || result;
            } else {
                throw new Error('No AI provider configured');
            }
            
            // Ensure parsedResponse is an array
            if (!Array.isArray(parsedResponse)) {
                console.error('AI response is not an array:', parsedResponse);
                throw new Error('Invalid response format: expected an array of clips');
            }
            
            console.log('Parsed response:', parsedResponse);

            // Format the clips into a readable list
            const clipsList = parsedResponse.map(clip => 
                `• ${clip.clip_caption} (${clip.start_time}s to ${clip.end_time}s, sentiment: ${clip.sentiment_score})`
            ).join('\n');
            console.log('Selected clips:', clipsList);

            // Update PocketBase record if enabled
            if (USE_POCKETBASE && pb && record) {
                try {
                    const updatedRecord = await pb.collection('videos').update(record.id, {
                        viralClips: parsedResponse
                    });

                    // kick off ffmpeg job
                    console.log('Starting FFmpeg processing...');
                    
                    const videoUrl = updatedRecord.videoUrl;
                    
                    // Process each clip
                    const clipPromises = updatedRecord.viralClips.map(async (clip, index) => {
                        const clipFileName = `clip_${requestId}_${index}.mp4`;
                        const clipOutputPath = path.join(PROCESSED_CLIPS_DIR, clipFileName);
                        return new Promise((resolve, reject) => {
                            ffmpeg(videoUrl)
                                .setStartTime(clip.start_time)
                                .setDuration((clip.end_time - clip.start_time) + 1.5)
                                // Preserve quality with high-quality settings
                                .outputOptions([
                                    '-c:v libx264',
                                    '-preset slow',
                                    '-crf 18',
                                    '-c:a aac',
                                    '-b:a 192k',
                                    '-pix_fmt yuv420p'
                                ])
                                .output(clipOutputPath)
                                .on('end', () => {
                                    console.log(`Clip ${index} completed: ${clipOutputPath}`);
                                    resolve(clipOutputPath);
                                })
                                .on('error', (err) => {
                                    console.error(`Error processing clip ${index}:`, err);
                                    reject(err);
                                })
                                .run();
                        });
                    });

                    try {
                        // Wait for all clips to be processed
                        const clipPaths = await Promise.all(clipPromises);
                        console.log('All individual clips processed');

                        // Create final compilation
                        const finalFileName = `final_${requestId}.mp4`;
                        const finalOutputPath = path.join(PROCESSED_CLIPS_DIR, finalFileName);
                        
                        // Create a list file for concatenation
                        const listFilePath = path.join(PROCESSED_CLIPS_DIR, `list_${requestId}.txt`);
                        const listContent = clipPaths.map(path => `file '${path}'`).join('\n');
                        fs.writeFileSync(listFilePath, listContent);

                        // Use concat demuxer to maintain clip order
                        await new Promise((resolve, reject) => {
                            ffmpeg()
                                .input(listFilePath)
                                .inputOptions(['-f', 'concat', '-safe', '0'])
                                .outputOptions('-c copy')  // Copy streams without re-encoding
                                .on('end', () => {
                                    console.log('Compilation completed');
                                    resolve();
                                })
                                .on('error', (err) => {
                                    console.error('Compilation error:', err);
                                    reject(err);
                                })
                                .save(finalOutputPath);
                        });

                        // Create a publicly accessible URL for the final video
                        const finalVideoUrl = `${process.env.BASE_URL}/clips/${finalFileName}`;
                        
                        // Update PocketBase record with the final video URL
                        await pb.collection('videos').update(record.id, {
                            processedVideoPath: finalOutputPath,
                            finalVideoUrl: finalVideoUrl
                        });
                        
                        console.log('Video processing complete. Final video available at:', finalVideoUrl);
                    } catch (ffmpegError) {
                        console.error('FFmpeg error:', ffmpegError);
                    }
                } catch (pbError) {
                    console.error('PocketBase update error:', pbError);
                }
            } else {
                console.log('Skipping PocketBase update (disabled or no record)');
                
                // Process the videos even without PocketBase
                console.log('Starting FFmpeg processing...');
                
                // Process each clip
                const clipPromises = parsedResponse.map(async (clip, index) => {
                    const clipFileName = `clip_${requestId}_${index}.mp4`;
                    const clipOutputPath = path.join(PROCESSED_CLIPS_DIR, clipFileName);
                    return new Promise((resolve, reject) => {
                        ffmpeg(localVideoUrl)
                            .setStartTime(clip.start_time)
                            .setDuration((clip.end_time - clip.start_time) + 1.5)
                            // Preserve quality with high-quality settings
                            .outputOptions([
                                '-c:v libx264',
                                '-preset slow',
                                '-crf 18',
                                '-c:a aac',
                                '-b:a 192k',
                                '-pix_fmt yuv420p'
                            ])
                            .output(clipOutputPath)
                            .on('end', () => {
                                console.log(`Clip ${index} completed: ${clipOutputPath}`);
                                resolve(clipOutputPath);
                            })
                            .on('error', (err) => {
                                console.error(`Error processing clip ${index}:`, err);
                                reject(err);
                            })
                            .run();
                    });
                });

                try {
                    // Wait for all clips to be processed
                    const clipPaths = await Promise.all(clipPromises);
                    console.log('All individual clips processed');

                    // Create final compilation
                    const finalFileName = `final_${requestId}.mp4`;
                    const finalOutputPath = path.join(PROCESSED_CLIPS_DIR, finalFileName);
                    
                    // Create a list file for concatenation
                    const listFilePath = path.join(PROCESSED_CLIPS_DIR, `list_${requestId}.txt`);
                    const listContent = clipPaths.map(path => `file '${path}'`).join('\n');
                    fs.writeFileSync(listFilePath, listContent);

                    // Use concat demuxer to maintain clip order
                    await new Promise((resolve, reject) => {
                        ffmpeg()
                            .input(listFilePath)
                            .inputOptions(['-f', 'concat', '-safe', '0'])
                            .outputOptions('-c copy')  // Copy streams without re-encoding
                            .on('end', () => {
                                console.log('Compilation completed');
                                resolve();
                            })
                            .on('error', (err) => {
                                console.error('Compilation error:', err);
                                reject(err);
                            })
                            .save(finalOutputPath);
                    });

                    // Create a publicly accessible URL for the final video
                    const finalVideoUrl = `${process.env.BASE_URL}/clips/${finalFileName}`;
                    console.log('Video processing complete. Final video available at:', finalVideoUrl);
                    
                    // Clean up the list file
                    try {
                        fs.unlinkSync(listFilePath);
                    } catch (cleanupErr) {
                        console.error('Failed to delete list file:', cleanupErr);
                    }
                    
                    // Generate response data with all the clip URLs
                    const clipUrls = clipPaths.map((clipPath, index) => {
                        const clipFileName = path.basename(clipPath);
                        return {
                            url: `${process.env.BASE_URL}/clips/${clipFileName}`,
                            caption: parsedResponse[index].clip_caption,
                            start_time: parsedResponse[index].start_time,
                            end_time: parsedResponse[index].end_time,
                            quote: parsedResponse[index].quote,
                            sentiment_score: parsedResponse[index].sentiment_score
                        };
                    });
                    
                    // Include this data in the response
                    res.json({
                        message: 'Video processed successfully',
                        requestId: requestId,
                        clips: clipUrls,
                        final_video: finalVideoUrl,
                        status: 'complete'
                    });
                    return;
                } catch (ffmpegError) {
                    console.error('FFmpeg error:', ffmpegError);
                }
            }

            // Clean up temporary downloaded files if applicable
            try {
                if (fs.existsSync(mediaFilePath)) {
                    fs.unlinkSync(mediaFilePath);
                    console.log('Temporary file cleaned up:', mediaFilePath);
                }
            } catch (cleanupErr) {
                console.error('Failed to delete temporary file:', cleanupErr);
            }

            // Send the successful response with clips and request ID
            res.json({
                message: 'Video processed successfully',
                requestId: requestId,
                clips: parsedResponse,
                status: 'complete'
            });
        } catch (aiError) {
            console.error('AI error:', aiError);
            res.status(500).json({
                error: 'Failed to process transcript with AI',
                details: aiError.message
            });
        }
    } catch (error) {
        console.error('Transcription error details:', error.response?.data || error);
        res.status(500).json({
            error: 'Failed to start transcription',
            details: error.response?.data || error.message
        });
    }
});

apiRouter.get('/reels', async (req, res) => {
    const { userId } = req.query;

    if (USE_POCKETBASE && pb) {
        try {
            // Set default filter if userId is not provided
            let filter = userId ? `userId = "${userId}"` : '';
            
            // Query PocketBase for records
            const records = await pb.collection('videos').getList(1, 50, {
                filter: filter,
                sort: '-created'  // Sort by newest first
            });

            res.json({
                success: true,
                total: records.totalItems,
                reels: records.items
            });
        } catch (error) {
            console.error('Error fetching reels:', error);
            res.status(500).json({ 
                error: 'Failed to fetch reels',
                details: error.message
            });
        }
    } else {
        // Return empty response if PocketBase is disabled
        res.json({
            success: true,
            total: 0,
            reels: [],
            message: 'PocketBase integration is disabled'
        });
    }
});

// Simple endpoint to get info about a specific processed video
apiRouter.get('/video/:requestId', async (req, res) => {
    const { requestId } = req.params;
    
    if (USE_POCKETBASE && pb) {
        try {
            const records = await pb.collection('videos').getList(1, 1, {
                filter: `requestId = "${requestId}"`
            });

            if (records.items.length === 0) {
                return res.status(404).json({ 
                    error: 'Video not found',
                    requestId
                });
            }

            const video = records.items[0];
            const clipsUrls = [];
            
            // Add URLs for individual clips
            if (video.viralClips && Array.isArray(video.viralClips)) {
                video.viralClips.forEach((clip, index) => {
                    clipsUrls.push({
                        caption: clip.clip_caption,
                        url: `${process.env.BASE_URL}/clips/clip_${requestId}_${index}.mp4`,
                        start_time: clip.start_time,
                        end_time: clip.end_time,
                        quote: clip.quote,
                        sentiment_score: clip.sentiment_score
                    });
                });
            }

            res.json({
                requestId: video.requestId,
                sourceUrl: video.videoUrl,
                finalVideoUrl: video.finalVideoUrl,
                createdAt: video.created,
                clips: clipsUrls,
                status: video.finalVideoUrl ? 'completed' : 'processing'
            });
        } catch (error) {
            console.error('Error fetching video details:', error);
            res.status(500).json({ 
                error: 'Failed to fetch video details',
                details: error.message
            });
        }
    } else {
        // Try to locate video files by requestId
        const clipPattern = new RegExp(`clip_${requestId}_\\d+\\.mp4$`);
        const finalPattern = new RegExp(`final_${requestId}\\.mp4$`);
        
        try {
            const files = fs.readdirSync(PROCESSED_CLIPS_DIR);
            const clips = files.filter(file => clipPattern.test(file));
            const final = files.find(file => finalPattern.test(file));
            
            if (clips.length === 0 && !final) {
                return res.status(404).json({ 
                    error: 'Video not found',
                    requestId
                });
            }
            
            const clipsUrls = clips.map(clip => {
                // Extract index from filename
                const index = parseInt(clip.match(/clip_[^_]+_(\d+)\.mp4$/)[1], 10);
                return {
                    caption: `Clip ${index + 1}`,
                    url: `${process.env.BASE_URL}/clips/${clip}`,
                    index
                };
            });
            
            // Sort clips by index
            clipsUrls.sort((a, b) => a.index - b.index);
            
            res.json({
                requestId,
                finalVideoUrl: final ? `${process.env.BASE_URL}/clips/${final}` : null,
                clips: clipsUrls,
                status: final ? 'completed' : 'processing',
                message: 'Limited info available (PocketBase disabled)'
            });
        } catch (error) {
            console.error('Error fetching video files:', error);
            res.status(500).json({ 
                error: 'Failed to fetch video details',
                details: error.message
            });
        }
    }
});

// Mount API routes with /api prefix
app.use('/api', apiRouter);

// Serve frontend static files from the React build directory
// This code should be after all API routes
if (fs.existsSync(CLIENT_BUILD_DIR)) {
    // Serve the static files from the React app
    app.use(express.static(CLIENT_BUILD_DIR));
    
    // For any other request, send the React app's index.html
    app.get('*', (req, res) => {
        res.sendFile(path.join(CLIENT_BUILD_DIR, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`AI provider: ${USE_GEMINI ? 'Google Gemini' : 'OpenAI'}`);
    console.log(`API available at: http://localhost:${PORT}/api`);
    console.log(`Processed clips available at: http://localhost:${PORT}/clips`);
    console.log(`Uploads available at: http://localhost:${PORT}/uploads`);
}); 