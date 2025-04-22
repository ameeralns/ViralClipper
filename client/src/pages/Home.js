import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SpeedIcon from '@mui/icons-material/Speed';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      icon: <SmartDisplayIcon color="primary" />,
      text: "Transform long YouTube videos into engaging short clips"
    },
    {
      icon: <AudiotrackIcon color="primary" />,
      text: "Advanced sentiment analysis identifies the most emotional moments"
    },
    {
      icon: <AutoAwesomeIcon color="primary" />,
      text: "AI generates catchy captions for maximum engagement"
    },
    {
      icon: <SpeedIcon color="primary" />,
      text: "Quick processing with optimized vertical format for social media"
    }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Hero Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          bgcolor: 'primary.light', 
          color: 'primary.contrastText',
          py: 8,
          borderRadius: 0
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}
              >
                Turn Long Videos Into <br/>
                Viral Short Clips
              </Typography>
              <Typography 
                variant="h5" 
                component="p" 
                sx={{ mb: 4, opacity: 0.9 }}
              >
                Automatically transform your YouTube content into engaging short-form clips
                with AI-powered editing and caption generation.
              </Typography>
              <Box sx={{ mt: 4 }}>
                {currentUser ? (
                  <Button
                    component={RouterLink}
                    to="/dashboard"
                    variant="contained"
                    size="large"
                    sx={{ 
                      px: 4, 
                      py: 1.5, 
                      borderRadius: 2,
                      bgcolor: 'white',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)'
                      }
                    }}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <Box>
                    <Button
                      component={RouterLink}
                      to="/signup"
                      variant="contained"
                      size="large"
                      sx={{ 
                        px: 4, 
                        py: 1.5, 
                        borderRadius: 2,
                        bgcolor: 'white',
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.9)'
                        },
                        mr: 2
                      }}
                    >
                      Sign Up Free
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="outlined"
                      size="large"
                      sx={{ 
                        px: 4, 
                        py: 1.5, 
                        borderRadius: 2,
                        borderColor: 'white',
                        color: 'white',
                        '&:hover': {
                          borderColor: 'white',
                          bgcolor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Log In
                    </Button>
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid 
              item 
              xs={12} 
              md={5}
              sx={{ 
                display: { xs: 'none', md: 'flex' },
                justifyContent: 'center'
              }}
            >
              <Box 
                component="img"
                src="/hero-illustration.png"
                alt="Video clips illustration"
                sx={{ 
                  width: '100%', 
                  maxWidth: 400,
                  borderRadius: 4,
                  boxShadow: 3
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Paper>

      {/* Features Section */}
      <Container sx={{ py: 8 }}>
        <Typography 
          variant="h3" 
          component="h2" 
          align="center" 
          gutterBottom
          sx={{ fontWeight: 'bold', mb: 6 }}
        >
          How It Works
        </Typography>
        
        <Grid container spacing={4}>
          {/* Step 1 */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography 
                  variant="h4" 
                  component="div"
                  sx={{ 
                    display: 'inline-block',
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 40,
                    height: 40,
                    lineHeight: '40px',
                    mb: 2
                  }}
                >
                  1
                </Typography>
              </Box>
              <Typography variant="h5" component="h3" align="center" gutterBottom>
                Upload Video
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center">
                Paste a YouTube URL or upload a video file from your computer.
                Our system accepts videos of any length.
              </Typography>
            </Paper>
          </Grid>
          
          {/* Step 2 */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography 
                  variant="h4" 
                  component="div"
                  sx={{ 
                    display: 'inline-block',
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 40,
                    height: 40,
                    lineHeight: '40px',
                    mb: 2
                  }}
                >
                  2
                </Typography>
              </Box>
              <Typography variant="h5" component="h3" align="center" gutterBottom>
                AI Analysis
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center">
                Our AI analyzes audio sentiment, dialogue, and content to identify
                the most engaging moments in your video.
              </Typography>
            </Paper>
          </Grid>
          
          {/* Step 3 */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography 
                  variant="h4" 
                  component="div"
                  sx={{ 
                    display: 'inline-block',
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 40,
                    height: 40,
                    lineHeight: '40px',
                    mb: 2
                  }}
                >
                  3
                </Typography>
              </Box>
              <Typography variant="h5" component="h3" align="center" gutterBottom>
                Get Viral Clips
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center">
                Download ready-to-share vertical clips with catchy captions, 
                perfectly formatted for TikTok, Reels, and Shorts.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      {/* Features List */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h3" 
                component="h2" 
                gutterBottom
                sx={{ fontWeight: 'bold' }}
              >
                Why Choose Viral Clipper?
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 4 }}>
                Our AI-powered platform saves you hours of editing time by automatically
                identifying the most engaging moments in your content.
              </Typography>
              
              <List>
                {features.map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {feature.icon}
                    </ListItemIcon>
                    <ListItemText primary={feature.text} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid 
              item 
              xs={12} 
              md={6}
              sx={{ 
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  width: '100%',
                  maxWidth: 500
                }}
              >
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    bgcolor: 'white',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                  <Typography variant="body1">
                    Save hours of manual editing time
                  </Typography>
                </Paper>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    bgcolor: 'white', 
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                  <Typography variant="body1">
                    Increase engagement with emotionally resonant clips
                  </Typography>
                </Paper>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    bgcolor: 'white',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                  <Typography variant="body1">
                    Repurpose long-form content for short-form platforms
                  </Typography>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* CTA Section */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" component="h2" gutterBottom>
            Ready to create viral clips?
          </Typography>
          <Typography variant="h6" component="p" sx={{ mb: 4, opacity: 0.9 }}>
            Join now and transform your content into attention-grabbing clips.
          </Typography>
          
          {currentUser ? (
            <Button
              component={RouterLink}
              to="/dashboard"
              variant="contained"
              size="large"
              sx={{ 
                px: 4, 
                py: 1.5, 
                borderRadius: 2,
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)'
                }
              }}
            >
              Go to Dashboard
            </Button>
          ) : (
            <Button
              component={RouterLink}
              to="/signup"
              variant="contained"
              size="large"
              sx={{ 
                px: 4, 
                py: 1.5, 
                borderRadius: 2,
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)'
                }
              }}
            >
              Get Started For Free
            </Button>
          )}
        </Container>
      </Box>
    </Box>
  );
} 