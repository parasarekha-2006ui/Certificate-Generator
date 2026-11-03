import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Palette, 
  Award, 
  UploadCloud, 
  History, 
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/templates', label: 'Templates (7)', icon: Palette },
    { to: '/generate', label: 'Generate Single', icon: Award },
    { to: '/bulk', label: 'Bulk Generation', icon: UploadCloud },
    { to: '/history', label: 'Certificate History', icon: History },
    { to: '/verify', label: 'Public Verification', icon: ShieldCheck },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            zIndex: 35,
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-icon">
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="brand-title">CertifyPortal</div>
            <div className="brand-subtitle">College Management</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Core Management</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            System Version 2.0 • 2026
          </div>
        </div>
      </aside>
    </>
  );
}
