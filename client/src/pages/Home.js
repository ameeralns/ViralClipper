import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';
import VideoUrlForm from '../components/VideoUrlForm';
import { grey } from '@mui/material/colors';

const Home = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box 
        sx={{ 
          py: 6, 
          bgcolor: grey[50],
          borderRadius: 2,
          mb: 4
        }}
      >
        <Container maxWidth="lg">
          <Typography 
            variant="h2" 
            align="center" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            YouTube to Viral Clips
          </Typography>
          
          <Typography 
            variant="h5" 
            align="center" 
            color="text.secondary"
            sx={{ 
              maxWidth: '800px',
              mx: 'auto',
              fontSize: { xs: '1.1rem', md: '1.5rem' }
            }}
          >
            Transform long YouTube videos into optimized, engaging short-form content
            with AI-powered sentiment analysis
          </Typography>
        </Container>
      </Box>
      
      <VideoUrlForm />
      
      <Box sx={{ mt: 6, px: 2 }}>
        <Typography variant="h5" gutterBottom align="center">
          How It Works
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3, 
          justifyContent: 'center',
          mt: 2
        }}>
          <Paper sx={{ p: 3, width: '100%', maxWidth: 280 }}>
            <Typography variant="h6" gutterBottom>1. Submit YouTube Video</Typography>
            <Typography variant="body2" color="text.secondary">
              Enter a YouTube URL in the form above. Our system will download and analyze the video.
            </Typography>
          </Paper>
          
          <Paper sx={{ p: 3, width: '100%', maxWidth: 280 }}>
            <Typography variant="h6" gutterBottom>2. AI Analysis</Typography>
            <Typography variant="body2" color="text.secondary">
              Deepgram analyzes audio for sentiment, while Google Gemini identifies the most engaging moments.
            </Typography>
          </Paper>
          
          <Paper sx={{ p: 3, width: '100%', maxWidth: 280 }}>
            <Typography variant="h6" gutterBottom>3. Clip Generation</Typography>
            <Typography variant="body2" color="text.secondary">
              The system automatically generates optimized clips with captions, ready for short-form platforms.
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Home; 