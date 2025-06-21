import React, { useState, useEffect } from 'react';

const ProjectManager = ({ project, onProjectSave, isNewProject }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    settings: {
      default_api: 'minimax',
      video_quality: 'high',
      frame_rate: 30,
      resolution: '1920x1080'
    }
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        settings: {
          default_api: project.settings?.default_api || 'minimax',
          video_quality: project.settings?.video_quality || 'high',
          frame_rate: project.settings?.frame_rate || 30,
          resolution: project.settings?.resolution || '1920x1080'
        }
      });
    }
  }, [project]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSettingChange = (setting, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onProjectSave(formData);
    } catch (err) {
      setError('Failed to save project');
      console.error('Error saving project:', err);
    } finally {
      setSaving(false);
    }
  };

  const apiOptions = [
    { value: 'minimax', label: 'MiniMax' },
    { value: 'segmind', label: 'Segmind' }
  ];

  const qualityOptions = [
    { value: 'low', label: 'Low (720p)' },
    { value: 'medium', label: 'Medium (1080p)' },
    { value: 'high', label: 'High (1440p)' },
    { value: 'ultra', label: 'Ultra (4K)' }
  ];

  const resolutionOptions = [
    { value: '1280x720', label: '720p (1280x720)' },
    { value: '1920x1080', label: '1080p (1920x1080)' },
    { value: '2560x1440', label: '1440p (2560x1440)' },
    { value: '3840x2160', label: '4K (3840x2160)' }
  ];

  const frameRateOptions = [
    { value: 24, label: '24 FPS (Cinema)' },
    { value: 30, label: '30 FPS (Standard)' },
    { value: 60, label: '60 FPS (Smooth)' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {isNewProject ? 'Create Project' : 'Project Settings'}
        </h2>
        {!isNewProject && project && (
          <div className="text-sm text-gray-500">
            ID: {project.id}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project name"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project description"
              />
            </div>
          </div>
        </div>

        {/* Project Settings */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Project Settings</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="default_api" className="block text-sm font-medium text-gray-700 mb-1">
                Default API Provider
              </label>
              <select
                id="default_api"
                value={formData.settings.default_api}
                onChange={(e) => handleSettingChange('default_api', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {apiOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 mb-1">
                Video Resolution
              </label>
              <select
                id="resolution"
                value={formData.settings.resolution}
                onChange={(e) => handleSettingChange('resolution', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {resolutionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="frame_rate" className="block text-sm font-medium text-gray-700 mb-1">
                Frame Rate
              </label>
              <select
                id="frame_rate"
                value={formData.settings.frame_rate}
                onChange={(e) => handleSettingChange('frame_rate', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {frameRateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="video_quality" className="block text-sm font-medium text-gray-700 mb-1">
                Video Quality
              </label>
              <select
                id="video_quality"
                value={formData.settings.video_quality}
                onChange={(e) => handleSettingChange('video_quality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {qualityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving && (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            <span>{saving ? 'Saving...' : (isNewProject ? 'Create Project' : 'Save Changes')}</span>
          </button>
        </div>
      </form>

      {/* Project Info */}
      {project && !isNewProject && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-md font-medium text-gray-900 mb-3">Project Information</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated:</span>
              <span>{new Date(project.updated_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="capitalize">{project.status || 'active'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;