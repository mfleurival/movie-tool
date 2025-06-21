import React from 'react';

const Timeline = ({ clips, selectedClipId }) => {
  const sortedClips = clips.sort((a, b) => a.sequence_order - b.sequence_order);
  
  // Calculate total duration
  const totalDuration = sortedClips.reduce((total, clip) => {
    return total + (clip.duration || 0);
  }, 0);

  // Calculate cumulative durations for positioning
  let cumulativeDuration = 0;
  const clipsWithPositions = sortedClips.map(clip => {
    const startTime = cumulativeDuration;
    const duration = clip.duration || 0;
    cumulativeDuration += duration;
    
    return {
      ...clip,
      startTime,
      duration,
      endTime: cumulativeDuration
    };
  });

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getClipWidth = (duration) => {
    if (totalDuration === 0) return 0;
    return Math.max((duration / totalDuration) * 100, 5); // Minimum 5% width
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (clips.length === 0) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Timeline</h3>
          <div className="text-sm text-gray-600">
            Total Duration: {formatTime(totalDuration)}
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="bg-gray-50 rounded-lg p-4">
        {/* Time Markers */}
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>0:00</span>
          {totalDuration > 0 && (
            <>
              {totalDuration > 30 && <span>{formatTime(totalDuration / 4)}</span>}
              {totalDuration > 60 && <span>{formatTime(totalDuration / 2)}</span>}
              {totalDuration > 90 && <span>{formatTime((totalDuration * 3) / 4)}</span>}
              <span>{formatTime(totalDuration)}</span>
            </>
          )}
        </div>

        {/* Timeline Track */}
        <div className="relative h-16 bg-white rounded border border-gray-200 overflow-hidden">
          {clipsWithPositions.map((clip, index) => {
            const width = getClipWidth(clip.duration);
            const left = totalDuration > 0 ? (clip.startTime / totalDuration) * 100 : 0;
            const isSelected = selectedClipId === clip.id;
            
            return (
              <div
                key={clip.id}
                className={`absolute top-0 h-full border-r border-white transition-all ${
                  isSelected ? 'ring-2 ring-blue-500 z-10' : ''
                }`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`
                }}
              >
                {/* Clip Block */}
                <div className={`h-full ${getStatusColor(clip.status)} relative group cursor-pointer`}>
                  {/* Clip Content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Thumbnail if available */}
                    {clip.thumbnail_url ? (
                      <img
                        src={clip.thumbnail_url}
                        alt={`Clip ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-white text-xs font-medium">
                        {index + 1}
                      </div>
                    )}
                  </div>

                  {/* Overlay with clip info */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-center text-xs">
                      <div className="font-medium">Clip {index + 1}</div>
                      <div>{formatTime(clip.duration)}</div>
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 border-2 border-blue-500 bg-blue-500 bg-opacity-20"></div>
                  )}
                </div>

                {/* Time Labels */}
                <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
                  {formatTime(clip.startTime)}
                </div>
                {index === clipsWithPositions.length - 1 && (
                  <div className="absolute -bottom-6 right-0 text-xs text-gray-500">
                    {formatTime(clip.endTime)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty state */}
          {clipsWithPositions.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <div className="text-sm">No clips in timeline</div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-600">Processing</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">Failed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span className="text-gray-600">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;