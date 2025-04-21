import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';
import VideocamIcon from '@mui/icons-material/Videocam';
import CollectionsIcon from '@mui/icons-material/Collections';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar position="static" color="primary">
      <Container maxWidth="lg">
        <Toolbar>
          <MovieFilterIcon sx={{ display: { xs: 'none', sm: 'flex' }, mr: 1, fontSize: 32 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              fontWeight: 700,
              color: 'white',
              textDecoration: 'none',
              flexGrow: { xs: 1, md: 0 }
            }}
          >
            Viral Clips
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex' }}>
            <Button
              color="inherit"
              component={RouterLink}
              to="/"
              startIcon={!isMobile && <VideocamIcon />}
            >
              {isMobile ? <VideocamIcon /> : 'New Clip'}
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/gallery"
              startIcon={!isMobile && <CollectionsIcon />}
            >
              {isMobile ? <CollectionsIcon /> : 'Gallery'}
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 