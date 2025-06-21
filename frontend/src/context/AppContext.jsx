import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  // Current project
  currentProject: null,
  
  // Projects list
  projects: [],
  
  // Characters for current project
  characters: [],
  
  // Clips for current project
  clips: [],
  
  // Current sequence of clip IDs
  clipSequence: [],
  
  // Loading states
  loading: {
    projects: false,
    characters: false,
    clips: false,
    generation: false,
    export: false
  },
  
  // Error states
  errors: {
    projects: null,
    characters: null,
    clips: null,
    generation: null,
    export: null
  },
  
  // Generation jobs
  generationJobs: [],
  
  // Export jobs
  exportJobs: [],
  
  // UI state
  ui: {
    selectedClip: null,
    showCharacterManager: false,
    showVideoGenerator: false,
    showExportManager: false,
    draggedClip: null
  }
};

// Action types
export const ActionTypes = {
  // Project actions
  SET_CURRENT_PROJECT: 'SET_CURRENT_PROJECT',
  SET_PROJECTS: 'SET_PROJECTS',
  ADD_PROJECT: 'ADD_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  
  // Character actions
  SET_CHARACTERS: 'SET_CHARACTERS',
  ADD_CHARACTER: 'ADD_CHARACTER',
  UPDATE_CHARACTER: 'UPDATE_CHARACTER',
  DELETE_CHARACTER: 'DELETE_CHARACTER',
  
  // Clip actions
  SET_CLIPS: 'SET_CLIPS',
  ADD_CLIP: 'ADD_CLIP',
  UPDATE_CLIP: 'UPDATE_CLIP',
  DELETE_CLIP: 'DELETE_CLIP',
  SET_CLIP_SEQUENCE: 'SET_CLIP_SEQUENCE',
  
  // Loading actions
  SET_LOADING: 'SET_LOADING',
  
  // Error actions
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Job actions
  ADD_GENERATION_JOB: 'ADD_GENERATION_JOB',
  UPDATE_GENERATION_JOB: 'UPDATE_GENERATION_JOB',
  REMOVE_GENERATION_JOB: 'REMOVE_GENERATION_JOB',
  ADD_EXPORT_JOB: 'ADD_EXPORT_JOB',
  UPDATE_EXPORT_JOB: 'UPDATE_EXPORT_JOB',
  REMOVE_EXPORT_JOB: 'REMOVE_EXPORT_JOB',
  
  // UI actions
  SET_SELECTED_CLIP: 'SET_SELECTED_CLIP',
  SET_UI_STATE: 'SET_UI_STATE',
  SET_DRAGGED_CLIP: 'SET_DRAGGED_CLIP'
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_CURRENT_PROJECT:
      return {
        ...state,
        currentProject: action.payload
      };
      
    case ActionTypes.SET_PROJECTS:
      return {
        ...state,
        projects: action.payload
      };
      
    case ActionTypes.ADD_PROJECT:
      return {
        ...state,
        projects: [...state.projects, action.payload]
      };
      
    case ActionTypes.UPDATE_PROJECT:
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        ),
        currentProject: state.currentProject?.id === action.payload.id 
          ? action.payload 
          : state.currentProject
      };
      
    case ActionTypes.DELETE_PROJECT:
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        currentProject: state.currentProject?.id === action.payload ? null : state.currentProject
      };
      
    case ActionTypes.SET_CHARACTERS:
      return {
        ...state,
        characters: action.payload
      };
      
    case ActionTypes.ADD_CHARACTER:
      return {
        ...state,
        characters: [...state.characters, action.payload]
      };
      
    case ActionTypes.UPDATE_CHARACTER:
      return {
        ...state,
        characters: state.characters.map(character =>
          character.id === action.payload.id ? action.payload : character
        )
      };
      
    case ActionTypes.DELETE_CHARACTER:
      return {
        ...state,
        characters: state.characters.filter(character => character.id !== action.payload)
      };
      
    case ActionTypes.SET_CLIPS:
      return {
        ...state,
        clips: action.payload
      };
      
    case ActionTypes.ADD_CLIP:
      return {
        ...state,
        clips: [...state.clips, action.payload]
      };
      
    case ActionTypes.UPDATE_CLIP:
      return {
        ...state,
        clips: state.clips.map(clip =>
          clip.id === action.payload.id ? action.payload : clip
        )
      };
      
    case ActionTypes.DELETE_CLIP:
      return {
        ...state,
        clips: state.clips.filter(clip => clip.id !== action.payload),
        clipSequence: state.clipSequence.filter(id => id !== action.payload)
      };
      
    case ActionTypes.SET_CLIP_SEQUENCE:
      return {
        ...state,
        clipSequence: action.payload
      };
      
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value
        }
      };
      
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.value
        }
      };
      
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload]: null
        }
      };
      
    case ActionTypes.ADD_GENERATION_JOB:
      return {
        ...state,
        generationJobs: [...state.generationJobs, action.payload]
      };
      
    case ActionTypes.UPDATE_GENERATION_JOB:
      return {
        ...state,
        generationJobs: state.generationJobs.map(job =>
          job.id === action.payload.id ? action.payload : job
        )
      };
      
    case ActionTypes.REMOVE_GENERATION_JOB:
      return {
        ...state,
        generationJobs: state.generationJobs.filter(job => job.id !== action.payload)
      };
      
    case ActionTypes.ADD_EXPORT_JOB:
      return {
        ...state,
        exportJobs: [...state.exportJobs, action.payload]
      };
      
    case ActionTypes.UPDATE_EXPORT_JOB:
      return {
        ...state,
        exportJobs: state.exportJobs.map(job =>
          job.id === action.payload.id ? action.payload : job
        )
      };
      
    case ActionTypes.REMOVE_EXPORT_JOB:
      return {
        ...state,
        exportJobs: state.exportJobs.filter(job => job.id !== action.payload)
      };
      
    case ActionTypes.SET_SELECTED_CLIP:
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedClip: action.payload
        }
      };
      
    case ActionTypes.SET_UI_STATE:
      return {
        ...state,
        ui: {
          ...state.ui,
          ...action.payload
        }
      };
      
    case ActionTypes.SET_DRAGGED_CLIP:
      return {
        ...state,
        ui: {
          ...state.ui,
          draggedClip: action.payload
        }
      };
      
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Context provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load initial data
  useEffect(() => {
    // Load projects on app start
    // This will be implemented in the components that use this context
  }, []);

  const value = {
    state,
    dispatch
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;