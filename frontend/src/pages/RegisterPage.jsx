import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authAPI } from '../api/client.js';
import { isValidEmail } from '../utils/helpers.js';
import '../styles/Auth.css';

export const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    tenantName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInvited, setIsInvited] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [inviteWorkspaceName, setInviteWorkspaceName] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  // Check if this is an invite registration
  useEffect(() => {
    const email = searchParams.get('email');
    const inviteCode = searchParams.get('inviteCode');
    const tenantId = searchParams.get('tenantId');

    if (email && inviteCode && tenantId) {
      setIsInvited(true);
      setInviteEmail(email);
      setFormData((prev) => ({ ...prev, email }));
      
      // Fetch workspace name from invite info
      fetchWorkspaceInfo(tenantId);
    }
  }, [searchParams]);

  const fetchWorkspaceInfo = async (tenantId) => {
    try {
      const email = searchParams.get('email');
      const inviteCode = searchParams.get('inviteCode');
      
      if (!email || !inviteCode) return;

      const response = await authAPI.getTenantInfo(tenantId, email, inviteCode);
      setInviteWorkspaceName(response.data.tenantName);
      setInviteRole(response.data.inviteRole);
    } catch (err) {
      console.error('Failed to fetch workspace info:', err);
      setError(err.response?.data?.error || 'Failed to load workspace information');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { firstName, lastName, email, password, confirmPassword, tenantName } = formData;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      setError('First name, last name, email, and password are required');
      return;
    }

    if (!isInvited && !tenantName) {
      setError('Workspace name is required');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Invalid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const inviteCode = searchParams.get('inviteCode');
    const tenantId = searchParams.get('tenantId');

    const result = await register(
      email,
      password,
      firstName,
      lastName,
      isInvited ? undefined : tenantName,
      isInvited ? tenantId : undefined,
      isInvited ? inviteCode : undefined
    );

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card auth-card-register">
          <h1 className="auth-title">🎬 Create Account</h1>
          <p className="auth-subtitle">Join VideoVault today</p>

          {error && <div className="auth-error">{error}</div>}

          {isInvited && (
            <div className="auth-info">
              <p>✅ You've been invited to <strong>{inviteWorkspaceName || 'a workspace'}</strong> as <strong>{inviteRole}</strong></p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email {isInvited && <span className="badge">Invited</span>}</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@example.com"
                disabled={loading || isInvited}
              />
            </div>

            {!isInvited && (
              <div className="form-group">
                <label htmlFor="tenantName">Workspace Name</label>
                <input
                  id="tenantName"
                  name="tenantName"
                  type="text"
                  value={formData.tenantName}
                  onChange={handleChange}
                  placeholder="My Workspace"
                  disabled={loading}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <p className="auth-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
