import React, { useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const VideoSequencer = ({ clips, onClipsReorder, onClipSelect, selectedClip, onClipDelete }) => {
  const [showTimeline, setShowTimeline] = useState(true);
  const timelineRef = useRef(null);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(clips);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sequence_order for all clips
    const updatedClips = items.map((clip, index) => ({
      ...clip,
      sequence_order: index
    }));

    onClipsReorder(updatedClips);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    return clips.reduce((total, clip) => total + (clip.duration || 0), 0);
  };

  const getClipThumbnail = (clip) => {
    if (clip.thumbnail_url) {
      return clip.thumbnail_url.startsWith('http') 
        ? clip.thumbnail_url 
        : `http://localhost:8000${clip.thumbnail_url}`;
    }
    return null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Video Sequence</h2>
          <p className="text-sm text-gray-600">
            {clips.length} clips • Total duration: {formatDuration(getTotalDuration())}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className={`px-3 py-1 rounded-lg text-sm ${
              showTimeline 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            Timeline View
          </button>
        </div>
      </div>

      {/* Timeline View */}
      {showTimeline && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2 mb-4">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Timeline</span>
          </div>
          
          <div 
            ref={timelineRef}
            className="relative bg-gray-50 rounded-lg p-4 min-h-20 overflow-x-auto"
          >
            {clips.length === 0 ? (
              <div className="flex items-center justify-center h-16 text-gray-500">
                <span>No clips in sequence</span>
              </div>
            ) : (
              <div className="flex space-x-2">
                {clips
                  .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0))
                  .map((clip, index) => (
                    <div
                      key={clip.id}
                      className={`relative bg-white rounded border-2 cursor-pointer transition-all ${
                        selectedClip?.id === clip.id 
                          ? 'border-blue-500 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ 
                        width: `${Math.max(80, (clip.duration || 5) * 10)}px`,
                        minWidth: '80px'
                      }}
                      onClick={() => onClipSelect(clip)}
                    >
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-900 truncate">
                          {clip.title || `Clip ${index + 1}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDuration(clip.duration)}
                        </div>
                      </div>
                      
                      {/* Status indicator */}
                      <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                        clip.status === 'completed' ? 'bg-green-500' :
                        clip.status === 'processing' ? 'bg-yellow-500' :
                        clip.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clips List with Drag and Drop */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Clip Sequence</h3>
          <p className="text-sm text-gray-600">Drag and drop to reorder clips</p>
        </div>

        {clips.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clips in sequence</h3>
            <p className="text-gray-600">Generate some video clips to start building your sequence</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="clips">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`p-4 space-y-3 ${
                    snapshot.isDraggingOver ? 'bg-blue-50' : ''
                  }`}
                >
                  {clips
                    .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0))
                    .map((clip, index) => (
                      <Draggable key={clip.id} draggableId={clip.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-gray-50 rounded-lg p-4 transition-all ${
                              snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:bg-gray-100'
                            } ${
                              selectedClip?.id === clip.id ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => onClipSelect(clip)}
                          >
                            <div className="flex items-center space-x-4">
                              {/* Drag Handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                              </div>

                              {/* Sequence Number */}
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>

                              {/* Thumbnail */}
                              <div className="flex-shrink-0 w-16 h-12 bg-gray-200 rounded overflow-hidden">
                                {getClipThumbnail(clip) ? (
                                  <img
                                    src={getClipThumbnail(clip)}
                                    alt={clip.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              {/* Clip Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {clip.title || `Clip ${index + 1}`}
                                </h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>Duration: {formatDuration(clip.duration)}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(clip.status)}`}>
                                    {clip.status || 'pending'}
                                  </span>
                                  {clip.api_provider && (
                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                      {clip.api_provider}
                                    </span>
                                  )}
                                </div>
                                {clip.prompt && (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {clip.prompt}
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center space-x-2">
                                {clip.video_url && (
                                  <a
                                    href={clip.video_url.startsWith('http') ? clip.video_url : `http://localhost:8000${clip.video_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 p-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                                    </svg>
                                  </a>
                                )}
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onClipDelete(clip.id);
                                  }}
                                  className="text-red-600 hover:text-red-800 p-1"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Sequence Summary */}
      {clips.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Sequence Summary</h3>
              <p className="text-sm text-blue-700">
                {clips.length} clips • {formatDuration(getTotalDuration())} total duration
              </p>
            </div>
            
            <div className="text-sm text-blue-700">
              <div className="flex items-center space-x-4">
                <span>
                  Completed: {clips.filter(c => c.status === 'completed').length}
                </span>
                <span>
                  Processing: {clips.filter(c => c.status === 'processing').length}
                </span>
                <span>
                  Failed: {clips.filter(c => c.status === 'failed').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoSequencer;