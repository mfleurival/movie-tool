import api from './api';

export const characterService = {
  // Get all characters for a project
  getCharacters: async (projectId) => {
    const response = await api.get(`/api/v1/characters/?project_id=${projectId}`);
    return response.data;
  },

  // Get character by ID
  getCharacter: async (characterId) => {
    const response = await api.get(`/api/v1/characters/${characterId}`);
    return response.data;
  },

  // Create new character
  createCharacter: async (characterData) => {
    const response = await api.post('/api/v1/characters/', characterData);
    return response.data;
  },

  // Update character
  updateCharacter: async (characterId, characterData) => {
    const response = await api.put(`/api/v1/characters/${characterId}`, characterData);
    return response.data;
  },

  // Delete character
  deleteCharacter: async (characterId) => {
    const response = await api.delete(`/api/v1/characters/${characterId}`);
    return response.data;
  },

  // Upload character image
  uploadCharacterImage: async (characterId, imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const response = await api.post(`/api/v1/characters/${characterId}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};