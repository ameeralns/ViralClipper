import React from 'react';
import { Typography, Box, Container, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100]
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          {'© '}
          {new Date().getFullYear()}
          {' YouTube to Viral Clips — '}
          <Link color="inherit" href="https://github.com">
            Source Code
          </Link>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 