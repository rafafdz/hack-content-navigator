import { useState, useEffect, useRef } from 'react';

function formatDuration(seconds) {
  if (!seconds) return '';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default function MediaCard({ file }) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef(null);

  const thumbnail = file.type === 'video' && file.thumbnails.frames.length > 0
    ? file.thumbnails.frames[currentFrame]
    : file.thumbnails.main;

  useEffect(() => {
    if (isHovering && file.type === 'video' && file.thumbnails.frames.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % file.thumbnails.frames.length);
      }, 500); // Change frame every 500ms
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setCurrentFrame(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovering, file.type, file.thumbnails.frames.length]);

  const getTypeIcon = () => {
    switch (file.type) {
      case 'video':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      case 'audio':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
        );
      case 'image':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const hasDriveUrl = file.googleDrive?.url && file.googleDrive.url.trim() !== '';

  const handleClick = () => {
    if (hasDriveUrl) {
      window.open(file.googleDrive.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 ${
        hasDriveUrl ? 'cursor-pointer' : ''
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-200 overflow-hidden">
        {thumbnail ? (
          <img
            src={`/${thumbnail}`}
            alt={file.fileName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              {getTypeIcon()}
              <p className="text-xs mt-2">No thumbnail</p>
            </div>
          </div>
        )}

        {/* Duration overlay for videos and audio */}
        {(file.type === 'video' || file.type === 'audio') && file.metadata.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {formatDuration(file.metadata.duration)}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <div className="w-4 h-4">
            {getTypeIcon()}
          </div>
          {file.type}
        </div>

        {/* Google Drive badge */}
        {hasDriveUrl && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-700 transition-colors" title="Open in Google Drive">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.01 1.485c-.276 0-.474.042-.672.126L3.319 5.669c-.395.168-.672.546-.672.966v11.645c0 .42.277.798.672.966l8.019 3.058c.198.084.396.126.672.126.276 0 .474-.042.672-.126l8.018-3.058c.396-.168.673-.546.673-.966V6.635c0-.42-.277-.798-.673-.966l-8.018-3.058c-.198-.084-.396-.126-.672-.126z"/>
            </svg>
            <span>Drive</span>
          </div>
        )}

        {/* Frame indicator for videos */}
        {file.type === 'video' && file.thumbnails.frames.length > 0 && isHovering && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {currentFrame + 1}/{file.thumbnails.frames.length}
          </div>
        )}
      </div>

      {/* File info */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 truncate mb-2" title={file.fileName}>
          {file.fileName}
        </h3>

        <div className="space-y-1 text-xs text-gray-500">
          {file.metadata.resolution && file.metadata.resolution.width > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span>
                {file.metadata.resolution.width} × {file.metadata.resolution.height}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span>{formatFileSize(file.metadata.fileSize)}</span>
          </div>

          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span>{new Date(file.metadata.creationDate).toLocaleString()}</span>
          </div>
        </div>

        {/* Path */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 truncate" title={file.relativePath}>
            {file.relativePath}
          </p>
        </div>
      </div>
    </div>
  );
}
