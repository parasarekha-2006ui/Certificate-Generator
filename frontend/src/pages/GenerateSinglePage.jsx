import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Award, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Eye, 
  Calendar, 
  User, 
  FileText, 
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { studentService, eventService, templateService, certificateService } from '../services/api';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function GenerateSinglePage() {
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentDetails, setStudentDetails] = useState({
    name: '',
    college: 'Apex Institute of Technology',
    department: 'Computer Science and Engineering',
    year: '3rd Year',
  });

  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [issuingAuthority, setIssuingAuthority] = useState('Prof. Dr. R. K. Sharma, Dean of Academic Affairs');

  const [selectedTemplateKey, setSelectedTemplateKey] = useState('participation');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [customDescription, setCustomDescription] = useState('');

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    try {
      setLoading(true);
      const [stuRes, evtRes, tplRes] = await Promise.all([
        studentService.getAll(),
        eventService.getAll(),
        templateService.getAll(),
      ]);

      const stuList = stuRes.students || [];
      const evtList = evtRes.events || [];
      const tplList = tplRes.templates || [];

      setStudents(stuList);
      setEvents(evtList);
      setTemplates(tplList);

      // Check query parameters
      const params = new URLSearchParams(location.search);
      const qStudentId = params.get('studentId');
      const qEventId = params.get('eventId');

      if (qStudentId) {
        const foundStu = stuList.find(s => String(s.id) === String(qStudentId));
        if (foundStu) {
          setSelectedStudentId(foundStu.id);
          setStudentDetails({
            name: foundStu.name,
            college: foundStu.college,
            department: foundStu.department,
            year: foundStu.year,
          });
        }
      } else if (stuList.length > 0) {
        setSelectedStudentId(stuList[0].id);
        setStudentDetails({
          name: stuList[0].name,
          college: stuList[0].college,
          department: stuList[0].department,
          year: stuList[0].year,
        });
      }

      if (qEventId) {
        const foundEvt = evtList.find(e => String(e.id) === String(qEventId));
        if (foundEvt) {
          setSelectedEventId(foundEvt.id);
          setEventName(foundEvt.name);
          setEventDate(String(foundEvt.event_date).split('T')[0]);
          setIssuingAuthority(foundEvt.issuing_authority);
        }
      } else if (evtList.length > 0) {
        setSelectedEventId(evtList[0].id);
        setEventName(evtList[0].name);
        setEventDate(String(evtList[0].event_date).split('T')[0]);
        setIssuingAuthority(evtList[0].issuing_authority);
      }
    } catch (err) {
      addToast('Error initializing certificate generation dependencies.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (e) => {
    const sId = e.target.value;
    setSelectedStudentId(sId);
    const stu = students.find(s => String(s.id) === String(sId));
    if (stu) {
      setStudentDetails({
        name: stu.name,
        college: stu.college,
        department: stu.department,
        year: stu.year,
      });
    }
  };

  const handleEventSelect = (e) => {
    const eId = e.target.value;
    setSelectedEventId(eId);
    const evt = events.find(ev => String(ev.id) === String(eId));
    if (evt) {
      setEventName(evt.name);
      setEventDate(String(evt.event_date).split('T')[0]);
      setIssuingAuthority(evt.issuing_authority);
    }
  };

  const activeTemplate = templates.find(t => t.template_key === selectedTemplateKey) || templates[0];

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!studentDetails.name || !eventName) {
      addToast('Student name and event name are required.', 'error');
      return;
    }

    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const payload = {
        student_db_id: selectedStudentId ? parseInt(selectedStudentId) : null,
        student_name: studentDetails.name,
        college_name: studentDetails.college,
        department: studentDetails.department,
        year: studentDetails.year,
        event_id: selectedEventId ? parseInt(selectedEventId) : null,
        event_name: eventName,
        event_date: eventDate,
        template_key: selectedTemplateKey,
        issue_date: issueDate,
        description: customDescription,
        issuing_authority: issuingAuthority,
      };

      const res = await certificateService.generateSingle(payload);
      if (res.success) {
        setGeneratedResult(res);
        addToast(`Certificate ${res.certificate.certificate_id} generated successfully!`, 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to generate certificate.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Preparing certificate generator..." />;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Generate Certificate</h1>
          <p className="page-desc">Issue an official digitally registered credential with a live QR verification seal.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.1fr) minmax(320px, 0.9fr)', gap: '1.75rem', alignItems: 'start' }}>
        {/* Left Column: Input Form */}
        <div className="panel">
          <form onSubmit={handleGenerate}>
            <div className="panel-title" style={{ marginBottom: '1.25rem' }}>
              <Award size={18} color="var(--primary)" />
              <span>Certificate Parameters</span>
            </div>

            {/* Recipient Student Selection */}
            <div className="form-group">
              <label className="form-label">Select Registered Student</label>
              <select
                className="form-control"
                value={selectedStudentId}
                onChange={handleStudentSelect}
              >
                <option value="">-- Choose Existing Student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.student_id} - {s.name} ({s.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Student Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={studentDetails.name}
                  onChange={(e) => setStudentDetails({ ...studentDetails, name: e.target.value })}
                  placeholder="e.g. Aarav Patel"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department *</label>
                <input
                  type="text"
                  className="form-control"
                  value={studentDetails.department}
                  onChange={(e) => setStudentDetails({ ...studentDetails, department: e.target.value })}
                  placeholder="e.g. Computer Science"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">College / Institution *</label>
                <input
                  type="text"
                  className="form-control"
                  value={studentDetails.college}
                  onChange={(e) => setStudentDetails({ ...studentDetails, college: e.target.value })}
                  placeholder="e.g. Apex Institute of Technology"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Year of Study *</label>
                <input
                  type="text"
                  className="form-control"
                  value={studentDetails.year}
                  onChange={(e) => setStudentDetails({ ...studentDetails, year: e.target.value })}
                  placeholder="e.g. 3rd Year"
                  required
                />
              </div>
            </div>

            <div style={{ height: 1, backgroundColor: 'var(--surface-border)', margin: '1rem 0' }} />

            {/* Event & Template Selection */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Select Event</label>
                <select
                  className="form-control"
                  value={selectedEventId}
                  onChange={handleEventSelect}
                >
                  <option value="">-- Choose College Event --</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Certificate Template (Design)</label>
                <select
                  className="form-control"
                  value={selectedTemplateKey}
                  onChange={(e) => setSelectedTemplateKey(e.target.value)}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.template_key}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Event Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
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

            <div className="form-group">
              <label className="form-label">Custom Body Description (Optional)</label>
              <textarea
                className="form-control"
                rows={2}
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Leave blank to use default template text dynamically filled with student & event details..."
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              disabled={isGenerating}
            >
              <Sparkles size={17} />
              <span>{isGenerating ? 'Generating Credential...' : 'Generate Certificate Now'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Live Certificate Card Preview & Generated Result */}
        <div>
          {generatedResult ? (
            <div className="panel" style={{ border: '2px solid var(--success)', background: '#f0fdf4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                <CheckCircle2 size={24} color="var(--success)" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Certificate Successfully Issued!
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ID: <strong style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{generatedResult.certificate.certificate_id}</strong>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--surface-border)' }}>
                {generatedResult.qr_url && (
                  <img
                    src={`http://localhost:5000${generatedResult.qr_url}`}
                    alt="Certificate QR Code"
                    style={{ width: 85, height: 85, borderRadius: 6, border: '1px solid #e2e8f0' }}
                  />
                )}
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Official Verification QR
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.5rem' }}>
                    Tamper-proof online credential registered in college database.
                  </p>
                  <a
                    href={`/verify/${generatedResult.certificate.certificate_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                  >
                    <span>Open Verification Page</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href={`http://localhost:5000${generatedResult.download_url}`}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  download
                >
                  <Download size={16} />
                  <span>Download PDF</span>
                </a>
                <button
                  onClick={() => setGeneratedResult(null)}
                  className="btn btn-outline"
                >
                  Issue Another
                </button>
              </div>
            </div>
          ) : (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Eye size={18} color="var(--primary)" />
                  <span>Pre-Generation Visual Preview</span>
                </div>
                <span className="badge badge-info">{activeTemplate?.name}</span>
              </div>

              <div
                className="cert-preview-card"
                style={{
                  borderColor: activeTemplate?.primary_color || '#1e3a8a',
                }}
              >
                <div 
                  className="cert-preview-inner-border"
                  style={{ borderColor: activeTemplate?.accent_color || '#d97706' }}
                />

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: activeTemplate?.primary_color || '#1e3a8a' }}>
                    {studentDetails.college.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    CREDENTIAL OF ACADEMIC RECOGNITION
                  </div>
                </div>

                <div style={{ textAlign: 'center', margin: '0.25rem 0' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: activeTemplate?.primary_color || '#1e3a8a' }}>
                    {activeTemplate?.title || 'CERTIFICATE OF PARTICIPATION'}
                  </div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--text-light)', marginTop: 1 }}>
                    PROUDLY PRESENTED TO
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: activeTemplate?.accent_color || '#d97706' }}>
                    {studentDetails.name || 'Recipient Full Name'}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    Department of {studentDetails.department} ({studentDetails.year})
                  </div>
                </div>

                <div style={{ fontSize: '0.65rem', textAlign: 'center', color: '#334155', padding: '0 0.5rem' }}>
                  {customDescription || `for participating in ${eventName || 'the event'} conducted on ${eventDate}.`}
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                    <strong>ID:</strong> CERT-2026-PENDING<br />
                    <strong>Date:</strong> {issueDate}
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 100 }}>
                    <div style={{ height: 1, backgroundColor: '#94a3b8', margin: '2px 0' }} />
                    <div style={{ fontSize: '0.6rem', fontWeight: 700 }}>{issuingAuthority}</div>
                    <div style={{ fontSize: '0.5rem', color: 'var(--text-light)' }}>Authorized Signatory</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
