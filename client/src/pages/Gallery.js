import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  CircularProgress, 
  Alert, 
  Button,
  Container,
  Paper,
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';
import VideoGalleryItem from '../components/VideoGalleryItem';
import { useAuth } from '../contexts/AuthContext';

const Gallery = () => {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useAuth();
  
  const fetchVideos = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Call the Firebase-backed endpoint for videos
      const response = await api.getVideoList();
      
      // Handle the response in Firebase format (direct array)
      const videosList = Array.isArray(response) ? response : [];
      setVideos(videosList);
      setFilteredVideos(videosList);
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
  
  // Filter videos based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVideos(videos);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = videos.filter(video => 
      (video.title && video.title.toLowerCase().includes(query)) ||
      (video.sourceUrl && video.sourceUrl.toLowerCase().includes(query))
    );
    
    setFilteredVideos(filtered);
  }, [searchQuery, videos]);
  
  const handleRefresh = () => {
    fetchVideos();
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
        
        <TextField
          fullWidth
          placeholder="Search videos..."
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : filteredVideos.length === 0 ? (
        <Alert severity="info" sx={{ my: 2 }}>
          No videos found. Submit a YouTube video on the dashboard to get started.
        </Alert>
      ) : (
        <Paper sx={{ mb: 4, p: 3 }}>
          <Typography variant="h5" gutterBottom>
            All Videos
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            {filteredVideos.map((video) => (
              <Grid item key={video.id} xs={12} sm={6} md={4} lg={3}>
                <VideoGalleryItem video={video} />
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Container>
  );
};

export default Gallery; 