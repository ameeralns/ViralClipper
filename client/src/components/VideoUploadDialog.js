import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

export default function VideoUploadDialog({ open, onClose }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!videoUrl) {
      setError('Please enter a valid YouTube URL');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // First, create a record in Firestore
      const docRef = await addDoc(collection(db, 'videos'), {
        sourceUrl: videoUrl,
        title: title || 'Untitled Video',
        userId: currentUser.uid,
        status: 'processing',
        createdAt: serverTimestamp(),
        clips: [],
      });
      
      // Next, call the backend API to process the video
      await axios.post('/api/process', {
        videoUrl,
        userId: currentUser.uid,
        requestId: docRef.id,
        title: title || 'Untitled Video'
      });
      
      // Close the dialog
      onClose();
      
      // Reset form
      setVideoUrl('');
      setTitle('');
      
    } catch (error) {
      console.error('Error uploading video:', error);
      setError('Failed to upload video: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>Upload YouTube Video</DialogTitle>
      
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter a YouTube URL to generate short-form video clips from it.
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            autoFocus
            margin="dense"
            label="YouTube URL"
            type="url"
            fullWidth
            variant="outlined"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            disabled={loading}
            placeholder="https://www.youtube.com/watch?v=..."
            required
          />
          
          <TextField
            margin="dense"
            label="Video Title (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            placeholder="My Awesome Video"
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Processing...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 