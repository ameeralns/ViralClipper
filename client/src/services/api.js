import axios from 'axios';

// Use the environment variable REACT_APP_API_URL for the production endpoint
// Fall back to relative path /api for local development
const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : '/api';

const api = {
  // Start video processing with a YouTube URL
  processVideo: async (videoUrl, userId = 'anonymous') => {
    const response = await axios.get(`${API_BASE_URL}/transcribe`, {
      params: { videoUrl, userId }
    });
    return response.data;
  },
  
  // Get details of a processed video
  getVideoDetails: async (requestId) => {
    const response = await axios.get(`${API_BASE_URL}/video/${requestId}`);
    return response.data;
  },
  
  // Get list of all processed videos
  getVideoList: async (userId = null) => {
    const params = {};
    if (userId) {
      params.userId = userId;
    }
    
    const response = await axios.get(`${API_BASE_URL}/reels`, { params });
    return response.data;
  },
  
  // Helper to check server health
  checkHealth: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data.status === 'ok';
    } catch (error) {
      return false;
    }
  }
};

export default api; 