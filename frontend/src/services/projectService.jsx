import api from './api';

export const projectService = {
  // Get all projects
  getProjects: async () => {
    const response = await api.get('/api/v1/projects/');
    return response.data;
  },

  // Get project by ID
  getProject: async (projectId) => {
    const response = await api.get(`/api/v1/projects/${projectId}`);
    return response.data;
  },

  // Create new project
  createProject: async (projectData) => {
    const response = await api.post('/api/v1/projects/', projectData);
    return response.data;
  },

  // Update project
  updateProject: async (projectId, projectData) => {
    const response = await api.put(`/api/v1/projects/${projectId}`, projectData);
    return response.data;
  },

  // Delete project
  deleteProject: async (projectId) => {
    const response = await api.delete(`/api/v1/projects/${projectId}`);
    return response.data;
  },

  // Get project clips
  getProjectClips: async (projectId) => {
    const response = await api.get(`/api/v1/projects/${projectId}/clips`);
    return response.data;
  },

  // Update project clip sequence
  updateClipSequence: async (projectId, clipSequence) => {
    const response = await api.put(`/api/v1/projects/${projectId}/sequence`, {
      clip_sequence: clipSequence
    });
    return response.data;
  }
};