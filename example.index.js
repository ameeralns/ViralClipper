require('dotenv').config();
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Deepgram } = require('@deepgram/sdk');
const OpenAI = require('openai');
const PocketBase = require('pocketbase/cjs');
const ffmpeg = require('fluent-ffmpeg');
const DiscordService = require('./discord-service');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const CLIENT_ID = process.env.TIKTOK_CLIENT_ID;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI;

// Define directories for local storage
const TRANSCRIPTIONS_DIR = path.join(__dirname, 'transcriptions');
const PROCESSED_CLIPS_DIR = path.join(__dirname, 'processed_clips');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

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

// Serve static files from processed_clips directory
app.use('/clips', express.static(PROCESSED_CLIPS_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Add at the top with other global variables
const processedRequestIds = new Set();

// Add after other const declarations
const pb = new PocketBase('http://127.0.0.1:8090');

app.get('/auth/tiktok', (req, res) => {
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/`
    + `?client_key=${CLIENT_ID}`
    + `&response_type=code`
    + `&scope=user.info.basic%2Cvideo.list%2Cvideo.publish%2Cvideo.upload`
    + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
    + `&state=random_string`;
    res.json({ authUrl });
    // res.redirect(authUrl);
});

app.get('/auth/tiktok/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).send('No code received');
    }
    try {
        let queryString = querystring.stringify({
            client_key: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI
        });
        console.log('queryString =', queryString);
        const tokenResponse = await axios.post('https://open.tiktokapis.com/v2/oauth/token/',
            queryString,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        
        console.log('tokenResponse =', tokenResponse.data);
        const accessToken = tokenResponse.data.access_token;
        // res.json({ tokenResponse });
        

        // // Fetch user info
        const userInfoResponse = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { fields: 'open_id,union_id,avatar_url,display_name' }
        });

        userInfoResponse.data.access_token = accessToken;

        res.json(userInfoResponse.data);
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Authentication failed');
    }
});

app.post('/upload', async (req, res) => {
    console.log('req.body =', req.body);
    const { 
        videoUrl,
        accessToken,
        title,
        privacy_level = 'PUBLIC',
        disable_duet = false,
        disable_comment = false,
        disable_stitch = false,
        video_cover_timestamp_ms = 0
    } = req.body;

    if (!videoUrl || !accessToken) {
        return res.status(400).json({ error: 'Video URL and access token are required' });
    }
    try {
        let data = {
            source_info: {
                source: 'PULL_FROM_URL',
                video_url: videoUrl
            }
        }

        const initResponse = await axios.post(
            'https://open.tiktokapis.com/v2/post/publish/inbox/video/init/',
            data,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('initResponse =', initResponse.data);

        /*
            {
            data: { publish_id: 'v_inbox_url~v2.7467675052038195246' },
            error: {
                code: 'ok',
                message: '',
                log_id: '202502042114235DB02A8AC178739FACBF'
            }
            }
        */


        res.json(initResponse.data);

        /*
        // First step: Initialize upload
        const initResponse = await axios.post(
            'https://open.tiktokapis.com/v2/post/publish/video/init/',
            {},
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('initResponse =', initResponse.data);

        const { upload_url } = initResponse.data.data;

        console.log('upload_url =', upload_url);

        // Second step: Upload video
        await axios.post(upload_url, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${accessToken}`
            }
        });

        // Third step: Publish video
        const publishResponse = await axios.post(
            'https://open.tiktokapis.com/v2/post/publish/video/publish/',
            {
                title,
                privacy_level,
                disable_duet,
                disable_comment,
                disable_stitch,
                video_cover_timestamp_ms
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        res.json(publishResponse.data);
        */

    } catch (error) {
        console.error('Upload error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to upload video',
            details: error.response?.data || error.message 
        });
    }
});

// Replace S3 URL generator with local file storage function
app.post('/file-upload', async (req, res) => {
    try {
        const { contentType = 'video/mp4' } = req.body;
        
        // Generate a unique filename with appropriate extension
        const extension = contentType ? `.${contentType.split('/')[1]}` : '.mp4';
        const fileName = `${crypto.randomUUID()}${extension}`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        
        // Return the filepath and URL where it will be accessible
        res.json({
            fileName,
            filePath,
            publicURL: `${process.env.BASE_URL}/uploads/${fileName}`
        });
    } catch (error) {
        console.error('Error generating file path:', error);
        res.status(500).json({
            error: 'Failed to generate upload location',
            details: error.message
        });
    }
});

// Helper function to save a buffer to a file
function saveBufferToFile(buffer, filePath) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, buffer, (err) => {
            if (err) return reject(err);
            resolve(filePath);
        });
    });
}

app.get('/discord', async (req, res) => {
    await DiscordService.post('Test', 'Test');
    res.json({ message: 'Discord message sent' });
});

app.get('/transcribe', async (req, res) => {
    const { audioUrl, videoUrl, userId } = req.query;
    console.log('audioUrl =', audioUrl);
    console.log('videoUrl =', videoUrl);
    console.log('userId =', userId);

    
    
    if (!audioUrl) {
        return res.status(400).json({ error: 'audioUrl is required' });
    }

    console.log('Original URL:', audioUrl);
    const encodedUrl = encodeURI(audioUrl);
    console.log('Encoded URL:', encodedUrl);

    try {
        const response = await deepgram.transcription.preRecorded(
            { url: encodedUrl },
            {
                model: 'general',
                language: 'en-US',
                sentiment: true,
                detect_topics: true,
                summarize: true,
                detect_entities: true,
                callback: `${process.env.BASE_URL}/dgwebhook`
            }
        );

        console.log('Deepgram response:', response);

        // Create record in PocketBase
        try {
            const record = await pb.collection('videos').create({
                sourceUrl: audioUrl,
                videoUrl: videoUrl,
                requestId: response.request_id,
                userId: userId
            });
            await DiscordService.post('New Request', `record_id: ${record.id}\nuser_id: ${userId}\nvideo_url: ${videoUrl}\naudio_url: ${audioUrl}`);
            await DiscordService.post('Deepgram: Request sent', `request_id: ${response.request_id}`);
            console.log('PocketBase record created:', record);
        } catch (pbError) {
            console.error('PocketBase error:', pbError);
            // Continue execution even if PocketBase fails
        }

        res.json({
            message: 'Transcription started',
            requestId: response.request_id
        });

    } catch (error) {
        console.error('Transcription error details:', error.response?.data || error);
        res.status(500).json({
            error: 'Failed to start transcription',
            details: error.response?.data || error.message
        });
    }
});

app.post('/dgwebhook', express.raw({type: 'application/json', limit: '50mb'}), async (req, res) => {
    try {
        let jsonData;
        if (Buffer.isBuffer(req.body)) {
            jsonData = JSON.parse(req.body.toString('utf8'));
        } else if (typeof req.body === 'object') {
            jsonData = req.body;
        } else {
            jsonData = JSON.parse(req.body);
        }

        const transcript = jsonData.results?.channels[0]?.alternatives[0]?.transcript || '';
        const requestId = jsonData.metadata.request_id;

        
        

        // Write the full transcript to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const transcriptFilename = path.join(TRANSCRIPTIONS_DIR, `transcription-${timestamp}.json`);
        
        try {
            // Ensure transcriptions directory exists
            if (!fs.existsSync(TRANSCRIPTIONS_DIR)) {
                fs.mkdirSync(TRANSCRIPTIONS_DIR);
            }
            
            // Write the full JSON response to file
            fs.writeFileSync(
                transcriptFilename, 
                JSON.stringify(jsonData, null, 2),  // Pretty print with 2 spaces
                'utf8'
            );
            console.log(`Transcript saved to: ${transcriptFilename}`);
        } catch (writeError) {
            console.error('Error writing transcript to file:', writeError);
        }

        // Check if we've already processed this request
        if (processedRequestIds.has(requestId)) {
            console.log(`Already processed request ${requestId}, skipping`);
            return res.status(200).send('Already processed');
        }

        // Mark this request as processed
        processedRequestIds.add(requestId);
        await DiscordService.post('Deepgram: Webhook received', `request_id: ${requestId}`);

        console.log('Transcript length:', transcript.length);

        // Create a thread
        const thread = await openai.beta.threads.create();
        console.log('Thread created:', thread.id);

        // Extract transcript with word-level timing and sentiment data
        const words = jsonData.results?.channels[0]?.alternatives[0]?.words || [];
        const sentimentSegments = jsonData.results?.sentiments?.segments || [];
        
        // Create an annotated transcript with precise timing and sentiment
        const annotatedTranscript = sentimentSegments.map(segment => {
            // Find all words that fall within this segment's word range
            const segmentWords = words.slice(segment.start_word, segment.end_word + 1);
            
            return {
                text: segment.text,
                sentiment: segment.sentiment,
                sentiment_score: segment.sentiment_score,
                start: segmentWords[0]?.start || 0,
                end: segmentWords[segmentWords.length - 1]?.end || 0,
                word_timestamps: segmentWords.map(word => ({
                    word: word.word,
                    start: word.start,
                    end: word.end
                }))
            };
        });

        // Add a message to the thread with the enhanced transcript data
        const message = await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: `Here is the transcript to analyze, with precise word-level timing and sentiment scores:
                ${JSON.stringify(annotatedTranscript, null, 2)}

                You are a TikTok video editor who specializes in finding viral moments. Your task:

                1. Find the most emotionally engaging LONG quotes using the sentiment scores.
                2. Use the exact word-level timestamps for precise clip timing.
                3. Create short, catchy captions (max 4 words, no emojis).
                4. Each clip should be at minimum 15-20 seconds long for maximum engagement.
                5. Prioritize segments with sentiment_score > 0.2 or < -0.2
                6. Look for complete thoughts and natural conversation breaks.

                Required JSON format:
                [{
                    "clip_caption": "3 words maximum caption",
                    "start_time": "use the exact start timestamp of the first word",
                    "end_time": "use the exact end timestamp of the last word",
                    "quote": "exact quote from transcript",
                    "sentiment_score": "average sentiment score for this segment"
                }]

                CRITICAL REQUIREMENTS:
                - Must return at least three objects
                - Each clip must be at minimum 15-20 seconds long
                - Must use exact timestamps from the word_timestamps
                - Must be valid JSON
                - No commentary or explanations
                - No emojis or special characters in captions
                - Captions must be 3 words or less. Use small words.
                - Quote must match exactly with the text field
                - Prioritize segments with strong sentiment scores
                - Look for complete conversational exchanges
                - Avoid cutting mid-sentence

                Output only the JSON array. No other text.`
        });
        console.log('Message created:', message);

        console.log('message.content =', message.content);

        // Create a run
        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: process.env.OPENAI_ASSISTANT_ID
        });
        await DiscordService.post('Open AI: Sentiment Analysis', `run_id: ${run.id}`);
        console.log('Run created:', run.id);

        // Poll for the run completion
        await pollRunStatus(openai, thread.id, run.id);
        console.log('Run completed');

        // Get messages after run completion
        const messages = await openai.beta.threads.messages.list(thread.id);
        const lastMessage = messages.data[0];
        console.log('Response received:', lastMessage.content[0].text.value);

        

        // Clean up
        try {
            await openai.beta.threads.del(thread.id);
            console.log('Cleanup completed');
        } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
        }

        // Extract JSON from markdown if present
        let responseText = lastMessage.content[0].text.value;
        let jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                       responseText.match(/```\n([\s\S]*?)\n```/);
        
        let parsedResponse;
        if (jsonMatch) {
            // Parse the content inside the markdown code block
            parsedResponse = JSON.parse(jsonMatch[1]);
        } else {
            // Try parsing the entire response as JSON
            parsedResponse = JSON.parse(responseText);
        }
        console.log('Parsed response:', parsedResponse);
        await DiscordService.post('Open AI: Received Response', '');

        // Format the clips into a readable list
        const clipsList = parsedResponse.map(clip => 
            `• ${clip.clip_caption} (${clip.start_time}s to ${clip.end_time}s, sentiment: ${clip.sentiment_score})`
        ).join('\n');

        await DiscordService.post('OpenAI: Selected Clips', 
            '```\n' + clipsList + '\n```'
        );

        // Update PocketBase record
        try {
            const records = await pb.collection('videos').getList(1, 1, {
                filter: `requestId = "${requestId}"`
            });

            if (records.items.length > 0) {
                const record = records.items[0];
                const updatedRecord = await pb.collection('videos').update(record.id, {
                    viralClips: parsedResponse
                });

                // kick off ffmpeg job
                console.log('Starting FFmpeg processing...');
                await DiscordService.post('FFMPEG: Pipeline Started', ``);
                
                const videoUrl = updatedRecord.videoUrl;
                
                // Process each clip
                const clipPromises = updatedRecord.viralClips.map(async (clip, index) => {
                    const clipFileName = `clip_${requestId}_${index}.mp4`;
                    const clipOutputPath = path.join(PROCESSED_CLIPS_DIR, clipFileName);
                    return new Promise((resolve, reject) => {
                        // Function to format caption into multiple lines
                        const formatCaption = (caption) => {
                            // Clean the caption first
                            const cleanCaption = caption
                                .replace(/[^\w\s]/g, '')    // Remove special characters
                                .replace(/\s+/g, ' ')       // Normalize spaces
                                .trim();                    // Remove edge spaces
                        
                            // Return the entire caption as a single line with escaped spaces
                            return cleanCaption.split(' ').join('\\ ');
                        };

                        ffmpeg(videoUrl)
                            .setStartTime(clip.start_time)
                            .setDuration(clip.end_time - clip.start_time)
                            // Crop to TikTok dimensions (1080x1920)
                            .videoFilters([
                                {
                                    filter: 'crop',
                                    options: {
                                        w: 'min(ih*9/16,iw)',  // TikTok aspect ratio
                                        h: 'min(iw*16/9,ih)',
                                        x: '(iw-min(ih*9/16,iw))/2',  // Center horizontally
                                        y: '(ih-min(iw*16/9,ih))/2'   // Center vertically
                                    }
                                },
                                {
                                    filter: 'scale',
                                    options: {
                                        w: 1080,
                                        h: 1920
                                    }
                                },
                                {
                                    filter: 'drawtext',
                                    options: {
                                        text: formatCaption(clip.clip_caption),
                                        fontsize: 'w/15',              // Slightly smaller font (was w/12)
                                        fontcolor: 'white',
                                        x: '(w-text_w)/2',
                                        y: '(h*0.8)-th',
                                        box: 1,
                                        boxcolor: 'black',            // Solid black background
                                        boxborderw: 10,
                                        shadowcolor: 'black',
                                        shadowx: 2,
                                        shadowy: 2,
                                        line_spacing: 4,
                                        fix_bounds: true,
                                        font: 'Arial'
                                    }
                                }
                            ])
                            .output(clipOutputPath)
                            .on('end', () => {
                                console.log(`Clip ${index} completed`);
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
                    
                    await DiscordService.post('FFMPEG: Clip Available', `${finalVideoUrl}`);

                    // Clean up intermediate files (optional)
                    // If you want to keep individual clips, comment this out
                    /*
                    clipPaths.forEach(clipPath => {
                        fs.unlinkSync(clipPath);
                    });
                    fs.unlinkSync(listFilePath);
                    */

                    console.log('FFmpeg processing completed. Video available at:', finalVideoUrl);
                } catch (ffmpegError) {
                    console.error('FFmpeg error:', ffmpegError);
                }
                
            } else {
                console.error('No matching record found for requestId:', requestId);
            }
        } catch (pbError) {
            console.error('PocketBase error:', pbError);
        }

        res.json({
            message: 'File processed',
            response: parsedResponse
        });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Failed to process webhook');
    }
});
async function pollRunStatus(openai, threadId, runId, maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
        const run = await openai.beta.threads.runs.retrieve(threadId, runId);
        console.log(`Run status: ${run.status}`);
        
        if (run.status === 'completed') {
            return run;
        }
        
        if (run.status === 'failed' || run.status === 'expired' || run.status === 'cancelled') {
            throw new Error(`Run ended with status: ${run.status}`);
        }
        
        // Wait for 1 second before next poll
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Polling timed out');
}

app.get('/reels', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    try {
        // Query PocketBase for records matching userId
        const records = await pb.collection('videos').getList(1, 50, {
            filter: `userId = "${userId}"`,
            sort: '-created'  // Sort by newest first
        });

        res.json({
            success: true,
            total: records.totalItems,
            reels: records.items
        });

    } catch (error) {
        console.error('Error fetching user reels:', error);
        res.status(500).json({ 
            error: 'Failed to fetch user reels',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Processed clips available at: http://localhost:${PORT}/clips`);
    console.log(`Uploads available at: http://localhost:${PORT}/uploads`);
});