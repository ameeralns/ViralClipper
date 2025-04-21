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
import { formatDistanceToNow } from 'date-fns';

const VideoGalleryItem = ({ video }) => {
  const navigate = useNavigate();
  
  const handleViewDetails = () => {
    navigate(`/video/${video.requestId}`);
  };
  
  // If we have a final video URL, use it as thumbnail, otherwise use a placeholder
  const thumbnailUrl = video.finalVideoUrl || null;
  
  // Get relative time (e.g. "3 hours ago")
  const getRelativeTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Unknown time';
    }
  };
  
  // Count clips
  const clipCount = video.viralClips?.length || 0;
  
  // Processing status
  const isProcessing = !video.finalVideoUrl;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea onClick={handleViewDetails} sx={{ flexGrow: 1 }}>
        <Box sx={{ position: 'relative' }}>
          {thumbnailUrl ? (
            <CardMedia
              component="img"
              height="140"
              image={thumbnailUrl}
              alt={`Video ${video.requestId}`}
            />
          ) : (
            <Box 
              sx={{ 
                height: 140, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'grey.200' 
              }}
            >
              <VideoFileIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
            </Box>
          )}
          
          {isProcessing && (
            <Chip
              label="Processing"
              color="secondary"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
              }}
            />
          )}
        </Box>
        
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="div" noWrap>
            YouTube Video
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            ID: {video.requestId.substring(0, 10)}...
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {getRelativeTime(video.created)}
            </Typography>
          </Box>
          
          {clipCount > 0 && (
            <Chip 
              label={`${clipCount} clips`} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
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