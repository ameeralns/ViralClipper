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
  Chip,
  Grid,
  Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinkIcon from '@mui/icons-material/Link';
import VideocamIcon from '@mui/icons-material/Videocam';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GetAppIcon from '@mui/icons-material/GetApp';
import { formatDistanceToNow } from 'date-fns';
import ReactPlayer from 'react-player';
import api from '../services/api';
import ClipCard from '../components/ClipCard';

const VideoDetails = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchVideoDetails = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await api.getVideoDetails(videoId);
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
  }, [videoId, video?.status]);
  
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
      alert('URL copied to clipboard!');
    }
  };
  
  // Get relative time
  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Unknown date';
    }
  };

  // Format video title
  const videoTitle = video?.title || 'YouTube Video';

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
          <Paper elevation={2} sx={{ mb: 4, p: 3 }}>
            <Typography variant="h5" gutterBottom>
              {videoTitle}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Chip 
                label={video.status === 'completed' ? 'Completed' : 'Processing'} 
                color={video.status === 'completed' ? 'success' : 'warning'} 
              />
              
              {video.created_at && (
                <Chip 
                  label={`Created ${getRelativeTime(video.created_at)}`} 
                  icon={<AccessTimeIcon />}
                  variant="outlined"
                />
              )}
              
              <Chip 
                label={`${video.clips?.length || 0} clips`} 
                icon={<VideocamIcon />}
                variant="outlined"
              />
            </Box>
            
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
                  maxWidth: { xs: '200px', sm: '400px', md: '600px' }
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
            
            {video.finalVideoUrl && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Full Compilation
                </Typography>
                
                <Box sx={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#000', mb: 2 }}>
                  <ReactPlayer
                    url={video.finalVideoUrl}
                    width="100%"
                    height="100%"
                    style={{ position: 'absolute', top: 0, left: 0 }}
                    controls
                    config={{
                      file: {
                        attributes: {
                          controlsList: 'nodownload',
                          disablePictureInPicture: true,
                          preload: 'auto'
                        }
                      }
                    }}
                  />
                </Box>
                
                <Button
                  variant="contained"
                  startIcon={<GetAppIcon />}
                  href={video.finalVideoUrl}
                  target="_blank"
                  fullWidth
                >
                  Download Compilation
                </Button>
              </Box>
            )}
            
            {video.status === 'processing' && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Your video is being processed. This may take a few minutes.
                </Typography>
                <LinearProgress />
              </Box>
            )}
          </Paper>
          
          {video.clips && video.clips.length > 0 ? (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  Generated Clips
                </Typography>
                
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<GetAppIcon />}
                  onClick={() => {
                    // Download all clips in sequence
                    video.clips.forEach((clip, index) => {
                      if (clip.url) {
                        // Small delay between downloads to avoid browser blocking
                        setTimeout(() => {
                          const link = document.createElement('a');
                          link.href = clip.url;
                          link.download = `${videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_clip_${index + 1}.mp4`;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }, index * 300);
                      }
                    });
                  }}
                >
                  Download All Clips
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                {video.clips.length} clips were generated from this video.
              </Typography>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                {console.log('Clips data:', video.clips)}
                {video.clips.map((clip, index) => (
                  <Grid item key={index} xs={12} sm={12} md={6} lg={4}>
                    <ClipCard clip={clip} />
                  </Grid>
                ))}
              </Grid>
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