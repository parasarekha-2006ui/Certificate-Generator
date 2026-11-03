import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, LogOut, ShieldCheck, User } from 'lucide-react';
import { authService } from '../services/api';

export default function Navbar({ toggleSidebar, adminUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const adminName = adminUser?.name || 'Administrator';
  const adminEmail = adminUser?.email || 'admin@college.edu';
  const initials = adminName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <header className="top-navbar">
      <div className="nav-left">
        <button 
          className="mobile-menu-btn" 
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>
            Academic Credential System
          </span>
          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
            College Portal
          </span>
        </div>
      </div>

      <div className="nav-right">
        <Link 
          to="/verify" 
          className="btn btn-outline btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ShieldCheck size={16} color="var(--primary)" />
          <span>Verify Credential</span>
        </Link>

        <div className="user-badge">
          <div className="user-avatar">{initials}</div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.1 }}>
              {adminName}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {adminEmail}
            </span>
          </div>
        </div>

        <button 
          onClick={handleLogout} 
          className="btn btn-outline btn-sm"
          title="Sign out of Admin Dashboard"
          style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
