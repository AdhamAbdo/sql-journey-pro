import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Zap, LayoutDashboard, Map, BookOpen, User, LogOut,
  Award, Star, Coins, Flame, ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, supabaseEnabled } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15}/> },
    { to: '/journey',   label: 'Journey',   icon: <Map size={15}/>             },
    { to: '/learn',     label: 'Study SQL', icon: <BookOpen size={15}/>        },
    { to: '/profile',   label: 'Profile',   icon: <User size={15}/>            },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (to) => location.pathname.startsWith(to);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="nav-logo">
          <div className="nav-logo-mark"><Zap size={16} /></div>
          <span>SQL Journey <span className="nav-pro">Pro</span></span>
        </Link>

        <div className="nav-links">
          {links.map(l => (
            <Link key={l.to} to={l.to} className={`nav-link ${isActive(l.to) ? 'active' : ''}`}>
              {l.icon} {l.label}
            </Link>
          ))}
        </div>

        <div className="nav-right">
          <div className="nav-chip">
            <Star size={13} />
            <span className="nav-chip-val">{(user.pts || 0).toLocaleString()}</span>
          </div>
          <div className="nav-chip gold">
            <Coins size={13} />
            <span className="nav-chip-val">{user.coins || 0}</span>
          </div>
          <div className="nav-chip red">
            <Flame size={13} />
            <span className="nav-chip-val">{user.streak || 0}</span>
          </div>

          <button className="nav-avatar-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="nav-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
            <ChevronDown size={13} className={`nav-chevron ${menuOpen ? 'open' : ''}`} />
          </button>

          {menuOpen && (
            <>
              <div className="nav-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="nav-dropdown fade-in">
                <div className="nav-dd-user">
                  <div className="nav-dd-avatar">{user.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div className="nav-dd-name">{user.name}</div>
                    <div className="nav-dd-email">{user.email}</div>
                    {supabaseEnabled && <div className="nav-dd-badge">Supabase ✓</div>}
                  </div>
                </div>
                <hr className="divider" style={{ margin: '8px 0' }} />
                <Link to="/profile" className="nav-dd-item" onClick={() => setMenuOpen(false)}>
                  <User size={14} /> Profile
                </Link>
                <Link to="/certificate" className="nav-dd-item" onClick={() => setMenuOpen(false)}>
                  <Award size={14} /> Certificate
                </Link>
                <hr className="divider" style={{ margin: '8px 0' }} />
                <button className="nav-dd-item danger" onClick={handleLogout}>
                  <LogOut size={14} /> Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
