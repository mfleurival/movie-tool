import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectService, characterService, clipService } from '../services/api';
import CharacterManager from '../components/CharacterManager/CharacterManager';
import VideoSequencer from '../components/VideoSequencer/VideoSequencer';
import VideoGenerator from '../components/VideoGenerator/VideoGenerator';
import VideoPlayer from '../components/VideoPlayer/VideoPlayer';

const Project = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('sequencer');
  const [selectedClip, setSelectedClip] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const tabs = [
    { id: 'sequencer', name: 'Video Sequencer', icon: 'film' },
    { id: 'characters', name: 'Characters', icon: 'users' },
    { id: 'generator', name: 'Generate Clips', icon: 'plus-circle' },
    { id: 'player', name: 'Preview', icon: 'play' }
  ];

  const loadProjectData = useCallback(async () => {
    // Validate projectId before making API calls
    if (!projectId || projectId === 'undefined' || projectId === 'null') {
      setError('Invalid project ID. Redirecting to dashboard...');
      setLoading(false);
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load project details
      const projectData = await projectService.getProject(projectId);
      setProject(projectData);

      // Load characters
      const charactersData = await characterService.getCharacters(projectId);
      setCharacters(Array.isArray(charactersData) ? charactersData : []);

      // Load clips
      const clipsData = await clipService.getClips(projectId);
      setClips(Array.isArray(clipsData) ? clipsData : []);

    } catch (err) {
      setError('Failed to load project data');
      
      // If project not found, redirect to dashboard
      if (err.response?.status === 404) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId, refreshTrigger, loadProjectData]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCharacterAdded = useCallback((newCharacter) => {
    setCharacters(prev => [...prev, newCharacter]);
  }, []);

  const handleCharacterDeleted = useCallback((characterId) => {
    setCharacters(prev => prev.filter(c => c.id !== characterId));
  }, []);

  const handleClipGenerated = useCallback((newClip) => {
    console.log('🔍 DEBUG: handleClipGenerated called with:', newClip);
    setClips(prev => [...prev, newClip]);
  }, []);

  const handleClipDeleted = useCallback((clipId) => {
    setClips(prev => prev.filter(c => c.id !== clipId));
    if (selectedClip?.id === clipId) {
      setSelectedClip(null);
    }
  }, [selectedClip?.id]);

  const handleClipUpdated = useCallback((updatedClip) => {
    setClips(prev => prev.map(c => c.id === updatedClip.id ? updatedClip : c));
    if (selectedClip?.id === updatedClip.id) {
      setSelectedClip(updatedClip);
    }
  }, [selectedClip?.id]);

  const handleClipSelected = useCallback((clip) => {
    setSelectedClip(clip);
    setActiveTab('player');
  }, []);

  const handleSequenceUpdated = useCallback((updatedClips) => {
    setClips(updatedClips);
  }, []);

  const getTabIcon = (iconName) => {
    const icons = {
      film: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3zM9 12l2 2 4-4" />
      ),
      users: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      ),
      'plus-circle': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
      play: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15" />
      )
    };
    return icons[iconName] || icons.film;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 animate-spin text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Project</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link
              to="/"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-gray-400 hover:text-gray-600"
                title="Back to Dashboard"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
                {project?.description && (
                  <p className="text-gray-600 text-sm">{project.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Project Stats */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-blue-600">{Array.isArray(clips) ? clips.length : 0}</div>
                  <div className="text-gray-600">Clips</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600">
                    {Array.isArray(clips) ? clips.filter(c => c.status === 'completed').length : 0}
                  </div>
                  <div className="text-gray-600">Ready</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-purple-600">{Array.isArray(characters) ? characters.length : 0}</div>
                  <div className="text-gray-600">Characters</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={handleRefresh}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Refresh"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <Link
                  to={`/project/${projectId}/export`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-t border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {getTabIcon(tab.icon)}
                  </svg>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'sequencer' && (
          <VideoSequencer
            projectId={projectId}
            clips={clips}
            onClipSelected={handleClipSelected}
            onClipDeleted={handleClipDeleted}
            onClipUpdated={handleClipUpdated}
            onSequenceUpdated={handleSequenceUpdated}
          />
        )}

        {activeTab === 'characters' && (
          <CharacterManager
            projectId={projectId}
            characters={characters}
            onCharacterAdded={handleCharacterAdded}
            onCharacterDeleted={handleCharacterDeleted}
          />
        )}

        {activeTab === 'generator' && (
          <VideoGenerator
            projectId={projectId}
            characters={characters}
            clips={clips}
            onClipGenerated={handleClipGenerated}
          />
        )}

        {activeTab === 'player' && (
          <VideoPlayer
            clips={clips}
            selectedClip={selectedClip}
            onClipSelected={setSelectedClip}
          />
        )}
      </div>
    </div>
  );
};

export default Project;