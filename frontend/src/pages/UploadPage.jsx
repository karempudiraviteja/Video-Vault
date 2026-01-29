import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { videoAPI } from '../api/client.js';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { formatFileSize, formatDuration } from '../utils/helpers.js';
import ProgressBar from '../components/ProgressBar.jsx';
import '../styles/UploadPage.css';

export const UploadPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { addNotification, processingProgress } = useRealtime();

  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    tags: '',
    isPublic: false,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isAuthenticated) {
    navigate('/login');
  }

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = async (selectedFile) => {
    const allowedFormats = ['video/mp4', 'video/x-matroska', 'video/quicktime'];
    
    if (!allowedFormats.includes(selectedFile.type)) {
      addNotification('error', 'Invalid file format. Allowed: MP4, MKV, MOV');
      return;
    }

    setFile(selectedFile);

    // Get video metadata
    const video = document.createElement('video');
    const reader = new FileReader();

    reader.onload = (e) => {
      video.src = e.target.result;
      video.onloadedmetadata = () => {
        setMetadata({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
      };
    };

    reader.readAsDataURL(selectedFile);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      addNotification('error', 'Please select a video file');
      return;
    }

    setUploading(true);

    try {
      const response = await videoAPI.uploadVideo(
        file,
        formData.description,
        formData.tags,
        formData.isPublic
      );

      setUploadedVideo(response.data.video);
      addNotification('success', 'Video uploaded successfully! Processing started...');

      // Reset form
      setFile(null);
      setMetadata(null);
      setFormData({ description: '', tags: '', isPublic: false });
    } catch (error) {
      console.error('Upload error:', error);
      addNotification('error', error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <h1>📤 Upload Video</h1>

        <div className="upload-content">
          {!uploadedVideo ? (
            <form onSubmit={handleSubmit} className="upload-form">
              {/* Drop zone */}
              <div
                className={`drop-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="drop-zone-content">
                  <span className="drop-icon">📹</span>
                  <h3>Drag & drop your video here</h3>
                  <p>or</p>
                  <label className="file-input-label">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="video/mp4,.mp4,video/quicktime,.mov,video/x-matroska,.mkv"
                      disabled={uploading}
                    />
                    Select file
                  </label>
                  <p className="file-hint">MP4, MKV, MOV • Max 500MB</p>
                </div>
              </div>

              {/* File info */}
              {file && (
                <div className="file-info">
                  <div className="file-info-item">
                    <span className="label">File:</span>
                    <span className="value">{file.name}</span>
                  </div>
                  <div className="file-info-item">
                    <span className="label">Size:</span>
                    <span className="value">{formatFileSize(file.size)}</span>
                  </div>
                  {metadata && (
                    <>
                      <div className="file-info-item">
                        <span className="label">Duration:</span>
                        <span className="value">{formatDuration(metadata.duration)}</span>
                      </div>
                      <div className="file-info-item">
                        <span className="label">Resolution:</span>
                        <span className="value">{metadata.width}x{metadata.height}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Form fields */}
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Describe your video..."
                  rows="3"
                  disabled={uploading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <input
                  id="tags"
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleFormChange}
                  placeholder="tag1, tag2, tag3"
                  disabled={uploading}
                />
              </div>

              <div className="form-group checkbox">
                <input
                  id="isPublic"
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleFormChange}
                  disabled={uploading}
                />
                <label htmlFor="isPublic">Make video public</label>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!file || uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
              </div>
            </form>
          ) : (
            <div className="upload-success">
              <div className="success-icon">✅</div>
              <h2>Video Uploaded Successfully!</h2>
              <p className="video-name">{uploadedVideo.originalName}</p>

              <div className="processing-status">
                <h3>Processing Status</h3>
                {processingProgress[uploadedVideo._id] ? (
                  <ProgressBar
                    progress={processingProgress[uploadedVideo._id].progress}
                    status={processingProgress[uploadedVideo._id].status || 'processing'}
                  />
                ) : (
                  <p>Starting processing...</p>
                )}
              </div>

              <div className="video-details">
                <p><strong>Size:</strong> {formatFileSize(uploadedVideo.size)}</p>
                <p><strong>Duration:</strong> {formatDuration(uploadedVideo.duration)}</p>
                <p><strong>Status:</strong> {uploadedVideo.processingStatus}</p>
              </div>

              <div className="success-actions">
                <button
                  onClick={() => navigate(`/videos/${uploadedVideo._id}`)}
                  className="btn-primary"
                >
                  View Video
                </button>
                <button
                  onClick={() => {
                    setUploadedVideo(null);
                    setFile(null);
                  }}
                  className="btn-secondary"
                >
                  Upload Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
