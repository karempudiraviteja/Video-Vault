import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { videoAPI } from '../api/client.js';
import { formatFileSize, formatDate, formatDuration, getSensitivityColor, getStatusColor } from '../utils/helpers.js';
import '../styles/VideosPage.css';

export const VideosPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sensitivityStatus: '',
    processingStatus: '',
  });
  const [sortBy, setSortBy] = useState('newest');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Fetch videos
  useEffect(() => {
    fetchVideos();
  }, [filters, sortBy]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await videoAPI.getVideos({
        sensitivityStatus: filters.sensitivityStatus || undefined,
        processingStatus: filters.processingStatus || undefined,
        sortBy: sortBy === 'oldest' ? 'oldest' : 'newest',
        limit: 50,
      });

      setVideos(response.data.videos);
    } catch (error) {
      console.error('Fetch videos error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      await videoAPI.deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete video');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="videos-page">
      <div className="videos-container">
        <h1>📹 My Videos</h1>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="sensitivityStatus">Sensitivity:</label>
            <select
              id="sensitivityStatus"
              name="sensitivityStatus"
              value={filters.sensitivityStatus}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="safe">✅ Safe</option>
              <option value="flagged">⚠️ Flagged</option>
              <option value="pending">⏳ Pending</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="processingStatus">Status:</label>
            <select
              id="processingStatus"
              name="processingStatus"
              value={filters.processingStatus}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="pending">⏳ Pending</option>
              <option value="processing">🔄 Processing</option>
              <option value="completed">✅ Completed</option>
              <option value="failed">❌ Failed</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sortBy">Sort:</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Videos List */}
        {loading ? (
          <div className="loading">Loading videos...</div>
        ) : videos.length === 0 ? (
          <div className="empty-state">
            <p>No videos found</p>
            {user.role !== 'viewer' && (
              <button onClick={() => navigate('/upload')} className="btn-primary">
                Upload Your First Video
              </button>
            )}
          </div>
        ) : (
          <div className="videos-grid">
            {videos.map((video) => (
              <div key={video._id} className="video-card">
                <div className="video-thumbnail">
                  <div className="thumbnail-placeholder">🎬</div>
                  <div className="status-badge" style={{
                    backgroundColor: getStatusColor(video.processingStatus)
                  }}>
                    {video.processingStatus}
                  </div>
                </div>

                <div className="video-card-content">
                  <h3 className="video-title" title={video.originalName}>
                    {video.originalName}
                  </h3>

                  <div className="video-meta">
                    <p><strong>Size:</strong> {formatFileSize(video.size)}</p>
                    <p><strong>Duration:</strong> {formatDuration(video.duration)}</p>
                    <p><strong>Uploaded:</strong> {formatDate(video.createdAt)}</p>
                    <p><strong>Views:</strong> {video.views}</p>
                  </div>

                  <div className="sensitivity-status">
                    <span>Sensitivity:</span>
                    <span style={{
                      color: getSensitivityColor(video.sensitivityStatus),
                      fontWeight: 'bold'
                    }}>
                      {video.sensitivityStatus === 'safe' && '✅ Safe'}
                      {video.sensitivityStatus === 'flagged' && '⚠️ Flagged'}
                      {video.sensitivityStatus === 'pending' && '⏳ Pending'}
                    </span>
                  </div>

                  {video.description && (
                    <p className="video-description">{video.description}</p>
                  )}

                  <div className="video-actions">
                    {video.processingStatus === 'completed' && (
                      <button
                        onClick={() => navigate(`/videos/${video._id}`)}
                        className="btn-small btn-primary"
                      >
                        ▶️ Watch
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/videos/${video._id}`)}
                      className="btn-small btn-secondary"
                    >
                      ℹ️ Details
                    </button>
                    <button
                      onClick={() => handleDelete(video._id)}
                      className="btn-small btn-danger"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideosPage;
