import React, { useState } from 'react';
import { clipService } from '../../services/api';
import api from '../../services/api';

// Types
interface Character {
  id: string;
  name: string;
  voice_id: string;
  image_url?: string;
}

interface VideoClip {
  id: string;
  text?: string;
  character_id?: string;
  project_id: string;
  sequence?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'generating';
  audio_url?: string;
  video_url?: string;
  image_url?: string;
  created_at?: string;
  name?: string;
  description?: string;
  prompt?: string;
}

// Updated props interface to match what Project.jsx passes
interface VideoGeneratorProps {
  projectId: string;
  characters: Character[];
  clips: VideoClip[];
  onClipGenerated?: (clip: VideoClip) => void;
}

interface FormData {
  name: string;
  description: string;
  character_id: string;
  prompt: string;
  provider: string;
  duration: number;
  resolution: string;
}

interface FormErrors {
  name?: string;
  prompt?: string;
  general?: string;
}

interface LoadingState {
  creating: boolean;
  generating: boolean;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  projectId,
  characters,
  clips,
  onClipGenerated
}) => {

  // Form state with proper typing
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    character_id: '',
    prompt: '',
    provider: 'minimax',
    duration: 5,
    resolution: '16:9'
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [localLoading, setLocalLoading] = useState<LoadingState>({
    creating: false,
    generating: false
  });
  const [localError, setLocalError] = useState<string | null>(null);

  // Form validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Clip name is required';
    }

    if (!formData.prompt.trim()) {
      errors.prompt = 'Prompt is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes with proper typing
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) || 5 : value
    }));

    // Clear field-specific error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle form submission with proper error handling
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLocalLoading(prev => ({ ...prev, creating: true }));
      setLocalError(null);
      setFormErrors({});

      // Prepare data for the single-step API endpoint
      const generateRequest = {
        project_id: projectId,
        title: formData.name,
        description: formData.description,
        character_id: formData.character_id || undefined,
        prompt: formData.prompt,
        provider: formData.provider,
        model_type: 't2v', // Required field: text-to-video generation
        duration: formData.duration,
        resolution: formData.resolution
      };

      console.log('🔍 VideoGenerator Debug - Creating and generating clip with data:', generateRequest);
      console.log('🔍 VideoGenerator Debug - API endpoint will be called: POST /api/v1/clips/generate');
      
      // Use the working endpoint that creates and starts generation in one step
      const response = await api.post('/api/v1/clips/generate', generateRequest);
      const newClip: VideoClip = response.data || response;

      console.log('✅ VideoGenerator Debug - Clip created and generation started:', newClip);

      // Call callback if provided
      if (onClipGenerated) {
        onClipGenerated(newClip);
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        character_id: '',
        prompt: '',
        provider: 'minimax',
        duration: 5,
        resolution: '16:9'
      });

      console.log('✅ VideoGenerator Debug - Form reset, process complete');

    } catch (error: any) {
      console.error('❌ VideoGenerator Debug - Error creating clip:', error);
      
      if (error.response?.data?.detail) {
        setLocalError(error.response.data.detail);
      } else if (error.response?.status === 400) {
        setFormErrors({ general: 'Invalid input data. Please check your form.' });
      } else if (error.response?.status === 404) {
        setLocalError('Project or character not found.');
      } else {
        setLocalError('Failed to create video clip. Please try again.');
      }
    } finally {
      setLocalLoading({ creating: false, generating: false });
    }
  };

  // Check if form is submitting
  const isSubmitting = localLoading.creating || localLoading.generating;

  // Check if characters are available and ensure it's an array
  const hasCharacters = Array.isArray(characters) && characters.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Generate Video Clip</h2>
      
      {/* Error Display */}
      {localError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{localError}</p>
        </div>
      )}

      {/* General Form Error */}
      {formErrors.general && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{formErrors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Clip Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Clip Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formErrors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter clip name"
            disabled={isSubmitting}
          />
          {formErrors.name && (
            <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter clip description"
            disabled={isSubmitting}
          />
        </div>

        {/* Character Selection */}
        <div>
          <label htmlFor="character_id" className="block text-sm font-medium text-gray-700 mb-2">
            Character (Optional)
          </label>
          <select
            id="character_id"
            name="character_id"
            value={formData.character_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="">No character (text-only generation)</option>
            {Array.isArray(characters) && characters.map((character: Character) => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>
        </div>

        {/* Provider Selection */}
        <div>
          <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
            Video Provider
          </label>
          <select
            id="provider"
            name="provider"
            value={formData.provider}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="minimax">MiniMax (Text-to-Video)</option>
            <option value="segmind">Segmind (Image-to-Video)</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            <strong>MiniMax:</strong> Creates videos from text descriptions only.<br/>
            <strong>Segmind:</strong> Animates static images (requires character with image).
          </p>
        </div>

        {/* Prompt */}
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Video Prompt *
          </label>
          <textarea
            id="prompt"
            name="prompt"
            value={formData.prompt}
            onChange={handleInputChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formErrors.prompt ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Describe the video you want to generate..."
            disabled={isSubmitting}
          />
          {formErrors.prompt && (
            <p className="mt-1 text-sm text-red-600">{formErrors.prompt}</p>
          )}
        </div>

        {/* Generation Parameters */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Generation Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duration (seconds)
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
                max="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>

            {/* Resolution/Aspect Ratio */}
            <div>
              <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 mb-2">
                Resolution
              </label>
              <select
                id="resolution"
                name="resolution"
                value={formData.resolution}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="16:9">16:9 (Widescreen)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:3">4:3 (Standard)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            } text-white`}
          >
            {localLoading.creating && 'Creating Clip...'}
            {localLoading.generating && 'Starting Generation...'}
            {!isSubmitting && 'Generate Video'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VideoGenerator;