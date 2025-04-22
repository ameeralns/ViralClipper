import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button, 
  Box,
  Chip,
  CardActionArea,
  CardActions
} from '@mui/material';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VideocamIcon from '@mui/icons-material/Videocam';
import { formatDistanceToNow } from 'date-fns';

const VideoGalleryItem = ({ video }) => {
  const navigate = useNavigate();
  
  const handleViewDetails = () => {
    // Navigate using the document ID from Firestore which is stored in id
    navigate(`/video/${video.id}`);
  };
  
  // Get relative time (e.g. "3 hours ago")
  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  // Count clips
  const clipCount = video.clips?.length || 0;
  
  // Processing status
  const isProcessing = video.status === 'processing';
  
  // Format video title
  const videoTitle = video.title || 'YouTube Video';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea onClick={handleViewDetails} sx={{ flexGrow: 1 }}>
        <Box sx={{ position: 'relative', paddingTop: '56.25%' /* 16:9 aspect ratio */ }}>
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: 'primary.dark',
              color: 'white',
              padding: 2
            }}
          >
            <VideoFileIcon sx={{ fontSize: 60, mb: 1 }} />
            <Typography 
              variant="body2" 
              sx={{ 
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {videoTitle}
            </Typography>
          </Box>
          
          {isProcessing && (
            <Chip
              label="Processing"
              color="secondary"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1
              }}
            />
          )}
        </Box>
        
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="div" noWrap>
            {videoTitle}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, mt: 1 }}>
            <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {getRelativeTime(video.created_at)}
            </Typography>
          </Box>
          
          {clipCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <VideocamIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {clipCount} clips
              </Typography>
            </Box>
          )}
        </CardContent>
      </CardActionArea>
      
      <CardActions>
        <Button 
          size="small" 
          color="primary" 
          startIcon={<VisibilityIcon />}
          onClick={handleViewDetails}
          fullWidth
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default VideoGalleryItem; 