import React, { useState, useRef } from 'react';
import { characterService } from '../../services/api';

const CharacterManager = ({ projectId, characters, onCharactersUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name.split('.')[0]);
        return characterService.uploadCharacter(projectId, formData);
      });

      const uploadedCharacters = await Promise.all(uploadPromises);
      const updatedCharacters = [...characters, ...uploadedCharacters];
      onCharactersUpdate(updatedCharacters);
      setShowUploadModal(false);
    } catch (err) {
      setError('Failed to upload character images');
      console.error('Error uploading characters:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteCharacter = async (characterId) => {
    if (!window.confirm('Are you sure you want to delete this character?')) {
      return;
    }

    try {
      await characterService.deleteCharacter(characterId);
      const updatedCharacters = characters.filter(c => c.id !== characterId);
      onCharactersUpdate(updatedCharacters);
      if (selectedCharacter?.id === characterId) {
        setSelectedCharacter(null);
      }
    } catch (err) {
      setError('Failed to delete character');
      console.error('Error deleting character:', err);
    }
  };

  const handleUpdateCharacter = async (characterId, updates) => {
    try {
      const updatedCharacter = await characterService.updateCharacter(characterId, updates);
      const updatedCharacters = characters.map(c => 
        c.id === characterId ? updatedCharacter : c
      );
      onCharactersUpdate(updatedCharacters);
      if (selectedCharacter?.id === characterId) {
        setSelectedCharacter(updatedCharacter);
      }
    } catch (err) {
      setError('Failed to update character');
      console.error('Error updating character:', err);
    }
  };

  const getImageUrl = (character) => {
    if (character.image_url) {
      return character.image_url.startsWith('http') 
        ? character.image_url 
        : `http://localhost:8000${character.image_url}`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Character Management</h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Character</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Characters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map((character) => (
          <div
            key={character.id}
            className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all ${
              selectedCharacter?.id === character.id ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedCharacter(character)}
          >
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
              {getImageUrl(character) ? (
                <img
                  src={getImageUrl(character)}
                  alt={character.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-gray-100">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-1">{character.name}</h3>
              {character.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{character.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {new Date(character.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCharacter(character.id);
                  }}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {characters.length === 0 && (
          <div className="col-span-full">
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No characters yet</h3>
              <p className="text-gray-600 mb-4">Upload character reference images to get started</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Your First Character
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Character Details Panel */}
      {selectedCharacter && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Character Details</h3>
            <button
              onClick={() => setSelectedCharacter(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {getImageUrl(selectedCharacter) && (
                <img
                  src={getImageUrl(selectedCharacter)}
                  alt={selectedCharacter.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={selectedCharacter.name}
                  onChange={(e) => handleUpdateCharacter(selectedCharacter.id, { name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={selectedCharacter.description || ''}
                  onChange={(e) => handleUpdateCharacter(selectedCharacter.id, { description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe this character..."
                />
              </div>

              <div className="text-sm text-gray-600">
                <p><strong>Created:</strong> {new Date(selectedCharacter.created_at).toLocaleString()}</p>
                <p><strong>File Size:</strong> {selectedCharacter.file_size ? `${Math.round(selectedCharacter.file_size / 1024)} KB` : 'Unknown'}</p>
                <p><strong>Image Type:</strong> {selectedCharacter.image_url?.split('.').pop()?.toUpperCase() || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Character Images</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Images
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Supported formats: JPG, PNG, GIF. You can select multiple files.
                </p>
              </div>

              {uploading && (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-blue-600">Uploading...</span>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterManager;