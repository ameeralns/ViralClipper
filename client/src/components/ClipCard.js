import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Button, 
  Collapse, 
  Box,
  IconButton,
  Chip
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';

const ClipCard = ({ clip, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(clip.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = clip.url;
    link.download = `clip_${index + 1}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Determine sentiment color
  const getSentimentColor = (score) => {
    const numScore = parseFloat(score);
    if (numScore > 0.3) return 'success';
    if (numScore < -0.3) return 'error';
    if (numScore > 0) return 'info';
    if (numScore < 0) return 'warning';
    return 'default';
  };
  
  // Format clip duration
  const getDuration = () => {
    const start = parseFloat(clip.start_time);
    const end = parseFloat(clip.end_time);
    return `${Math.round(end - start)} sec`;
  };

  return (
    <Card sx={{ mb: 2, position: 'relative' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" color="primary">
            {clip.caption}
          </Typography>
          <Box>
            <Chip 
              label={getDuration()} 
              size="small" 
              color="primary" 
              variant="outlined" 
              sx={{ mr: 1 }}
            />
            <Chip 
              label={`Sentiment: ${Math.round(parseFloat(clip.sentiment_score) * 100) / 100}`} 
              size="small" 
              color={getSentimentColor(clip.sentiment_score)}
            />
          </Box>
        </Box>
        
        <Box 
          sx={{ 
            position: 'relative', 
            pt: '56.25%', /* 16:9 Aspect Ratio */
            bgcolor: 'black',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          <video
            src={clip.url}
            controls
            preload="metadata"
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
      </CardContent>
      
      <CardActions disableSpacing>
        <Button 
          size="small" 
          startIcon={<PlayArrowIcon />}
          href={clip.url}
          target="_blank"
        >
          Open
        </Button>
        
        <Button 
          size="small" 
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Download
        </Button>
        
        <Button 
          size="small" 
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyUrl}
          color={copied ? "success" : "primary"}
        >
          {copied ? 'Copied!' : 'Copy URL'}
        </Button>
        
        <Box sx={{ ml: 'auto' }}>
          <IconButton
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </CardActions>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography paragraph variant="subtitle2" color="text.secondary">
            Timestamp: {clip.start_time}s - {clip.end_time}s
          </Typography>
          <Typography paragraph>
            "{clip.quote || 'No quote available'}"
          </Typography>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default ClipCard; 