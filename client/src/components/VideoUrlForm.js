import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const VideoUrlForm = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const validateYouTubeUrl = (url) => {
    // Basic validation - can be enhanced
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate URL
    if (!videoUrl.trim()) {
      setError('Please enter a video URL');
      setShowError(true);
      return;
    }
    
    if (!validateYouTubeUrl(videoUrl)) {
      setError('Please enter a valid YouTube URL');
      setShowError(true);
      return;
    }
    
    // Submit URL to API
    setLoading(true);
    try {
      // Pass the current user's ID if authenticated
      const userId = currentUser ? currentUser.uid : 'anonymous';
      const response = await api.processVideo(videoUrl, userId);
      console.log('Processing started:', response);
      
      // Navigate to video details page
      navigate(`/video/${response.requestId}`);
    } catch (err) {
      console.error('Error processing video:', err);
      setError(err.response?.data?.error || 'An error occurred while processing your request');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 600, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Transform YouTube Videos to Viral Clips
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph align="center">
          Enter a YouTube URL to analyze and create optimized short-form clips
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="YouTube Video URL"
            variant="outlined"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: <YouTubeIcon color="error" sx={{ mr: 1 }} />,
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Viral Clips'}
          </Button>
        </Box>
      </CardContent>
      
      <Snackbar open={showError} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default VideoUrlForm; 