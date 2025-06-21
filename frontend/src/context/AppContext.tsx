import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Type definitions
export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  sequence_order: string[];
  status?: 'active' | 'archived' | 'deleted';
  // Optional relationships that may be included in some API responses
  characters?: Character[];
  video_clips?: VideoClip[];
  clips?: VideoClip[]; // Alias for video_clips for backward compatibility
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  project_id: string;
  image_url?: string;
  image_path?: string;
  voice_id?: string;
  created_at: string;
  updated_at: string;
}

export interface VideoClip {
  id: string;
  name: string;
  description?: string;
  project_id: string;
  character_id?: string;
  prompt: string;
  video_url?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'processing';
  thumbnail_path?: string;
  duration?: number;
  generation_params?: any;
  created_at: string;
  updated_at: string;
}

export interface ExportJob {
  id: string;
  project_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  output_url?: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface GenerationJob {
  id: string;
  clip_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error_message?: string;
  created_at: string;
}

interface LoadingState {
  projects: boolean;
  characters: boolean;
  clips: boolean;
  generation: boolean;
  export: boolean;
}

interface ErrorState {
  projects: string | null;
  characters: string | null;
  clips: string | null;
  generation: string | null;
  export: string | null;
}

interface UIState {
  selectedClip: string | null;
  showCharacterManager: boolean;
  showVideoGenerator: boolean;
  showExportManager: boolean;
  draggedClip: string | null;
}

export interface AppState {
  currentProject: Project | null;
  projects: Project[];
  characters: Character[];
  clips: VideoClip[];
  clipSequence: string[];
  loading: LoadingState;
  errors: ErrorState;
  generationJobs: GenerationJob[];
  exportJobs: ExportJob[];
  ui: UIState;
}

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
} as const;

// Action interfaces
export type AppAction = 
  | { type: typeof ActionTypes.SET_CURRENT_PROJECT; payload: Project | null }
  | { type: typeof ActionTypes.SET_PROJECTS; payload: Project[] }
  | { type: typeof ActionTypes.ADD_PROJECT; payload: Project }
  | { type: typeof ActionTypes.UPDATE_PROJECT; payload: Project }
  | { type: typeof ActionTypes.DELETE_PROJECT; payload: string }
  | { type: typeof ActionTypes.SET_CHARACTERS; payload: Character[] }
  | { type: typeof ActionTypes.ADD_CHARACTER; payload: Character }
  | { type: typeof ActionTypes.UPDATE_CHARACTER; payload: Character }
  | { type: typeof ActionTypes.DELETE_CHARACTER; payload: string }
  | { type: typeof ActionTypes.SET_CLIPS; payload: VideoClip[] }
  | { type: typeof ActionTypes.ADD_CLIP; payload: VideoClip }
  | { type: typeof ActionTypes.UPDATE_CLIP; payload: VideoClip }
  | { type: typeof ActionTypes.DELETE_CLIP; payload: string }
  | { type: typeof ActionTypes.SET_CLIP_SEQUENCE; payload: string[] }
  | { type: typeof ActionTypes.SET_LOADING; payload: { key: keyof LoadingState; value: boolean } }
  | { type: typeof ActionTypes.SET_ERROR; payload: { key: keyof ErrorState; value: string | null } }
  | { type: typeof ActionTypes.CLEAR_ERROR; payload: keyof ErrorState }
  | { type: typeof ActionTypes.ADD_GENERATION_JOB; payload: GenerationJob }
  | { type: typeof ActionTypes.UPDATE_GENERATION_JOB; payload: GenerationJob }
  | { type: typeof ActionTypes.REMOVE_GENERATION_JOB; payload: string }
  | { type: typeof ActionTypes.ADD_EXPORT_JOB; payload: ExportJob }
  | { type: typeof ActionTypes.UPDATE_EXPORT_JOB; payload: ExportJob }
  | { type: typeof ActionTypes.REMOVE_EXPORT_JOB; payload: string }
  | { type: typeof ActionTypes.SET_SELECTED_CLIP; payload: string | null }
  | { type: typeof ActionTypes.SET_UI_STATE; payload: Partial<UIState> }
  | { type: typeof ActionTypes.SET_DRAGGED_CLIP; payload: string | null };

// Initial state
const initialState: AppState = {
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

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
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

// Context interface
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Context provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load initial data
  useEffect(() => {
    // Load projects on app start
    // This will be implemented in the components that use this context
  }, []);

  const value: AppContextType = {
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
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;