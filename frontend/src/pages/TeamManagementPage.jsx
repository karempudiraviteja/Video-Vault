import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { authAPI } from '../api/client.js';
import { useNavigate } from 'react-router-dom';
import '../styles/TeamManagementPage.css';

export const TeamManagementPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviteResult, setInviteResult] = useState(null);
  const [error, setError] = useState(null);
  const [urlCopied, setUrlCopied] = useState(false);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Only admins can manage team
  if (user?.role !== 'admin') {
    return (
      <div className="team-management-error">
        <div className="error-content">
          <p className="error-icon">🔒</p>
          <h2>Access Denied</h2>
          <p>Only workspace admins can manage team members.</p>
          <button onClick={() => navigate('/videos')}>Back to Videos</button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getTeamMembers();

      setMembers(response.data.members || []);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    try {
      setInviting(true);

      const response = await authAPI.inviteMember(inviteEmail, inviteRole);
      const data = response.data;

      setInviteResult(data.inviteData);
      setInviteEmail('');
      setInviteRole('editor');
      setError(null);

      setTimeout(() => fetchTeamMembers(), 1000);
    } catch (err) {
      console.error('Invite error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to send invite');
      setInviteResult(null);
    } finally {
      setInviting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return '#dc2626'; // red
      case 'editor':
        return '#2563eb'; // blue
      case 'viewer':
        return '#7c3aed'; // purple
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div className="team-management-page">
      <div className="team-management-container">
        {/* Header */}
        <div className="team-header">
          <div>
            <h1>Team Members</h1>
            <p className="subtitle">Manage your workspace members and permissions</p>
          </div>
          {user?.role === 'admin' && (
            <button
              className="invite-button"
              onClick={() => setShowInviteForm(!showInviteForm)}
            >
              {showInviteForm ? '✕ Cancel' : '+ Invite Member'}
            </button>
          )}
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <div className="invite-form-section">
            <h2>Invite Team Member</h2>

            <form onSubmit={handleInvite} className="invite-form">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="newmember@example.com"
                  disabled={inviting}
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  disabled={inviting}
                >
                  <option value="viewer">👁️ Viewer (Read-only)</option>
                  <option value="editor">✏️ Editor (Upload & Edit)</option>
                  <option value="admin">👑 Admin (Full Access)</option>
                </select>
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={inviting || !inviteEmail.trim()}
              >
                {inviting ? '⏳ Sending...' : '📧 Send Invite'}
              </button>
            </form>
          </div>
        )}

        {/* Invite Result */}
        {inviteResult && (
          <div className="invite-result-section">
            <div className="result-header">
              <h3>✅ Invitation Sent!</h3>
              <button onClick={() => setInviteResult(null)}>✕</button>
            </div>

            <div className="invite-details">
              <div className="detail-item">
                <label>Invited Member</label>
                <p><strong>{inviteResult.email}</strong> as <span
                  className="role-badge"
                  style={{ backgroundColor: getRoleBadgeColor(inviteResult.role) }}
                >
                  {inviteResult.role.charAt(0).toUpperCase() + inviteResult.role.slice(1)}
                </span></p>
              </div>

              <div className="detail-item">
                <label>Share This Link</label>
                <div className="url-display">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/register?${new URLSearchParams({
                      tenantId: inviteResult.tenantId,
                      inviteCode: inviteResult.inviteCode,
                      email: inviteResult.email,
                    }).toString()}`}
                  />
                  <button
                    className="copy-button"
                    onClick={() => copyToClipboard(
                      `${window.location.origin}/register?${new URLSearchParams({
                        tenantId: inviteResult.tenantId,
                        inviteCode: inviteResult.inviteCode,
                        email: inviteResult.email,
                      }).toString()}`
                    )}
                  >
                    {urlCopied ? '✓ Copied!' : '📋 Copy Link'}
                  </button>
                </div>
              </div>

              <div className="instructions">
                <p>Send this link to the member. They'll automatically join your workspace with their assigned role.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        {/* Team Members List */}
        <div className="team-members-section">
          <h2>Current Members ({members.length})</h2>

          {loading ? (
            <div className="loading">Loading team members...</div>
          ) : members.length === 0 ? (
            <div className="empty-state">
              <p>No team members yet. Invite someone to get started!</p>
            </div>
          ) : (
            <div className="members-table">
              <div className="table-header">
                <div className="col-name">Name</div>
                <div className="col-email">Email</div>
                <div className="col-role">Role</div>
                <div className="col-joined">Joined</div>
              </div>

              {members.map((member) => (
                <div key={member._id} className="table-row">
                  <div className="col-name">
                    <div className="member-name">
                      <span className="avatar">{member.firstName[0]}{member.lastName[0]}</span>
                      <span>{member.firstName} {member.lastName}</span>
                      {member._id === user?._id && <span className="badge-you">You</span>}
                    </div>
                  </div>
                  <div className="col-email">{member.email}</div>
                  <div className="col-role">
                    <span
                      className="role-badge"
                      style={{ backgroundColor: getRoleBadgeColor(member.role) }}
                    >
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </div>
                  <div className="col-joined">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role Legend */}
        <div className="role-legend">
          <h3>Role Permissions</h3>
          <div className="legend-grid">
            <div className="legend-item">
              <div className="legend-icon" style={{ backgroundColor: '#dc2626' }}>👑</div>
              <div className="legend-content">
                <h4>Admin</h4>
                <p>Full access • Invite members • Delete videos • Manage roles</p>
              </div>
            </div>
            <div className="legend-item">
              <div className="legend-icon" style={{ backgroundColor: '#2563eb' }}>✏️</div>
              <div className="legend-content">
                <h4>Editor</h4>
                <p>Upload videos • Edit metadata • Delete own videos</p>
              </div>
            </div>
            <div className="legend-item">
              <div className="legend-icon" style={{ backgroundColor: '#7c3aed' }}>👁️</div>
              <div className="legend-content">
                <h4>Viewer</h4>
                <p>View videos • Download • View analytics (read-only)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementPage;
