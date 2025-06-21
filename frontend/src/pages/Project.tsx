import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { projectService, characterService, clipService } from '../services/api';

const Project: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'clips'>('overview');

  useEffect(() => {
    if (id) {
      loadProjectData(id);
    }
  }, [id]);

  const loadProjectData = async (projectId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'projects', value: true } });
      
      // Load project details
      const projectResponse = await projectService.getProject(projectId);
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: projectResponse.data });
      
      // Load characters
      const charactersResponse = await characterService.getCharacters(projectId);
      dispatch({ type: 'SET_CHARACTERS', payload: charactersResponse.data });
      
      // Load clips
      const clipsResponse = await clipService.getClips(projectId);
      dispatch({ type: 'SET_CLIPS', payload: clipsResponse.data });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { key: 'projects', value: 'Failed to load project data' } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'projects', value: false } });
    }
  };

  if (!state.currentProject) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📁</div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">Project not found</h3>
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      {/* Project Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {state.currentProject.name}
            </h1>
            <p className="text-gray-600 mb-4">
              {state.currentProject.description || 'No description'}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Created {formatDate(state.currentProject.created_at)}</span>
              <span>•</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                state.currentProject.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {state.currentProject.status}
              </span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/projects/${state.currentProject.id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Edit Project
            </Link>
            <Link
              to={`/projects/${state.currentProject.id}/export`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Export Video
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'characters', label: 'Characters' },
              { key: 'clips', label: 'Video Clips' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="text-blue-600 text-2xl mb-2">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Characters</h3>
                <p className="text-3xl font-bold text-blue-600">{state.characters.length}</p>
                <p className="text-sm text-gray-600">Total characters created</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6">
                <div className="text-green-600 text-2xl mb-2">🎬</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Video Clips</h3>
                <p className="text-3xl font-bold text-green-600">{state.clips.length}</p>
                <p className="text-sm text-gray-600">Total clips generated</p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="text-purple-600 text-2xl mb-2">⏱️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Duration</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {state.clips.reduce((total, clip) => total + (clip.duration || 0), 0).toFixed(1)}s
                </p>
                <p className="text-sm text-gray-600">Total video duration</p>
              </div>
            </div>
          )}

          {/* Characters Tab */}
          {activeTab === 'characters' && (
            <div>
              {state.characters.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">👥</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No characters yet</h3>
                  <p className="text-gray-600 mb-6">Create characters to use in your video clips</p>
                  <Link
                    to={`/projects/${state.currentProject.id}/edit`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Add Characters
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {state.characters.map((character) => (
                    <div key={character.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                        {character.image_path ? (
                          <img
                            src={character.image_path}
                            alt={character.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-gray-400 text-3xl">👤</div>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{character.name}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {character.description || 'No description'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Clips Tab */}
          {activeTab === 'clips' && (
            <div>
              {state.clips.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🎬</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No video clips yet</h3>
                  <p className="text-gray-600 mb-6">Generate video clips using your characters</p>
                  <Link
                    to={`/projects/${state.currentProject.id}/edit`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Generate Clips
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {state.clips.map((clip) => (
                    <div key={clip.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                        {clip.thumbnail_path ? (
                          <img
                            src={clip.thumbnail_path}
                            alt={clip.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-gray-400 text-3xl">🎬</div>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{clip.name}</h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {clip.description || clip.prompt}
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{clip.duration ? `${clip.duration}s` : 'Unknown duration'}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          clip.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : clip.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {clip.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Project;