import axios from 'axios';
import { Project, Character, VideoClip, ExportJob } from '../context/AppContext';

// API Configuration - Updated to use port 6751
const API_BASE_URL = 'http://localhost:6751/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Project Service
export const projectService = {
  getProjects: () => api.get<{ projects: Project[] }>('/projects/'),
  getProject: (id: string) => api.get<Project>(`/projects/${id}`),
  createProject: (data: { name: string; description?: string }) => 
    api.post<Project>('/projects/', data),
  updateProject: (id: string, data: Partial<Project>) => 
    api.put<Project>(`/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/projects/${id}`),
  updateSequence: (id: string, sequence: string[]) => 
    api.put<Project>(`/projects/${id}/sequence`, { sequence_order: sequence }),
};

// Character Service
export const characterService = {
  getCharacters: (projectId: string) => 
    api.get<Character[]>(`/projects/${projectId}/characters/`),
  getCharacter: (projectId: string, characterId: string) => 
    api.get<Character>(`/projects/${projectId}/characters/${characterId}`),
  createCharacter: (projectId: string, data: FormData) => 
    api.post<Character>(`/projects/${projectId}/characters/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  updateCharacter: (projectId: string, characterId: string, data: FormData) => 
    api.put<Character>(`/projects/${projectId}/characters/${characterId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deleteCharacter: (projectId: string, characterId: string) => 
    api.delete(`/projects/${projectId}/characters/${characterId}`),
};

// Clip Service
export const clipService = {
  getClips: (projectId: string) => 
    api.get<VideoClip[]>(`/projects/${projectId}/clips/`),
  getClip: (projectId: string, clipId: string) => 
    api.get<VideoClip>(`/projects/${projectId}/clips/${clipId}`),
  createClip: (projectId: string, data: {
    name: string;
    description?: string;
    character_id?: string;
    prompt: string;
    generation_params?: any;
  }) => api.post<VideoClip>(`/projects/${projectId}/clips/`, data),
  updateClip: (projectId: string, clipId: string, data: Partial<VideoClip>) => 
    api.put<VideoClip>(`/projects/${projectId}/clips/${clipId}`, data),
  deleteClip: (projectId: string, clipId: string) => 
    api.delete(`/projects/${projectId}/clips/${clipId}`),
  generateClip: (projectId: string, clipId: string) => 
    api.post(`/projects/${projectId}/clips/${clipId}/generate`),
};

// Processing Service
export const processingService = {
  getStatus: (jobId: string) => api.get(`/processing/status/${jobId}`),
  exportVideo: (projectId: string, settings: any) => 
    api.post<ExportJob>(`/processing/export/${projectId}`, settings),
  getExportJobs: (projectId: string) => 
    api.get<ExportJob[]>(`/processing/export/${projectId}/jobs`),
};

export default api;