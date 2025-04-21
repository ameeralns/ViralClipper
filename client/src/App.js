import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import VideoDetails from './pages/VideoDetails';
import Gallery from './pages/Gallery';

function App() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Header />
      
      <Container 
        component="main" 
        sx={{ 
          mt: 4, 
          mb: 4,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/video/:requestId" element={<VideoDetails />} />
          <Route path="/gallery" element={<Gallery />} />
        </Routes>
      </Container>
      
      <Footer />
    </Box>
  );
}

export default App; 