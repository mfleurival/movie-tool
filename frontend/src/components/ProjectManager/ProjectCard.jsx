import React from 'react';

const ProjectCard = ({ project, onSelect, onDelete }) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(project.id);
  };

  return (
    <div
      onClick={() => onSelect(project)}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-gray-600 mt-1 text-sm line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all p-1"
          title="Delete project"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 text-sm text-gray-500">
        <div className="flex items-center justify-between">
          <span>Created:</span>
          <span>{new Date(project.created_at).toLocaleDateString()}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Updated:</span>
          <span>{new Date(project.updated_at).toLocaleDateString()}</span>
        </div>
        
        {project.settings && (
          <div className="flex items-center justify-between">
            <span>API:</span>
            <span className="capitalize">{project.settings.api_provider || 'Not set'}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center text-blue-600 text-sm font-medium">
          <span>Open Project</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;