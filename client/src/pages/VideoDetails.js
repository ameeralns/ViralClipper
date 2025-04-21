import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Button, 
  Divider,
  Container,
  Card,
  CardContent,
  LinearProgress,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinkIcon from '@mui/icons-material/Link';
import api from '../services/api';
import ClipCard from '../components/ClipCard';

const VideoDetails = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchVideoDetails = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await api.getVideoDetails(requestId);
      setVideo(data);
    } catch (err) {
      console.error('Error fetching video details:', err);
      if (err.response && err.response.status === 404) {
        setError('Video not found. It may have been deleted or the ID is incorrect.');
      } else {
        setError('Failed to load video details. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchVideoDetails();
    
    // Set up polling if the video is still processing
    const pollInterval = setInterval(() => {
      if (video && video.status === 'processing') {
        fetchVideoDetails();
      } else {
        clearInterval(pollInterval);
      }
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(pollInterval);
  }, [requestId, video?.status]);
  
  const handleRefresh = () => {
    fetchVideoDetails();
  };
  
  const handleBack = () => {
    navigate('/gallery');
  };

  // Function to copy the original URL to clipboard
  const copySourceUrl = () => {
    if (video?.sourceUrl) {
      navigator.clipboard.writeText(video.sourceUrl);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Gallery
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Video Details
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
      </Box>
      
      {loading && !video ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : video ? (
        <>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                YouTube Video Information
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  Source URL:
                </Typography>
                <Typography 
                  variant="body2" 
                  component="div" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '70%'
                  }}
                >
                  {video.sourceUrl}
                  <Button 
                    size="small" 
                    startIcon={<LinkIcon />}
                    onClick={copySourceUrl}
                    sx={{ ml: 1 }}
                  >
                    Copy
                  </Button>
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                Request ID: {video.requestId}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  Status:
                </Typography>
                <Chip 
                  label={video.status} 
                  color={video.status === 'completed' ? 'success' : 'warning'} 
                  size="small" 
                />
              </Box>
              
              {video.status === 'processing' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Your video is being processed. This may take a few minutes.
                  </Typography>
                  <LinearProgress />
                </Box>
              )}
            </CardContent>
          </Card>
          
          {video.status === 'completed' && video.finalVideoUrl && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Final Compilation
              </Typography>
              
              <Box 
                sx={{ 
                  position: 'relative', 
                  pt: '56.25%', /* 16:9 Aspect Ratio */
                  bgcolor: 'black',
                  borderRadius: 1,
                  overflow: 'hidden',
                  mb: 2
                }}
              >
                <video
                  src={video.finalVideoUrl}
                  controls
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              </Box>
              
              <Button 
                variant="contained" 
                href={video.finalVideoUrl}
                target="_blank"
                fullWidth
              >
                Download Compilation
              </Button>
            </Box>
          )}
          
          {video.clips && video.clips.length > 0 ? (
            <Box>
              <Typography variant="h5" gutterBottom>
                Individual Clips
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                {video.clips.length} clips were generated from this video.
              </Typography>
              
              <Divider sx={{ mb: 3 }} />
              
              {video.clips.map((clip, index) => (
                <ClipCard key={index} clip={clip} index={index} />
              ))}
            </Box>
          ) : video.status === 'completed' ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No clips were generated for this video.
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              Clips will appear here once processing is complete.
            </Alert>
          )}
        </>
      ) : (
        <Alert severity="warning">
          No video data found.
        </Alert>
      )}
    </Container>
  );
};

export default VideoDetails; 