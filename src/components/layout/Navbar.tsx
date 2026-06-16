import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BeaconLogo from './BeaconLogo';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" id="navbar-logo">
          <div className="logo-icon">
            <BeaconLogo size={18} />
          </div>
          <span className="logo-text">BEACON</span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-links hide-mobile">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} id="nav-home">
            Checker
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} id="nav-dashboard">
              Dashboard
            </Link>
          )}
          <Link to="/pricing" className={`nav-link ${location.pathname === '/pricing' ? 'active' : ''}`} id="nav-pricing">
            Pricing
          </Link>
        </div>

        {/* Desktop Auth */}
        <div className="navbar-actions hide-mobile">
          {isAuthenticated ? (
            <div className="user-menu">
              <div className="user-avatar">{user?.email?.[0]?.toUpperCase()}</div>
              <span className="user-email body-sm text-secondary">{user?.email}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout} id="btn-logout">
                <LogOut size={14} /> Sign Out
              </button>
              <Link to="/dashboard" className="btn btn-primary btn-sm" id="btn-dashboard-nav">
                <LayoutDashboard size={14} /> Dashboard
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm" id="btn-signin">
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm" id="btn-get-started">
                Get Started <ChevronRight size={14} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="mobile-toggle show-mobile"
          onClick={() => setMobileOpen(!mobileOpen)}
          id="mobile-menu-toggle"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="mobile-menu show-mobile">
          <Link to="/" className="mobile-nav-link" id="mobile-nav-home">Checker</Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="mobile-nav-link" id="mobile-nav-dashboard">Dashboard</Link>
          )}
          <Link to="/pricing" className="mobile-nav-link" id="mobile-nav-pricing">Pricing</Link>
          <div className="mobile-auth">
            {isAuthenticated ? (
              <button className="btn btn-secondary w-full" onClick={handleLogout}>Sign Out</button>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary w-full" id="mobile-btn-signin">Sign In</Link>
                <Link to="/signup" className="btn btn-primary w-full" id="mobile-btn-signup">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
