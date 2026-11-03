import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Award, 
  Calendar, 
  Palette, 
  PlusCircle, 
  UploadCloud, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertOctagon, 
  FileText,
  Clock
} from 'lucide-react';
import { dashboardService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStats();
      if (data.success) {
        setStats(data.stats);
        setRecentActivity(data.recent_activity || []);
        setDistribution(data.distribution || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard analytics..." />;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-desc">Overview of college student certificates, event milestones, and verification status.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/generate" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Generate Certificate</span>
          </Link>
          <Link to="/bulk" className="btn btn-secondary">
            <UploadCloud size={16} />
            <span>Bulk Upload</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-value">{stats?.total_students || 0}</div>
            <div className="stat-label">Registered Students</div>
          </div>
          <div className="stat-icon blue">
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{stats?.total_certificates || 0}</div>
            <div className="stat-label">Certificates Issued</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600 }}>
                {stats?.valid_certificates || 0} Valid
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>•</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600 }}>
                {stats?.revoked_certificates || 0} Revoked
              </span>
            </div>
          </div>
          <div className="stat-icon emerald">
            <Award size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{stats?.total_events || 0}</div>
            <div className="stat-label">College Events</div>
          </div>
          <div className="stat-icon purple">
            <Calendar size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{stats?.total_templates || 7}</div>
            <div className="stat-label">Certificate Templates</div>
          </div>
          <div className="stat-icon amber">
            <Palette size={24} />
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="panel" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #4f46e5 100%)', color: 'white', padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Digital Academic Credential Management
            </h2>
            <p style={{ fontSize: '0.875rem', opacity: 0.9, maxWidth: 640 }}>
              Generate tamper-evident, printable landscape A4 certificates with embedded QR codes. Verify authenticity in real time without exposing student private data.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/students" className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
              Manage Students
            </Link>
            <Link to="/templates" className="btn btn-outline" style={{ background: 'white', color: 'var(--primary)', borderColor: 'white' }}>
              Customize Templates
            </Link>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Activity Table */}
        <div className="panel" style={{ flex: 2, marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <Clock size={18} color="var(--primary)" />
              <span>Recent Certificate Activity</span>
            </div>
            <Link to="/history" style={{ fontSize: '0.825rem', color: 'var(--secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span>View All</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <EmptyState 
              title="No certificates issued yet" 
              description="Click 'Generate Certificate' or 'Bulk Upload' to issue credentials to students."
            />
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Certificate ID</th>
                    <th>Student Name</th>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((cert) => (
                    <tr key={cert.id}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--primary)' }}>
                        {cert.certificate_id}
                      </td>
                      <td style={{ fontWeight: 600 }}>{cert.student_name}</td>
                      <td>{cert.event_name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{cert.issue_date}</td>
                      <td>
                        <span className={`badge ${cert.status === 'Valid' ? 'badge-success' : 'badge-danger'}`}>
                          {cert.status === 'Valid' ? <CheckCircle2 size={12} /> : <AlertOctagon size={12} />}
                          {cert.status}
                        </span>
                      </td>
                      <td>
                        <Link 
                          to={`/verify/${cert.certificate_id}`}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        >
                          Verify
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Certificate Breakdown / Quick Info */}
        <div className="panel" style={{ flex: 1, marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <FileText size={18} color="var(--secondary)" />
              <span>Certificates by Category</span>
            </div>
          </div>

          {distribution.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No category distribution data available yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {distribution.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {item.certificate_type}
                  </span>
                  <span className="badge badge-purple" style={{ fontSize: '0.8rem' }}>
                    {item.count} Issued
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
