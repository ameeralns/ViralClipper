import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  useTheme,
  useMediaQuery,
  Grid
} from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import VideoUrlForm from '../components/VideoUrlForm';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Container 
      maxWidth="lg"
      sx={{
        mt: { xs: 4, md: 8 },
        mb: { xs: 4, md: 8 }
      }}
    >
      <Box 
        sx={{ 
          textAlign: 'center',
          mb: 6
        }}
      >
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(45deg, #6C63FF, #FF6584)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          Create Viral Clips
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ maxWidth: '700px', mx: 'auto' }}
        >
          Transform any YouTube video into shareable, bite-sized clips with just one click
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={8} lg={7}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: { xs: 3, md: 5 }, 
              borderRadius: 2,
              background: 'linear-gradient(to bottom, #ffffff, #f5f7fa)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <YouTubeIcon 
                sx={{ 
                  fontSize: 40, 
                  color: 'error.main',
                  mr: 2
                }} 
              />
              <Typography variant="h5" component="h2" fontWeight="600">
                Process YouTube Video
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph sx={{ mb: 4 }}>
              Enter a YouTube URL below to automatically generate viral clips. Our AI will identify the most engaging 
              moments from the video and create ready-to-share clips.
            </Typography>
            
            <VideoUrlForm />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8} lg={7}>
          <Box sx={{ 
            mt: 5,
            p: 3,
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h6" gutterBottom color="text.secondary">
              How It Works
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: isSmallScreen ? 'column' : 'row', 
              justifyContent: 'space-between',
              mt: 2
            }}>
              <Box sx={{ p: 2, textAlign: 'center', flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>1. Paste URL</Typography>
                <Typography variant="body2" color="text.secondary">Paste any YouTube video link</Typography>
              </Box>
              <Box sx={{ p: 2, textAlign: 'center', flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>2. Process</Typography>
                <Typography variant="body2" color="text.secondary">Our AI analyzes the video content</Typography>
              </Box>
              <Box sx={{ p: 2, textAlign: 'center', flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>3. Share</Typography>
                <Typography variant="body2" color="text.secondary">Download and share the generated clips</Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
} 