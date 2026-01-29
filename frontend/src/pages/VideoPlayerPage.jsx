import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { videoAPI } from '../api/client.js';
import { formatFileSize, formatDate, formatDuration, getSensitivityColor, getStatusColor } from '../utils/helpers.js';
import ProgressBar from '../components/ProgressBar.jsx';
import '../styles/VideoPlayerPage.css';

export const VideoPlayerPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { processingProgress } = useRealtime();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Fetch video details
  useEffect(() => {
    fetchVideoDetails();
  }, [videoId]);

  const fetchVideoDetails = async () => {
    try {
      setLoading(true);
      const response = await videoAPI.getVideoById(videoId);
      setVideo(response.data);
      setError(null);
    } catch (err) {
      console.error('Fetch video error:', err);
      setError(err.response?.data?.error || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="video-player-loading">Loading video...</div>;
  }

  if (error) {
    return (
      <div className="video-player-error">
        <p>❌ {error}</p>
        <button onClick={() => navigate('/videos')}>Back to Videos</button>
      </div>
    );
  }

  if (!video) {
    return <div className="video-player-error">Video not found</div>;
  }

  const canStream = video.processingStatus === 'completed';

  return (
    <div className={`video-player-page ${fullscreen ? 'fullscreen' : ''}`}>
      <div className="video-player-container">
        {/* Video Player */}
        <div className="video-player-wrapper">
          {canStream ? (
            <video
              controls
              onFullscreenChange={() => setFullscreen(!fullscreen)}
              className="video-player"
            >
              <source src={videoAPI.streamVideo(videoId)} type={video.mimeType} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="video-placeholder">
              <div className="placeholder-content">
                {video.processingStatus === 'processing' ? (
                  <>
                    <p className="status-icon">⏳</p>
                    <h3>Video is Processing</h3>
                    <ProgressBar
                      progress={processingProgress[videoId]?.progress || video.processingProgress}
                      status={video.processingStatus}
                    />
                  </>
                ) : video.processingStatus === 'failed' ? (
                  <>
                    <p className="status-icon">❌</p>
                    <h3>Processing Failed</h3>
                    <p>{video.processingError}</p>
                  </>
                ) : (
                  <>
                    <p className="status-icon">⏳</p>
                    <h3>Processing Video...</h3>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Video Details */}
        <div className="video-details-section">
          <h1 className="video-title">{video.originalName}</h1>

          {/* Status Badges */}
          <div className="status-badges">
            <span
              className="badge"
              style={{ backgroundColor: getStatusColor(video.processingStatus) }}
            >
              {video.processingStatus}
            </span>
            <span
              className="badge"
              style={{ backgroundColor: getSensitivityColor(video.sensitivityStatus) }}
            >
              {video.sensitivityStatus === 'safe' && '✅ Safe'}
              {video.sensitivityStatus === 'flagged' && '⚠️ Flagged'}
              {video.sensitivityStatus === 'pending' && '⏳ Pending'}
            </span>
          </div>

          {/* Metadata */}
          <div className="video-metadata">
            <div className="metadata-item">
              <span className="label">File Size:</span>
              <span className="value">{formatFileSize(video.size)}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Duration:</span>
              <span className="value">{formatDuration(video.duration)}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Resolution:</span>
              <span className="value">{video.width}x{video.height}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Uploaded:</span>
              <span className="value">{formatDate(video.createdAt)}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Views:</span>
              <span className="value">{video.views}</span>
            </div>
          </div>

          {/* Description */}
          {video.description && (
            <div className="video-description-section">
              <h3>Description</h3>
              <p>{video.description}</p>
            </div>
          )}

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="video-tags-section">
              <h3>Tags</h3>
              <div className="tags-list">
                {video.tags.map((tag) => (
                  <span key={tag} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sensitivity Details */}
          {video.sensitivityDetails && (
            <div className="sensitivity-details">
              <h3>🔍 Sensitivity Analysis</h3>
              <div className="analysis-item">
                <span className="label">Score:</span>
                <span className="value">{video.sensitivityDetails.score || 0}/100</span>
              </div>
              <div className="analysis-item">
                <span className="label">Reason:</span>
                <span className="value">{video.sensitivityDetails.reason}</span>
              </div>
              {video.sensitivityDetails.flags && video.sensitivityDetails.flags.length > 0 && (
                <div className="analysis-item">
                  <span className="label">Flags:</span>
                  <div className="flags-list">
                    {video.sensitivityDetails.flags.map((flag) => (
                      <span key={flag} className="flag">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="video-actions">
            <button onClick={() => navigate('/videos')} className="btn-secondary">
              ← Back to Videos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerPage;
