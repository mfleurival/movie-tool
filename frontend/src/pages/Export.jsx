import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectService, clipService, exportService } from '../services/api';

const Export = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [clips, setClips] = useState([]);
  const [exportJobs, setExportJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    format: 'mp4',
    quality: 'high',
    resolution: '1920x1080',
    fps: 30,
    include_audio: true
  });

  const formatOptions = [
    { value: 'mp4', label: 'MP4 (Recommended)' },
    { value: 'mov', label: 'MOV (QuickTime)' },
    { value: 'avi', label: 'AVI' }
  ];

  const qualityOptions = [
    { value: 'high', label: 'High Quality' },
    { value: 'medium', label: 'Medium Quality' },
    { value: 'low', label: 'Low Quality (Faster)' }
  ];

  const resolutionOptions = [
    { value: '1920x1080', label: '1080p (1920x1080)' },
    { value: '1280x720', label: '720p (1280x720)' },
    { value: '854x480', label: '480p (854x480)' }
  ];

  const fpsOptions = [
    { value: 60, label: '60 FPS' },
    { value: 30, label: '30 FPS' },
    { value: 24, label: '24 FPS (Cinematic)' }
  ];

  const loadExportJobs = useCallback(async () => {
    try {
      const jobs = await exportService.getExportJobs(projectId);
      setExportJobs(jobs);
    } catch (err) {
      console.error('Error loading export jobs:', err);
    }
  }, [projectId]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load project details
      const projectData = await projectService.getProject(projectId);
      setProject(projectData);

      // Load clips
      const clipsData = await clipService.getClips(projectId);
      setClips(clipsData);

      // Load export jobs
      await loadExportJobs();

    } catch (err) {
      setError('Failed to load project data');
      console.error('Error loading data:', err);
      
      if (err.response?.status === 404) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate, loadExportJobs]);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId, loadData]);

  useEffect(() => {
    // Poll for export job updates
    const interval = setInterval(() => {
      if (exportJobs.some(job => job.status === 'processing')) {
        loadExportJobs();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [exportJobs, loadExportJobs]);

  const handleExport = async () => {
    const completedClips = clips.filter(clip => clip.status === 'completed');
    
    if (completedClips.length === 0) {
      setError('No completed clips available for export');
      return;
    }

    try {
      setExporting(true);
      setError(null);

      const exportData = {
        ...exportSettings,
        clip_ids: completedClips
          .sort((a, b) => a.sequence_order - b.sequence_order)
          .map(clip => clip.id)
      };

      const exportJob = await exportService.createExport(projectId, exportData);
      setExportJobs(prev => [exportJob, ...prev]);

    } catch (err) {
      setError('Failed to start export');
      console.error('Error starting export:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async (jobId, filename) => {
    try {
      const blob = await exportService.downloadExport(jobId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download export');
      console.error('Error downloading export:', err);
    }
  };

  const handleDeleteExport = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this export?')) {
      return;
    }

    try {
      await exportService.deleteExport(jobId);
      setExportJobs(prev => prev.filter(job => job.id !== jobId));
    } catch (err) {
      setError('Failed to delete export');
      console.error('Error deleting export:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        );
      case 'processing':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        );
      case 'failed':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        );
      default:
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        );
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 animate-spin text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p className="mt-4 text-gray-600">Loading export settings...</p>
        </div>
      </div>
    );
  }

  const completedClips = clips.filter(clip => clip.status === 'completed');
  const totalDuration = completedClips.reduce((sum, clip) => sum + (clip.duration || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                to={`/project/${projectId}`}
                className="text-gray-400 hover:text-gray-600"
                title="Back to Project"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Export Project</h1>
                <p className="text-gray-600 text-sm">{project?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800 text-sm mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Export Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Export Settings</h2>

            {/* Project Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Project Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Clips:</span>
                  <span className="ml-2 font-medium">{clips.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ready Clips:</span>
                  <span className="ml-2 font-medium text-green-600">{completedClips.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Duration:</span>
                  <span className="ml-2 font-medium">{formatDuration(totalDuration)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Sequence Order:</span>
                  <span className="ml-2 font-medium">
                    {completedClips.length > 0 ? 'Set' : 'Not Set'}
                  </span>
                </div>
              </div>
            </div>

            {/* Export Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format
                </label>
                <select
                  value={exportSettings.format}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, format: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {formatOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality
                </label>
                <select
                  value={exportSettings.quality}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, quality: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {qualityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution
                </label>
                <select
                  value={exportSettings.resolution}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, resolution: e.target.value }))}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frame Rate
                </label>
                <select
                  value={exportSettings.fps}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {fpsOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include_audio"
                  checked={exportSettings.include_audio}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, include_audio: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="include_audio" className="ml-2 block text-sm text-gray-900">
                  Include Audio (if available)
                </label>
              </div>
            </div>

            {/* Export Button */}
            <div className="mt-8">
              <button
                onClick={handleExport}
                disabled={exporting || completedClips.length === 0}
                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 ${
                  exporting || completedClips.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {exporting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Starting Export...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Start Export</span>
                  </>
                )}
              </button>
              
              {completedClips.length === 0 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  No completed clips available for export
                </p>
              )}
            </div>
          </div>

          {/* Export History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Export History</h2>

            {exportJobs.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600">No exports yet</p>
                <p className="text-gray-500 text-sm">Your export history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exportJobs.map(job => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                            <svg className={`w-3 h-3 mr-1 ${job.status === 'processing' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {getStatusIcon(job.status)}
                            </svg>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(job.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Format: {job.settings?.format?.toUpperCase() || 'Unknown'}</div>
                          <div>Quality: {job.settings?.quality || 'Unknown'}</div>
                          <div>Resolution: {job.settings?.resolution || 'Unknown'}</div>
                          {job.file_size && (
                            <div>Size: {formatFileSize(job.file_size)}</div>
                          )}
                          {job.duration && (
                            <div>Duration: {formatDuration(job.duration)}</div>
                          )}
                        </div>

                        {job.progress !== undefined && job.status === 'processing' && (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{Math.round(job.progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {job.error_message && (
                          <div className="mt-2 text-sm text-red-600">
                            Error: {job.error_message}
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex space-x-2">
                        {job.status === 'completed' && (
                          <button
                            onClick={() => handleDownload(job.id, job.output_filename)}
                            className="p-2 text-green-600 hover:text-green-800"
                            title="Download"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteExport(job.id)}
                          className="p-2 text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Export;