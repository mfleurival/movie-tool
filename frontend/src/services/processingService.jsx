import api from './api';

export const processingService = {
  // Export final video
  exportVideo: async (projectId, exportSettings) => {
    const response = await api.post('/api/v1/processing/export', {
      project_id: projectId,
      ...exportSettings
    });
    return response.data;
  },

  // Get export status
  getExportStatus: async (jobId) => {
    const response = await api.get(`/api/v1/processing/export/status/${jobId}`);
    return response.data;
  },

  // Merge clips into final video
  mergeClips: async (projectId, clipIds, outputSettings) => {
    const response = await api.post('/api/v1/processing/merge', {
      project_id: projectId,
      clip_ids: clipIds,
      ...outputSettings
    });
    return response.data;
  },

  // Get merge status
  getMergeStatus: async (jobId) => {
    const response = await api.get(`/api/v1/processing/merge/status/${jobId}`);
    return response.data;
  },

  // Preview sequence
  previewSequence: async (projectId, clipIds) => {
    const response = await api.post('/api/v1/processing/preview', {
      project_id: projectId,
      clip_ids: clipIds
    });
    return response.data;
  },

  // Get processing jobs for a project
  getProcessingJobs: async (projectId) => {
    const response = await api.get(`/api/v1/processing/jobs?project_id=${projectId}`);
    return response.data;
  },

  // Cancel processing job
  cancelJob: async (jobId) => {
    const response = await api.delete(`/api/v1/processing/jobs/${jobId}`);
    return response.data;
  }
};