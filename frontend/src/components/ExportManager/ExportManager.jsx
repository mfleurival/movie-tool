import React, { useState, useEffect } from 'react';
import { exportService } from '../../services/api';

const ExportManager = ({ projectId, clips, onExportComplete }) => {
  const [exportSettings, setExportSettings] = useState({
    format: 'mp4',
    quality: 'high',
    resolution: '1920x1080',
    fps: 30,
    include_audio: true,
    transition_type: 'none',
    transition_duration: 0.5
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const formats = [
    { value: 'mp4', label: 'MP4 (Recommended)', description: 'Best compatibility' },
    { value: 'mov', label: 'MOV', description: 'High quality, larger file' },
    { value: 'avi', label: 'AVI', description: 'Legacy format' },
    { value: 'webm', label: 'WebM', description: 'Web optimized' }
  ];

  const qualities = [
    { value: 'low', label: 'Low (Fast)', description: 'Smaller file, faster export' },
    { value: 'medium', label: 'Medium', description: 'Balanced quality and size' },
    { value: 'high', label: 'High (Recommended)', description: 'Best quality' },
    { value: 'ultra', label: 'Ultra', description: 'Maximum quality, large file' }
  ];

  const resolutions = [
    { value: '1920x1080', label: '1080p (1920x1080)' },
    { value: '1280x720', label: '720p (1280x720)' },
    { value: '3840x2160', label: '4K (3840x2160)' },
    { value: '2560x1440', label: '1440p (2560x1440)' }
  ];

  const frameRates = [
    { value: 24, label: '24 FPS (Cinematic)' },
    { value: 30, label: '30 FPS (Standard)' },
    { value: 60, label: '60 FPS (Smooth)' }
  ];

  const transitionTypes = [
    { value: 'none', label: 'None', description: 'Direct cuts between clips' },
    { value: 'fade', label: 'Fade', description: 'Fade in/out transition' },
    { value: 'dissolve', label: 'Dissolve', description: 'Cross-dissolve transition' },
    { value: 'slide', label: 'Slide', description: 'Sliding transition' }
  ];

  useEffect(() => {
    loadExportHistory();
  }, [projectId]);

  const loadExportHistory = async () => {
    try {
      const history = await exportService.getExportHistory(projectId);
      setExportHistory(history);
    } catch (err) {
      console.error('Failed to load export history:', err);
    }
  };

  const handleSettingChange = (field, value) => {
    setExportSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateExportSettings = () => {
    if (!clips || clips.length === 0) {
      setError('No clips available for export');
      return false;
    }

    const completedClips = clips.filter(clip => clip.status === 'completed' && clip.video_url);
    if (completedClips.length === 0) {
      setError('No completed clips available for export');
      return false;
    }

    if (exportSettings.transition_duration < 0 || exportSettings.transition_duration > 5) {
      setError('Transition duration must be between 0 and 5 seconds');
      return false;
    }

    return true;
  };

  const calculateEstimatedDuration = () => {
    if (!clips) return 0;
    const completedClips = clips.filter(clip => clip.status === 'completed');
    const totalClipDuration = completedClips.reduce((sum, clip) => sum + (clip.duration || 0), 0);
    const transitionDuration = exportSettings.transition_type !== 'none' 
      ? (completedClips.length - 1) * exportSettings.transition_duration 
      : 0;
    return totalClipDuration + transitionDuration;
  };

  const calculateEstimatedFileSize = () => {
    const duration = calculateEstimatedDuration();
    const [width, height] = exportSettings.resolution.split('x').map(Number);
    const pixels = width * height;
    
    // Rough estimation based on quality and resolution
    const qualityMultipliers = { low: 0.5, medium: 1, high: 1.5, ultra: 2.5 };
    const baseSize = (pixels * duration * exportSettings.fps * qualityMultipliers[exportSettings.quality]) / 8000000; // MB
    
    return Math.round(baseSize * 100) / 100;
  };

  const handleExport = async () => {
    if (!validateExportSettings()) return;

    setIsExporting(true);
    setError(null);
    setExportProgress({ 
      status: 'starting', 
      message: 'Preparing export...',
      progress: 0 
    });

    try {
      const completedClips = clips.filter(clip => clip.status === 'completed' && clip.video_url);
      const exportData = {
        project_id: projectId,
        clip_ids: completedClips.map(clip => clip.id),
        settings: exportSettings
      };

      // Start export
      const response = await exportService.startExport(exportData);
      const exportId = response.id;

      setExportProgress({ 
        status: 'processing', 
        message: 'Exporting video... This may take several minutes.',
        progress: 0,
        exportId 
      });

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const exportJob = await exportService.getExportStatus(exportId);
          
          if (exportJob.status === 'completed') {
            clearInterval(pollInterval);
            setExportProgress({ 
              status: 'completed', 
              message: 'Export completed successfully!',
              progress: 100,
              exportJob 
            });
            
            // Reload export history
            await loadExportHistory();
            
            if (onExportComplete) {
              onExportComplete(exportJob);
            }
            
            setTimeout(() => {
              setIsExporting(false);
              setExportProgress(null);
            }, 3000);
            
          } else if (exportJob.status === 'failed') {
            clearInterval(pollInterval);
            setError(exportJob.error_message || 'Export failed');
            setIsExporting(false);
            setExportProgress(null);
          } else {
            setExportProgress({ 
              status: 'processing', 
              message: `Status: ${exportJob.status}. Progress: ${exportJob.progress || 0}%`,
              progress: exportJob.progress || 0,
              exportId 
            });
          }
        } catch (err) {
          console.error('Error polling export status:', err);
        }
      }, 2000);

      // Cleanup interval after 30 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isExporting) {
          setError('Export timeout. Please check the export status manually.');
          setIsExporting(false);
          setExportProgress(null);
        }
      }, 1800000);

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start export');
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const downloadExport = (exportJob) => {
    if (exportJob.output_url) {
      const url = exportJob.output_url.startsWith('http') 
        ? exportJob.output_url 
        : `http://localhost:8000${exportJob.output_url}`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `export_${exportJob.id}.${exportSettings.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const completedClips = clips?.filter(clip => clip.status === 'completed' && clip.video_url) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Export Video</h2>
        <p className="text-sm text-gray-600">Export your video sequence to a single file</p>
      </div>

      {/* Export Progress */}
      {exportProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            {exportProgress.status === 'processing' && (
              <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {exportProgress.status === 'completed' && (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <div className="flex-1">
              <p className="font-medium text-blue-900">{exportProgress.message}</p>
              {exportProgress.progress > 0 && (
                <div className="mt-2">
                  <div className="bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${exportProgress.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-blue-700 mt-1">{exportProgress.progress}% complete</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
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

      {/* Export Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Export Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Clips:</span>
            <span className="ml-2 font-medium">{clips?.length || 0}</span>
          </div>
          <div>
            <span className="text-gray-600">Ready Clips:</span>
            <span className="ml-2 font-medium">{completedClips.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Duration:</span>
            <span className="ml-2 font-medium">{formatDuration(calculateEstimatedDuration())}</span>
          </div>
          <div>
            <span className="text-gray-600">Est. Size:</span>
            <span className="ml-2 font-medium">{calculateEstimatedFileSize()} MB</span>
          </div>
        </div>
      </div>

      {/* Export Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-medium text-gray-900 mb-4">Export Settings</h3>
        
        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <select
                value={exportSettings.format}
                onChange={(e) => handleSettingChange('format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {formats.map(format => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                {formats.find(f => f.value === exportSettings.format)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality
              </label>
              <select
                value={exportSettings.quality}
                onChange={(e) => handleSettingChange('quality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {qualities.map(quality => (
                  <option key={quality.value} value={quality.value}>
                    {quality.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                {qualities.find(q => q.value === exportSettings.quality)?.description}
              </p>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Advanced Settings</span>
            </button>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution
                </label>
                <select
                  value={exportSettings.resolution}
                  onChange={(e) => handleSettingChange('resolution', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {resolutions.map(resolution => (
                    <option key={resolution.value} value={resolution.value}>
                      {resolution.label}
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
                  onChange={(e) => handleSettingChange('fps', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {frameRates.map(rate => (
                    <option key={rate.value} value={rate.value}>
                      {rate.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transition Type
                </label>
                <select
                  value={exportSettings.transition_type}
                  onChange={(e) => handleSettingChange('transition_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {transitionTypes.map(transition => (
                    <option key={transition.value} value={transition.value}>
                      {transition.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  {transitionTypes.find(t => t.value === exportSettings.transition_type)?.description}
                </p>
              </div>

              {exportSettings.transition_type !== 'none' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transition Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={exportSettings.transition_duration}
                    onChange={(e) => handleSettingChange('transition_duration', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportSettings.include_audio}
                    onChange={(e) => handleSettingChange('include_audio', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Include Audio</span>
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Include audio tracks from video clips in the export
                </p>
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleExport}
              disabled={isExporting || completedClips.length === 0}
              className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 ${
                isExporting || completedClips.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isExporting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export Video</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium text-gray-900 mb-4">Export History</h3>
          <div className="space-y-3">
            {exportHistory.map(exportJob => (
              <div key={exportJob.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      exportJob.status === 'completed' ? 'bg-green-500' :
                      exportJob.status === 'failed' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`} />
                    <span className="font-medium text-gray-900">
                      Export {exportJob.id}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(exportJob.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {exportJob.settings?.format?.toUpperCase()} • {exportJob.settings?.quality} quality
                    {exportJob.file_size && ` • ${formatFileSize(exportJob.file_size)}`}
                  </div>
                </div>
                {exportJob.status === 'completed' && exportJob.output_url && (
                  <button
                    onClick={() => downloadExport(exportJob)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Download
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportManager;