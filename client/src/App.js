import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import VideoDetails from './pages/VideoDetails';
import Gallery from './pages/Gallery';

function App() {
  return (
    <AuthProvider>
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
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/video/:videoId" 
              element={
                <PrivateRoute>
                  <VideoDetails />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/gallery" 
              element={
                <PrivateRoute>
                  <Gallery />
                </PrivateRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Container>
        
        <Footer />
      </Box>
    </AuthProvider>
  );
}

export default App; 