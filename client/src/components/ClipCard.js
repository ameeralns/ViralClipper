import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import ReactPlayer from 'react-player';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GetAppIcon from '@mui/icons-material/GetApp';
import ShareIcon from '@mui/icons-material/Share';

// Use the environment variable REACT_APP_API_URL for the production endpoint
// Fall back to relative path /api for local development
const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : '/api';

export default function ClipCard({ clip }) {
  console.log('ClipCard received:', clip, 'URL:', clip?.url);
  const [playing, setPlaying] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [useDirect, setUseDirect] = useState(false);
  
  // Create proxied URL using the correct base URL
  const getProxiedUrl = (originalUrl, forDownload = false) => {
    if (!originalUrl) return null;
    return `${API_BASE_URL}/proxy-video?url=${encodeURIComponent(originalUrl)}${forDownload ? '&download=true' : ''}`;
  };
  
  // Choose URL based on error state
  const videoUrl = useDirect ? clip.url : (clip.url ? getProxiedUrl(clip.url) : null);
  
  // Retry with direct URL if proxy fails
  const handleVideoError = (e) => {
    console.error('ReactPlayer error:', e);
    
    if (!useDirect) {
      console.log('Trying direct URL as fallback');
      setUseDirect(true);
    } else {
      setVideoError(true);
    }
  };
  
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleDownload = () => {
    if (clip.url) {
      // Always use the proxy URL for downloads with download flag
      const proxyUrl = getProxiedUrl(clip.url, true);
      
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = `${clip.clip_caption || 'clip'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    handleMenuClose();
  };
  
  const handleShare = () => {
    if (navigator.share && clip.url) {
      navigator.share({
        title: clip.clip_caption || 'Check out this clip!',
        text: clip.quote || 'Interesting video clip',
        url: clip.url
      }).catch(console.error);
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(clip.url)
        .then(() => alert('Link copied to clipboard!'))
        .catch(console.error);
    }
    handleMenuClose();
  };
  
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box 
        sx={{ 
          position: 'relative',
          paddingTop: '56.25%', // 16:9 aspect ratio (9/16 = 0.5625 = 56.25%)
          backgroundColor: '#000'
        }}
        onClick={() => setPlaying(!playing)}
      >
        {clip.url ? (
          <ReactPlayer
            url={videoUrl}
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
            playing={playing}
            controls
            light={!playing}
            onError={handleVideoError}
            onReady={() => console.log('ReactPlayer ready for:', videoUrl)}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload', // Prevent download button in HTML5 player
                  disablePictureInPicture: true,
                  preload: 'auto'
                }
              }
            }}
          />
        ) : (
          <CardMedia
            component="img"
            image="https://via.placeholder.com/640x360?text=Clip+Preview"
            alt={clip.clip_caption || "Video clip"}
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%',
              objectFit: 'cover'
            }}
          />
        )}
        
        {/* Display error message if video fails to load */}
        {videoError && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              textAlign: 'center',
              padding: 2
            }}
          >
            <Typography>
              Unable to load video. Try downloading instead.
            </Typography>
          </Box>
        )}
      </Box>
      
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 'bold',
            mb: 1,
            maxWidth: 'calc(100% - 40px)' // Make room for the menu icon
          }}>
            {clip.clip_caption || "Untitled Clip"}
          </Typography>
          
          <IconButton 
            size="small" 
            onClick={handleMenuClick}
            aria-label="clip options"
          >
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleDownload}>
              <GetAppIcon fontSize="small" sx={{ mr: 1 }} />
              Download
            </MenuItem>
            <MenuItem onClick={handleShare}>
              <ShareIcon fontSize="small" sx={{ mr: 1 }} />
              Share
            </MenuItem>
          </Menu>
        </Box>
        
        {clip.videoTitle && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            From: {clip.videoTitle}
          </Typography>
        )}
        
        {clip.quote && (
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            "{clip.quote}"
          </Typography>
        )}
        
        {/* Add visible download button */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<GetAppIcon />}
          onClick={handleDownload}
          fullWidth
          sx={{ mt: 2 }}
        >
          Download
        </Button>
      </CardContent>
    </Card>
  );
} 