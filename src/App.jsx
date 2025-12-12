import { useState, useEffect, useMemo } from 'react';
import MediaCard from './components/MediaCard';

function App() {
  const [mediaData, setMediaData] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}media_index.json?t=${Date.now()}`)
      .then(response => response.json())
      .then(data => {
        setMediaData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading media data:', error);
        setLoading(false);
      });
  }, []);

  const groupedByDate = useMemo(() => {
    if (!mediaData) return {};

    let filtered = mediaData.files;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(file => file.type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file =>
        file.fileName.toLowerCase().includes(query) ||
        file.relativePath.toLowerCase().includes(query)
      );
    }

    // Group by date
    const grouped = filtered.reduce((acc, file) => {
      const date = new Date(file.metadata.creationDate);
      const dateKey = !isNaN(date.getTime())
        ? date.toISOString().split('T')[0] // YYYY-MM-DD
        : 'unknown-date'; // Fallback for invalid dates

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(file);
      return acc;
    }, {});

    // Sort dates descending (unknown dates go last)
    return Object.keys(grouped)
      .sort((a, b) => {
        if (a === 'unknown-date') return 1;
        if (b === 'unknown-date') return -1;
        return new Date(b) - new Date(a);
      })
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {});
  }, [mediaData, filterType, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading media library...</p>
        </div>
      </div>
    );
  }

  if (!mediaData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold">Error loading media data</p>
          <p className="text-sm mt-2">Please check the console for details</p>
        </div>
      </div>
    );
  }

  const stats = mediaData.metadata?.stats || { images: 0, videos: 0, audio: 0 };
  const totalFiles = Object.values(groupedByDate).reduce((sum, files) => sum + files.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
              <p className="text-sm text-gray-500 mt-1">
                {totalFiles} files
                {filterType !== 'all' && ` (${filterType})`}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-blue-600">{stats.images}</div>
                <div className="text-gray-500">Images</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{stats.videos}</div>
                <div className="text-gray-500">Videos</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-purple-600">{stats.audio}</div>
                <div className="text-gray-500">Audio</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by filename or path..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'image'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Images
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'video'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Videos
              </button>
              <button
                onClick={() => setFilterType('audio')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'audio'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Audio
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No files found</p>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([date, files]) => (
            <div key={date} className="mb-12">
              {/* Date header */}
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {date === 'unknown-date'
                    ? 'Unknown Date'
                    : new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                </h2>
                <span className="ml-4 text-sm text-gray-500">
                  {files.length} {files.length === 1 ? 'file' : 'files'}
                </span>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {files.map((file) => (
                  <MediaCard key={file.id} file={file} />
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Generated on {mediaData.metadata?.generatedAt ? new Date(mediaData.metadata.generatedAt).toLocaleString() : 'Unknown'}
            {' • '}
            Source: {mediaData.metadata?.sourceVolume || 'Unknown'}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
