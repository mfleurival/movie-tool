import api from './api';

export const clipService = {
  // Get all clips for a project
  getClips: async (projectId) => {
    const response = await api.get(`/api/v1/clips/?project_id=${projectId}`);
    return response.data;
  },

  // Get clip by ID
  getClip: async (clipId) => {
    const response = await api.get(`/api/v1/clips/${clipId}`);
    return response.data;
  },

  // Create new clip
  createClip: async (clipData) => {
    const response = await api.post('/api/v1/clips/', clipData);
    return response.data;
  },

  // Update clip
  updateClip: async (clipId, clipData) => {
    const response = await api.put(`/api/v1/clips/${clipId}`, clipData);
    return response.data;
  },

  // Delete clip
  deleteClip: async (clipId) => {
    const response = await api.delete(`/api/v1/clips/${clipId}`);
    return response.data;
  },

  // Generate video clip using AI
  generateClip: async (clipData) => {
    const response = await api.post('/api/v1/clips/generate', clipData);
    return response.data;
  },

  // Get generation status
  getGenerationStatus: async (jobId) => {
    const response = await api.get(`/api/v1/clips/status/${jobId}`);
    return response.data;
  },

  // Extract frame from video
  extractFrame: async (clipId, timestamp) => {
    const response = await api.post(`/api/v1/clips/${clipId}/extract-frame`, {
      timestamp: timestamp
    });
    return response.data;
  },

  // Upload video file
  uploadVideo: async (projectId, videoFile) => {
    const formData = new FormData();
    formData.append('file', videoFile);
    formData.append('project_id', projectId);
    
    const response = await api.post('/api/v1/clips/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};