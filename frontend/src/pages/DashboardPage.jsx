import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/Dashboard.css';

export const DashboardPage = () => {
  const { user, tenant, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return '#dc2626';
      case 'editor':
        return '#2563eb';
      case 'viewer':
        return '#7c3aed';
      default:
        return '#6b7280';
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'admin':
        return 'Full workspace access and team management';
      case 'editor':
        return 'Can upload and manage videos';
      case 'viewer':
        return 'View-only access to videos';
      default:
        return 'Member';
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Header Section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1>Welcome back, {user?.firstName}! 👋</h1>
            <p className="workspace-label">{tenant?.name}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-content">
          {/* Quick Actions - Primary Focus */}
          <div className="quick-actions-card">
            <h2>🚀 Quick Actions</h2>
            <div className="action-buttons-grid">
              {user.role !== 'viewer' && (
                <button
                  onClick={() => navigate('/upload')}
                  className="action-btn action-btn-primary"
                >
                  <span className="btn-icon-large">📤</span>
                  <span className="btn-text">Upload Video</span>
                  <span className="btn-desc">Add new videos to workspace</span>
                </button>
              )}
              <button
                onClick={() => navigate('/videos')}
                className="action-btn action-btn-secondary"
              >
                <span className="btn-icon-large">📹</span>
                <span className="btn-text">Browse Videos</span>
                <span className="btn-desc">View all workspace videos</span>
              </button>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="action-btn action-btn-secondary"
              >
                <span className="btn-icon-large">👤</span>
                <span className="btn-text">My Profile</span>
                <span className="btn-desc">View your information</span>
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => navigate('/team')}
                  className="action-btn action-btn-secondary"
                >
                  <span className="btn-icon-large">👥</span>
                  <span className="btn-text">Team Management</span>
                  <span className="btn-desc">Manage workspace members</span>
                </button>
              )}
            </div>
          </div>

          {/* Profile Information - Toggleable */}
          {showProfile && (
            <div className="profile-card">
              <div className="profile-header">
                <h2>👤 Your Profile</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowProfile(false)}
                >
                  ✕
                </button>
              </div>

              <div className="profile-content">
                <div className="profile-avatar">
                  <div className="avatar-circle">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                </div>

                <div className="profile-info">
                  <div className="info-item">
                    <label>Full Name</label>
                    <p>{user?.firstName} {user?.lastName}</p>
                  </div>

                  <div className="info-item">
                    <label>Email Address</label>
                    <p>{user?.email}</p>
                  </div>

                  <div className="info-item">
                    <label>Role</label>
                    <div className="role-display">
                      <span 
                        className="role-badge" 
                        style={{ backgroundColor: getRoleBadgeColor(user?.role) }}
                      >
                        {user?.role?.toUpperCase()}
                      </span>
                      <p className="role-description">{getRoleDescription(user?.role)}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <label>Workspace</label>
                    <p>{tenant?.name}</p>
                  </div>

                  <div className="info-item">
                    <label>Member Since</label>
                    <p>{new Date(user?.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Workspace Overview */}
          <div className="workspace-overview-card">
            <h2>📊 Workspace Overview</h2>
            
            <div className="overview-item">
              <span className="overview-icon">🎬</span>
              <div className="overview-content">
                <p className="overview-label">VideoVault</p>
                <p className="overview-desc">Upload, process, and stream videos securely</p>
              </div>
            </div>

            <div className="overview-item">
              <span className="overview-icon">🔐</span>
              <div className="overview-content">
                <p className="overview-label">Role-Based Access</p>
                <p className="overview-desc">Viewer, Editor, or Admin permissions</p>
              </div>
            </div>

            <div className="overview-item">
              <span className="overview-icon">⚙️</span>
              <div className="overview-content">
                <p className="overview-label">Intelligent Processing</p>
                <p className="overview-desc">Automatic analysis and sensitivity detection</p>
              </div>
            </div>

            <div className="overview-item">
              <span className="overview-icon">📡</span>
              <div className="overview-content">
                <p className="overview-label">Real-Time Updates</p>
                <p className="overview-desc">Live notifications and streaming status</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
