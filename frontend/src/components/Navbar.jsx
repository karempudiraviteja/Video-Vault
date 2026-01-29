import { useAuth } from '../context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

export const Navbar = () => {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          🎬 VideoVault
        </Link>

        {user && (
          <div className="navbar-content">
            <div className="navbar-links">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/videos">Videos</Link>
              {user.role !== 'viewer' && <Link to="/upload">Upload</Link>}
              {user.role === 'admin' && <Link to="/team">👥 Team</Link>}
            </div>

            <div className="navbar-user">
              <div className="user-info">
                <span className="user-name">{user.firstName} {user.lastName}</span>
                <span className="tenant-name">{tenant?.name}</span>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
