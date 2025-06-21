import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService, characterService, clipService } from '../services/api';
import { Project, Character, VideoClip } from '../context/AppContext';
import ProjectManager from '../components/ProjectManager/ProjectManager';
import CharacterManager from '../components/CharacterManager/CharacterManager';
import VideoSequencer from '../components/VideoSequencer/VideoSequencer';
import VideoGenerator from '../components/VideoGenerator/VideoGenerator';
import VideoPlayer from '../components/VideoPlayer/VideoPlayer';
import ExportManager from '../components/ExportManager/ExportManager';

const ProjectEditor = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('sequencer');
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);

  useEffect(() => {
    if (projectId && projectId !== 'new') {
      loadProject();
    } else {
      setLoading(false);
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    if (!projectId) return;
    if (!projectId) return;
    if (!projectId) return;
    if (!projectId) return;
    try {
      setLoading(true);
      if (!projectId) return;
      const [projectResponse, charactersResponse, clipsResponse] = await Promise.all([
        projectService.getProject(projectId),
        characterService.getCharacters(projectId),
        clipService.getClips(projectId)
      ]);
      
      setProject(projectResponse.data);
      setCharacters(charactersResponse.data);
      setClips(clipsResponse.data);
    } catch (err) {
      setError('Failed to load project');
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSave = async (projectData: Partial<Project>) => {
    try {
      let savedProject;
      if (projectId === 'new') {
        if (!projectData.name) {
          setError('Project name is required.');
          return;
        }
        const response = await projectService.createProject({
          name: projectData.name,
          description: projectData.description,
        });
        savedProject = response.data;
        navigate(`/project/${savedProject.id}`, { replace: true });
      } else {
        if (!projectId) return;
        const response = await projectService.updateProject(projectId, projectData);
        savedProject = response.data;
      }
      setProject(savedProject);
      return savedProject;
    } catch (err) {
      console.error('Error saving project:', err);
      throw err;
    }
  };

  const handleCharacterUpdate = (updatedCharacters: Character[]) => {
    setCharacters(updatedCharacters);
  };

  const handleClipsUpdate = (updatedClips: VideoClip[]) => {
    setClips(updatedClips);
  };

  const handleClipSelect = (clip: VideoClip) => {
    setSelectedClip(clip);
  };

  const handleExportComplete = (exportData: any) => {
    // Handle export completion
    console.log('Export completed:', exportData);
  };

  const tabs = [
    { id: 'sequencer', name: 'Sequencer', icon: 'film' },
    { id: 'characters', name: 'Characters', icon: 'users' },
    { id: 'generator', name: 'Generator', icon: 'plus-circle' },
    { id: 'export', name: 'Export', icon: 'download' }
  ];

  const getTabIcon = (iconName: string) => {
    const icons: { [key: string]: JSX.Element } = {
      film: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3zM9 12l2 2 4-4" />
        </svg>
      ),
      users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      'plus-circle': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      download: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    };
    return icons[iconName] || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {project?.name || 'New Project'}
                </h1>
                {project?.description && (
                  <p className="text-sm text-gray-600">{project.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {project && (
                <div className="text-sm text-gray-600">
                  {clips.length} clips • {characters.length} characters
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {getTabIcon(tab.icon)}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Panel */}
          <div className="lg:col-span-2">
            {activeTab === 'sequencer' && (
              <VideoSequencer
                clips={clips}
                onClipsReorder={handleClipsUpdate}
                onClipSelect={handleClipSelect}
                selectedClip={selectedClip}
                onClipDelete={() => {}}
              />
            )}

            {activeTab === 'characters' && (
              <CharacterManager
                projectId={project?.id}
                characters={characters}
                onCharactersUpdate={handleCharacterUpdate}
              />
            )}

            {activeTab === 'generator' && (
              <VideoGenerator
                projectId={project?.id}
                characters={characters}
                onClipGenerated={(newClip: VideoClip) => setClips([...clips, newClip])}
              />
            )}

            {activeTab === 'export' && (
              <ExportManager
                projectId={project?.id}
                clips={clips}
                onExportComplete={handleExportComplete}
              />
            )}
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Project Manager */}
            {(projectId === 'new' || activeTab === 'sequencer') && (
              <ProjectManager
                project={project}
                onProjectSave={handleProjectSave}
                isNewProject={projectId === 'new'}
              />
            )}

            {/* Video Player */}
            {selectedClip && activeTab === 'sequencer' && (
              <VideoPlayer
                clip={selectedClip}
                clips={clips}
                onClipChange={handleClipSelect}
              />
            )}

            {/* Quick Stats */}
            {project && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Project Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Clips</span>
                    <span className="font-medium">{clips.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-medium text-green-600">
                      {clips.filter(c => c.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing</span>
                    <span className="font-medium text-yellow-600">
                      {clips.filter(c => c.status === 'processing').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Failed</span>
                    <span className="font-medium text-red-600">
                      {clips.filter(c => c.status === 'failed').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Characters</span>
                    <span className="font-medium">{characters.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Duration</span>
                    <span className="font-medium">
                      {Math.round(clips.reduce((total, clip) => total + (clip.duration || 0), 0))}s
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectEditor;