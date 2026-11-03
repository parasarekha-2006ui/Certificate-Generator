import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Download, 
  ExternalLink, 
  AlertOctagon, 
  CheckCircle2, 
  Eye, 
  Filter, 
  X,
  Calendar,
  Award,
  ShieldAlert
} from 'lucide-react';
import { certificateService, eventService, templateService } from '../services/api';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

export default function HistoryPage() {
  const [certificates, setCertificates] = useState([]);
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [selectedCertForView, setSelectedCertForView] = useState(null);
  const [revokingCert, setRevokingCert] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    loadFilterMetadata();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHistory();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedEventId, selectedType, selectedStatus]);

  const loadFilterMetadata = async () => {
    try {
      const [evtRes, tplRes] = await Promise.all([
        eventService.getAll(),
        templateService.getAll(),
      ]);
      if (evtRes.success) setEvents(evtRes.events || []);
      if (tplRes.success) setTemplates(tplRes.templates || []);
    } catch (err) {
      console.error('Failed to load filter metadata:', err);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await certificateService.getHistory({
        search: searchTerm,
        event_id: selectedEventId,
        type: selectedType,
        status: selectedStatus,
      });
      if (res.success) {
        setCertificates(res.certificates || []);
      }
    } catch (err) {
      addToast('Failed to load certificate history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokingCert) return;
    setIsRevoking(true);
    try {
      const res = await certificateService.revoke(revokingCert.certificate_id);
      if (res.success) {
        addToast(`Certificate ${revokingCert.certificate_id} has been revoked.`, 'info');
        setRevokingCert(null);
        loadHistory();
      }
    } catch (err) {
      addToast('Failed to revoke certificate.', 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Certificate Registry & History</h1>
          <p className="page-desc">Complete audit log of all issued academic credentials, re-download PDFs, and handle revocations.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by certificate ID, student name, or college..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
        >
          <option value="">All Events</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="">All Types</option>
          {templates.map((t) => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Valid">Valid</option>
          <option value="Revoked">Revoked</option>
        </select>

        {(searchTerm || selectedEventId || selectedType || selectedStatus) && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSearchTerm('');
              setSelectedEventId('');
              setSelectedType('');
              setSelectedStatus('');
            }}
          >
            <X size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Certificates Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <LoadingSpinner text="Retrieving certificate archive..." />
        ) : certificates.length === 0 ? (
          <EmptyState
            title="No certificates found"
            description="No certificates matched your search criteria."
          />
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Student Name</th>
                  <th>Credential Type</th>
                  <th>Event Name</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.id}>
                    <td>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>
                        {cert.certificate_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{cert.student_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cert.department}</div>
                    </td>
                    <td>
                      <span className="badge badge-purple">{cert.certificate_type}</span>
                    </td>
                    <td>{cert.event_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{cert.issue_date}</td>
                    <td>
                      <span className={`badge ${cert.status === 'Valid' ? 'badge-success' : 'badge-danger'}`}>
                        {cert.status === 'Valid' ? <CheckCircle2 size={12} /> : <AlertOctagon size={12} />}
                        {cert.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        <button
                          onClick={() => setSelectedCertForView(cert)}
                          className="btn btn-outline btn-sm"
                          title="View Credential Record"
                        >
                          <Eye size={14} />
                        </button>
                        <a
                          href={`http://localhost:5000/api/certificates/${cert.certificate_id}/download`}
                          className="btn btn-outline btn-sm"
                          title="Download PDF"
                          download
                        >
                          <Download size={14} />
                        </a>
                        <a
                          href={`/verify/${cert.certificate_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline btn-sm"
                          title="Public Verification"
                          style={{ color: 'var(--primary)' }}
                        >
                          <ExternalLink size={14} />
                        </a>
                        {cert.status === 'Valid' && (
                          <button
                            onClick={() => setRevokingCert(cert)}
                            className="btn btn-danger btn-sm"
                            title="Revoke Certificate"
                          >
                            <ShieldAlert size={14} />
                            <span>Revoke</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Certificate Details Modal */}
      {selectedCertForView && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Certificate Registry Record</h3>
              <button onClick={() => setSelectedCertForView(null)} style={{ color: 'var(--text-light)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Certificate ID:</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>
                    {selectedCertForView.certificate_id}
                  </div>
                </div>
                <span className={`badge ${selectedCertForView.status === 'Valid' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.85rem' }}>
                  {selectedCertForView.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>STUDENT NAME</strong>
                  {selectedCertForView.student_name}
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>DEPARTMENT & YEAR</strong>
                  {selectedCertForView.department} ({selectedCertForView.year})
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>EVENT</strong>
                  {selectedCertForView.event_name}
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>EVENT DATE</strong>
                  {selectedCertForView.event_date}
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>ISSUE DATE</strong>
                  {selectedCertForView.issue_date}
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>ISSUING AUTHORITY</strong>
                  {selectedCertForView.issuing_authority}
                </div>
              </div>

              {selectedCertForView.description && (
                <div style={{ background: 'var(--background)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem', color: '#334155', marginBottom: '1rem' }}>
                  <strong>Body Text:</strong> {selectedCertForView.description}
                </div>
              )}

              {selectedCertForView.qr_code_path && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)' }}>
                  <img
                    src={`http://localhost:5000/api/certificates/qr/${selectedCertForView.qr_code_path}`}
                    alt="QR Verification"
                    style={{ width: 70, height: 70 }}
                  />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Verification QR Link</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Scannable from smartphones or directly verifiable at /verify/{selectedCertForView.certificate_id}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <a
                href={`http://localhost:5000/api/certificates/${selectedCertForView.certificate_id}/download`}
                className="btn btn-primary btn-sm"
                download
              >
                <Download size={14} />
                <span>Download PDF</span>
              </a>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedCertForView(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revocation Confirm Modal */}
      <ConfirmModal
        isOpen={!!revokingCert}
        title="Revoke Certificate Credential"
        message={`WARNING: Revoking certificate '${revokingCert?.certificate_id}' issued to '${revokingCert?.student_name}' will permanently mark it as INVALID/REVOKED on the public verification portal. Anyone scanning the QR code or visiting the verification link will see that this credential has been revoked. Are you sure you want to proceed?`}
        confirmText="Revoke Certificate"
        confirmVariant="danger"
        isLoading={isRevoking}
        onConfirm={handleRevokeConfirm}
        onCancel={() => setRevokingCert(null)}
      />
    </div>
  );
}
