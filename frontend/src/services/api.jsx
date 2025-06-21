import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Project Service
export const projectService = {
  // Get all projects
  getProjects: () => api.get('/api/v1/projects/'),
  
  // Get project by ID
  getProject: (id) => api.get(`/api/v1/projects/${id}`),
  
  // Create new project
  createProject: (data) => api.post('/api/v1/projects/', data),
  
  // Update project
  updateProject: (id, data) => api.put(`/api/v1/projects/${id}`, data),
  
  // Delete project
  deleteProject: (id) => api.delete(`/api/v1/projects/${id}`),
  
  // Get project clips
  getProjectClips: (id) => api.get(`/api/v1/projects/${id}/clips`),
  
  // Update project sequence
  updateSequence: (id, sequence) => api.put(`/api/v1/projects/${id}/sequence`, { sequence }),
};

// Character Service
export const characterService = {
  // Get all characters for a project
  getCharacters: (projectId) => api.get(`/api/v1/characters/?project_id=${projectId}`),
  
  // Get character by ID
  getCharacter: (id) => api.get(`/api/v1/characters/${id}`),
  
  // Create new character
  createCharacter: (data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description || '');
    formData.append('project_id', data.project_id);
    if (data.image) {
      formData.append('image', data.image);
    }
    
    return api.post('/api/v1/characters/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Update character
  updateCharacter: (id, data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description || '');
    if (data.image) {
      formData.append('image', data.image);
    }
    
    return api.put(`/api/v1/characters/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete character
  deleteCharacter: (id) => api.delete(`/api/v1/characters/${id}`),
};

// Clip Service
export const clipService = {
  // Get all clips for a project
  getClips: (projectId) => api.get(`/api/v1/clips/?project_id=${projectId}`),
  
  // Get clip by ID
  getClip: (id) => api.get(`/api/v1/clips/${id}`),
  
  // Create new clip
  createClip: (projectId, data) => {
    console.log('🔍 API DEBUG - createClip called with:', { projectId, data });
    const payload = { ...data, project_id: projectId };
    console.log('🔍 API DEBUG - createClip payload:', payload);
    console.log('🔍 API DEBUG - createClip endpoint: POST /api/v1/clips/');
    return api.post('/api/v1/clips/', payload);
  },
  
  // Update clip
  updateClip: (id, data) => api.put(`/api/v1/clips/${id}`, data),
  
  // Delete clip
  deleteClip: (id) => api.delete(`/api/v1/clips/${id}`),
  
  // Generate video clip (old two-step approach)
  generateClip: (projectId, clipId) => {
    console.log('🔍 API DEBUG - generateClip called with:', { projectId, clipId });
    console.log('🔍 API DEBUG - generateClip endpoint: POST /api/v1/clips/generate');
    const payload = { project_id: projectId, clip_id: clipId };
    console.log('🔍 API DEBUG - generateClip payload:', payload);
    return api.post('/api/v1/clips/generate', payload);
  },

  // Generate video clip (new single-step approach)
  generateClipDirect: (data) => {
    console.log('🔍 API DEBUG - generateClipDirect called with:', data);
    console.log('🔍 API DEBUG - generateClipDirect endpoint: POST /api/v1/clips/generate');
    return api.post('/api/v1/clips/generate', data);
  },
  
  // Get generation status
  getGenerationStatus: (jobId) => api.get(`/api/v1/clips/status/${jobId}`),
  
  // Extract frame from clip
  extractFrame: (id, timestamp) => api.post(`/api/v1/clips/${id}/extract-frame`, { timestamp }),
};

// Export Service
export const exportService = {
  // Start export job
  startExport: (projectId, settings) => api.post('/api/v1/processing/export', {
    project_id: projectId,
    ...settings
  }),
  
  // Get export status
  getExportStatus: (jobId) => api.get(`/api/v1/processing/export/${jobId}/status`),
  
  // Download exported video
  downloadExport: (jobId) => api.get(`/api/v1/processing/export/${jobId}/download`, {
    responseType: 'blob'
  }),
  
  // Cancel export job
  cancelExport: (jobId) => api.delete(`/api/v1/processing/export/${jobId}`),
};

// Processing Service
export const processingService = {
  // Merge clips
  mergeClips: (projectId, settings) => api.post('/api/v1/processing/merge', {
    project_id: projectId,
    ...settings
  }),
  
  // Get processing status
  getProcessingStatus: (jobId) => api.get(`/api/v1/processing/status/${jobId}`),
  
  // Cancel processing job
  cancelProcessing: (jobId) => api.delete(`/api/v1/processing/${jobId}`),
};

export default api;