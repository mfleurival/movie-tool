import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const Sidebar: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const location = useLocation();
  const { currentProject } = state;

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '🏠' },
    { name: 'Projects', href: '/projects', icon: '📁' },
    { name: 'Characters', href: '/characters', icon: '👥' },
    { name: 'Clips', href: '/clips', icon: '🎬' },
    { name: 'Export', href: '/export', icon: '📤' },
  ];

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const handleProjectSelect = (projectId: string) => {
    const project = state.projects.find(p => p.id === projectId);
    if (project) {
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
    }
  };

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen">
      <div className="p-4">
        <nav className="space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        {state.projects.length > 0 && (
          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Projects
            </h3>
            <div className="mt-2 space-y-1">
              {state.projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    currentProject?.id === project.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <div className="truncate">{project.name}</div>
                  {project.description && (
                    <div className="text-xs text-gray-400 truncate">
                      {project.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentProject && (
          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Current Project
            </h3>
            <div className="mt-2 px-3 py-2 bg-gray-700 rounded-md">
              <div className="text-sm font-medium">{currentProject.name}</div>
              {currentProject.description && (
                <div className="text-xs text-gray-400 mt-1">
                  {currentProject.description}
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Clips: {state.clips.length}</span>
                <span>Characters: {state.characters.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;