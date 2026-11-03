import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  UploadCloud, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Archive, 
  FileText, 
  ExternalLink,
  Info,
  XCircle
} from 'lucide-react';
import { eventService, templateService, certificateService } from '../services/api';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function BulkGeneratePage() {
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form selections
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('participation');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [issuingAuthority, setIssuingAuthority] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const location = useLocation();
  const { addToast } = useToast();

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    try {
      setLoading(true);
      const [evtRes, tplRes] = await Promise.all([
        eventService.getAll(),
        templateService.getAll(),
      ]);

      const evtList = evtRes.events || [];
      setEvents(evtList);
      setTemplates(tplRes.templates || []);

      const params = new URLSearchParams(location.search);
      const qEventId = params.get('eventId');
      if (qEventId) {
        const found = evtList.find(e => String(e.id) === String(qEventId));
        if (found) {
          setSelectedEventId(found.id);
          setIssuingAuthority(found.issuing_authority);
        }
      } else if (evtList.length > 0) {
        setSelectedEventId(evtList[0].id);
        setIssuingAuthority(evtList[0].issuing_authority);
      }
    } catch (err) {
      addToast('Failed to load events and templates for bulk generator.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (e) => {
    const eId = e.target.value;
    setSelectedEventId(eId);
    const evt = events.find(ev => String(ev.id) === String(eId));
    if (evt) {
      setIssuingAuthority(evt.issuing_authority);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'csv'].includes(ext)) {
        addToast('Please upload a valid .xlsx or .csv spreadsheet file.', 'error');
        return;
      }
      setSelectedFile(file);
      setBulkResult(null);
    }
  };

  const handleProcessBulk = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      addToast('Please select a student spreadsheet file to upload.', 'error');
      return;
    }
    if (!selectedEventId) {
      addToast('Please select an event for the certificates.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('event_id', selectedEventId);
    formData.append('template_key', selectedTemplateKey);
    formData.append('issue_date', issueDate);
    if (issuingAuthority) {
      formData.append('issuing_authority', issuingAuthority);
    }

    setIsProcessing(true);
    setBulkResult(null);

    try {
      const res = await certificateService.generateBulk(formData);
      setBulkResult(res);
      addToast(res.message, res.valid_count > 0 ? 'success' : 'warning');
    } catch (err) {
      const errData = err.response?.data;
      if (errData && errData.invalid_rows) {
        setBulkResult(errData);
        addToast(errData.message || 'Row validation failed.', 'error');
      } else {
        addToast(errData?.message || 'Failed to process bulk upload.', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading bulk generator..." />;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bulk Certificate Generation</h1>
          <p className="page-desc">Upload student Excel or CSV spreadsheets, run row-level data validation, and batch generate certificates with a single ZIP archive download.</p>
        </div>
        <a
          href={certificateService.getSampleTemplateUrl()}
          className="btn btn-outline"
          download
        >
          <FileSpreadsheet size={16} color="var(--primary)" />
          <span>Download Sample Template (.xlsx)</span>
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(320px, 1fr)', gap: '1.75rem', alignItems: 'start' }}>
        {/* Upload Form */}
        <div className="panel">
          <form onSubmit={handleProcessBulk}>
            <div className="panel-title" style={{ marginBottom: '1.25rem' }}>
              <UploadCloud size={18} color="var(--primary)" />
              <span>Bulk Upload & Parameters</span>
            </div>

            {/* File Drag / Drop Picker */}
            <div className="form-group">
              <label className="form-label">Student Data Spreadsheet (.xlsx or .csv) *</label>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem 1.5rem',
                  border: '2px dashed var(--secondary)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--secondary-light)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.2s ease',
                }}
              >
                <FileSpreadsheet size={36} color="var(--secondary)" />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.65rem' }}>
                  {selectedFile ? selectedFile.name : 'Choose or drop spreadsheet here'}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Supported formats: Microsoft Excel (.xlsx), Comma Separated Values (.csv)
                </span>
                {selectedFile && (
                  <span className="badge badge-success" style={{ marginTop: '0.65rem' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB Ready
                  </span>
                )}
                <input
                  type="file"
                  accept=".xlsx, .csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Event Selection */}
            <div className="form-group">
              <label className="form-label">Link to College Event *</label>
              <select
                className="form-control"
                value={selectedEventId}
                onChange={handleEventChange}
                required
              >
                <option value="">-- Select Event --</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({String(e.event_date).split('T')[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Template & Date */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Certificate Template *</label>
                <select
                  className="form-control"
                  value={selectedTemplateKey}
                  onChange={(e) => setSelectedTemplateKey(e.target.value)}
                  required
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.template_key}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Certificate Issue Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Issuing Authority / Signatory *</label>
              <input
                type="text"
                className="form-control"
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem' }}
              disabled={isProcessing}
            >
              <UploadCloud size={18} />
              <span>{isProcessing ? 'Validating & Generating Certificates...' : 'Process & Generate Certificates'}</span>
            </button>
          </form>
        </div>

        {/* Instructions & Format Specification */}
        <div>
          <div className="panel" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="panel-title" style={{ marginBottom: '1rem' }}>
              <Info size={18} color="var(--secondary)" />
              <span>Required Spreadsheet Columns</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
              The uploaded spreadsheet must include these exact column headers in the first row. Row-level validation will catch missing fields or invalid email formats:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              {[
                { col: 'student_id', desc: 'Unique Roll/Registration ID' },
                { col: 'name', desc: 'Full Name of student' },
                { col: 'college', desc: 'College / Institute Name' },
                { col: 'department', desc: 'Academic Department' },
                { col: 'year', desc: 'e.g. 3rd Year' },
                { col: 'email', desc: 'Valid student email' },
                { col: 'phone', desc: '7 to 15 digits phone' },
              ].map((item, idx) => (
                <div key={idx} style={{ padding: '0.5rem 0.65rem', background: 'var(--background)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)' }}>
                  <code style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>{item.col}</code>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Results & Row-Level Validation Report */}
      {bulkResult && (
        <div style={{ marginTop: '2rem' }}>
          {/* Summary Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div>
                <div className="stat-value">{bulkResult.total_rows}</div>
                <div className="stat-label">Total Rows Scanned</div>
              </div>
              <div className="stat-icon blue">
                <FileText size={24} />
              </div>
            </div>

            <div className="stat-card">
              <div>
                <div className="stat-value" style={{ color: 'var(--success)' }}>{bulkResult.valid_count}</div>
                <div className="stat-label">Successfully Generated</div>
              </div>
              <div className="stat-icon emerald">
                <CheckCircle2 size={24} />
              </div>
            </div>

            <div className="stat-card">
              <div>
                <div className="stat-value" style={{ color: bulkResult.invalid_count > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                  {bulkResult.invalid_count}
                </div>
                <div className="stat-label">Failed / Invalid Rows</div>
              </div>
              <div className="stat-icon amber">
                <AlertTriangle size={24} />
              </div>
            </div>

            {bulkResult.zip_url && (
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)', border: '1px solid var(--secondary)' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>Batch Archive</div>
                  <div className="stat-label">Download All Certificates</div>
                  <a
                    href={`http://localhost:5000${bulkResult.zip_url}`}
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '0.65rem' }}
                    download
                  >
                    <Archive size={14} />
                    <span>Download ZIP ({bulkResult.valid_count} PDFs)</span>
                  </a>
                </div>
                <div className="stat-icon purple">
                  <Archive size={24} />
                </div>
              </div>
            )}
          </div>

          {/* Invalid Rows Table if any */}
          {bulkResult.invalid_rows && bulkResult.invalid_rows.length > 0 && (
            <div className="panel" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div className="panel-header">
                <div className="panel-title" style={{ color: 'var(--danger)' }}>
                  <XCircle size={18} />
                  <span>Row-Level Errors Detected ({bulkResult.invalid_rows.length} rows)</span>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                The following rows contained validation errors and were skipped during certificate generation:
              </p>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>Row #</th>
                      <th style={{ width: '35%' }}>Submitted Data</th>
                      <th style={{ width: '55%' }}>Validation Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkResult.invalid_rows.map((inv, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, color: 'var(--danger)' }}>Row {inv.row_number}</td>
                        <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                          {inv.raw_data?.name || inv.raw_data?.student_id || JSON.stringify(inv.raw_data)}
                        </td>
                        <td>
                          <ul style={{ paddingLeft: '1.2rem', color: 'var(--danger)', fontSize: '0.825rem' }}>
                            {inv.errors.map((err, eIdx) => (
                              <li key={eIdx}>{err}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Valid Generated Certificates List */}
          {bulkResult.certificates && bulkResult.certificates.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <CheckCircle2 size={18} color="var(--success)" />
                  <span>Generated Certificates in this Batch ({bulkResult.certificates.length})</span>
                </div>
              </div>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Certificate ID</th>
                      <th>Student Name</th>
                      <th>Department</th>
                      <th style={{ textAlign: 'right' }}>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkResult.certificates.map((cert) => (
                      <tr key={cert.id}>
                        <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--primary)' }}>
                          {cert.certificate_id}
                        </td>
                        <td style={{ fontWeight: 600 }}>{cert.student_name}</td>
                        <td>{cert.department}</td>
                        <td style={{ textAlign: 'right' }}>
                          <a
                            href={`http://localhost:5000${cert.download_url}`}
                            className="btn btn-outline btn-sm"
                            download
                          >
                            <Download size={13} />
                            <span>PDF</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
