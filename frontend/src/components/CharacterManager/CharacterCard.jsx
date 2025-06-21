import React, { useState } from 'react';

const CharacterCard = ({ character, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(character.name);
  const [editDescription, setEditDescription] = useState(character.description || '');

  const handleSaveEdit = () => {
    if (editName.trim() !== character.name || editDescription !== (character.description || '')) {
      onUpdate(character.id, {
        name: editName.trim(),
        description: editDescription.trim() || null
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(character.name);
    setEditDescription(character.description || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(character.id);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Character Image */}
      <div className="aspect-square bg-gray-100 relative">
        {character.image_url ? (
          <img
            src={character.image_url}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={() => setIsEditing(true)}
            className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 p-1.5 rounded-full shadow-sm transition-all"
            title="Edit character"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button
            onClick={handleDelete}
            className="bg-white bg-opacity-90 hover:bg-opacity-100 text-red-600 p-1.5 rounded-full shadow-sm transition-all"
            title="Delete character"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Character Info */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Character name"
            />
            
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Character description (optional)"
            />
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{character.name}</h3>
            
            {character.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {character.description}
              </p>
            )}
            
            <div className="text-xs text-gray-500 space-y-1">
              <div>Created: {new Date(character.created_at).toLocaleDateString()}</div>
              {character.updated_at !== character.created_at && (
                <div>Updated: {new Date(character.updated_at).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterCard;