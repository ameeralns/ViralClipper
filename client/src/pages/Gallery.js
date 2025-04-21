import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  CircularProgress, 
  Alert, 
  Button,
  Container
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../services/api';
import VideoGalleryItem from '../components/VideoGalleryItem';

const Gallery = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchVideos = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.getVideoList();
      setVideos(response.reels || []);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchVideos();
  }, []);
  
  const handleRefresh = () => {
    fetchVideos();
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Video Gallery
          </Typography>
          
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary">
          Browse all your processed videos and viral clips
        </Typography>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : videos.length === 0 ? (
        <Alert severity="info" sx={{ my: 2 }}>
          No videos found. Submit a YouTube video on the home page to get started.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {videos.map((video) => (
            <Grid item key={video.id} xs={12} sm={6} md={4} lg={3}>
              <VideoGalleryItem video={video} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Gallery; 