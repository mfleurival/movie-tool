import React from 'react';
import { useAppContext } from '../../context/AppContext';

const Header: React.FC = () => {
  const { state } = useAppContext();
  const { currentProject } = state;

  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold">Movie Tool</h1>
            </div>
            {currentProject && (
              <div className="ml-6">
                <span className="text-gray-300 text-sm">Project:</span>
                <span className="ml-2 font-medium">{currentProject.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-6">
            {currentProject && (
              <>
                <div className="text-sm">
                  <span className="text-gray-300">Clips:</span>
                  <span className="ml-1 font-medium">{state.clips.length}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-300">Characters:</span>
                  <span className="ml-1 font-medium">{state.characters.length}</span>
                </div>
              </>
            )}
            
            {state.loading && (
              <div className="flex items-center text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                <span className="text-sm">Loading...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;