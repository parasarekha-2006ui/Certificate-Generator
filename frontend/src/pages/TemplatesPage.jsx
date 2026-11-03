import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Upload, 
  Save, 
  Image as ImageIcon, 
  Check, 
  Sparkles, 
  Eye, 
  Award,
  Layers,
  RotateCcw
} from 'lucide-react';
import { templateService, certificateService } from '../services/api';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Customization fields
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1e3a8a');
  const [secondaryColor, setSecondaryColor] = useState('#6366f1');
  const [accentColor, setAccentColor] = useState('#d97706');

  // Uploaded assets
  const [collegeLogo, setCollegeLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [signature, setSignature] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState('');

  const { addToast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await templateService.getAll();
      if (res.success && res.templates) {
        setTemplates(res.templates);
        if (res.templates.length > 0) {
          selectTemplate(res.templates[0]);
        }
      }
    } catch (err) {
      addToast('Failed to load templates.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setEditTitle(tpl.title);
    setEditBody(tpl.default_body);
    setPrimaryColor(tpl.primary_color || '#1e3a8a');
    setSecondaryColor(tpl.secondary_color || '#6366f1');
    setAccentColor(tpl.accent_color || '#d97706');
  };

  const handleInsertTag = (tag) => {
    setEditBody((prev) => prev + ' ' + tag);
  };

  const handleAssetUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type and size
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      addToast('Only PNG and JPG/JPEG image formats are allowed.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('Image size cannot exceed 5MB.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    setIsUploading(true);
    try {
      const res = await templateService.uploadAsset(formData);
      if (res.success) {
        if (type === 'logo') {
          setCollegeLogo(res.filename);
          setLogoPreview(certificateService.getUploadUrl(res.filename));
          addToast('College logo uploaded successfully!', 'success');
        } else {
          setSignature(res.filename);
          setSignaturePreview(certificateService.getUploadUrl(res.filename));
          addToast('Signature uploaded successfully!', 'success');
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error uploading asset.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    setIsSaving(true);
    try {
      const res = await templateService.update(selectedTemplate.id, {
        title: editTitle,
        default_body: editBody,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
      });
      if (res.success) {
        addToast(`Template '${selectedTemplate.name}' saved successfully!`, 'success');
        // Update in list
        setTemplates((prev) =>
          prev.map((t) => (t.id === selectedTemplate.id ? res.template : t))
        );
        setSelectedTemplate(res.template);
      }
    } catch (err) {
      addToast('Failed to save template changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading certificate templates..." />;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Certificate Design Templates</h1>
          <p className="page-desc">Preview all 7 specialized credential designs, adjust visual typography, colors, and upload institutional seals.</p>
        </div>
        <button
          onClick={handleSaveTemplate}
          className="btn btn-primary"
          disabled={isSaving}
        >
          <Save size={16} />
          <span>{isSaving ? 'Saving...' : 'Save Template Customizations'}</span>
        </button>
      </div>

      {/* 7 Template Switcher Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.75rem',
        marginBottom: '1.5rem',
      }}>
        {templates.map((tpl) => {
          const isSelected = selectedTemplate?.id === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => selectTemplate(tpl)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                color: isSelected ? 'white' : 'var(--text-main)',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--surface-border)'}`,
                boxShadow: isSelected ? '0 4px 12px rgba(30, 58, 138, 0.2)' : 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
              }}
            >
              <div 
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: tpl.primary_color || '#1e3a8a',
                  border: '1px solid white'
                }}
              />
              <span>{tpl.name}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.25fr) minmax(320px, 0.95fr)', gap: '1.75rem', alignItems: 'start' }}>
        {/* Left Column: Live Interactive A4 Certificate Preview */}
        <div className="panel" style={{ position: 'sticky', top: '85px' }}>
          <div className="panel-header">
            <div className="panel-title">
              <Eye size={18} color="var(--primary)" />
              <span>Live Print Preview (Landscape A4)</span>
            </div>
            <span className="badge badge-purple" style={{ textTransform: 'uppercase' }}>
              {selectedTemplate?.template_key}
            </span>
          </div>

          <div
            className="cert-preview-card"
            style={{
              borderColor: primaryColor,
              backgroundColor: '#ffffff',
            }}
          >
            {/* Inner accent border */}
            <div 
              className="cert-preview-inner-border"
              style={{ borderColor: accentColor }}
            />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', textAlign: 'center' }}>
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="College Logo" 
                  style={{ position: 'absolute', left: 0, top: 0, width: 44, height: 44, objectFit: 'contain' }}
                />
              ) : (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: primaryColor,
                  border: `2px solid ${accentColor}`,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 800
                }}>
                  COL
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: primaryColor, letterSpacing: '0.05em' }}>
                  APEX INSTITUTE OF TECHNOLOGY & RESEARCH
                </div>
                <div style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: 1 }}>
                  AFFILIATED TO STATE TECHNOLOGICAL UNIVERSITY • ACCREDITED EXCELLENCE
                </div>
              </div>
            </div>

            {/* Title Section */}
            <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
              <div style={{
                height: 1,
                background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                margin: '0.25rem 0'
              }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {editTitle || 'CERTIFICATE OF RECOGNITION'}
              </div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-light)', letterSpacing: '0.1em', marginTop: 2 }}>
                THIS CERTIFICATE IS PROUDLY PRESENTED TO
              </div>
            </div>

            {/* Recipient Name */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: accentColor, letterSpacing: '-0.01em' }}>
                Aarav Patel
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Department of Computer Science and Engineering (3rd Year)
              </div>
            </div>

            {/* Body Text */}
            <div style={{
              textAlign: 'center',
              fontSize: '0.68rem',
              lineHeight: 1.5,
              color: '#334155',
              padding: '0 1rem',
              maxHeight: 65,
              overflow: 'hidden'
            }}>
              {editBody
                .replace('{student_name}', 'Aarav Patel')
                .replace('{college_name}', 'Apex Institute of Technology')
                .replace('{department}', 'Computer Science and Engineering')
                .replace('{year}', '3rd Year')
                .replace('{event_name}', 'Annual Tech Symposium & Hackathon 2026')
                .replace('{event_date}', 'March 15, 2026')}
            </div>

            {/* Footer Section */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
              {/* QR Code Demo Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  backgroundColor: '#0f172a',
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.5rem',
                  fontWeight: 700
                }}>
                  QR VERIFY
                </div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-light)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>ID: CERT-2026-DEMO</div>
                  <div>Scan to verify</div>
                </div>
              </div>

              {/* Center Seal */}
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: `2px dashed ${accentColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.45rem',
                fontWeight: 800,
                color: primaryColor,
                textAlign: 'center'
              }}>
                SEAL OF AUTHENTIC
              </div>

              {/* Signature */}
              <div style={{ textAlign: 'center', minWidth: 120 }}>
                {signaturePreview ? (
                  <img 
                    src={signaturePreview} 
                    alt="Signature" 
                    style={{ height: 28, objectFit: 'contain', margin: '0 auto' }} 
                  />
                ) : (
                  <div style={{ fontFamily: 'cursive', fontSize: '0.9rem', color: '#1e293b' }}>
                    Dr. R. K. Sharma
                  </div>
                )}
                <div style={{ height: 1, backgroundColor: '#94a3b8', margin: '2px 0' }} />
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Dean of Academic Affairs
                </div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-light)' }}>
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customization Controls */}
        <div>
          <div className="panel">
            <div className="panel-title" style={{ marginBottom: '1.25rem' }}>
              <Palette size={18} color="var(--secondary)" />
              <span>Customize Template: {selectedTemplate?.name}</span>
            </div>

            <div className="form-group">
              <label className="form-label">Certificate Title Header</label>
              <input
                type="text"
                className="form-control"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. CERTIFICATE OF PARTICIPATION"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Certificate Body Paragraph</label>
              <textarea
                className="form-control"
                rows={4}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                placeholder="Template text with dynamic replacement tags..."
              />
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.35rem' }}>
                  Click to insert variables:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {['{student_name}', '{college_name}', '{department}', '{year}', '{event_name}', '{event_date}'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertTag(tag)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Primary Border & Title</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Accent Name Highlight</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Asset Upload Panel */}
          <div className="panel">
            <div className="panel-title" style={{ marginBottom: '1.25rem' }}>
              <ImageIcon size={18} color="var(--primary)" />
              <span>Institutional Branding & Signatures</span>
            </div>

            <div className="form-row">
              {/* College Logo */}
              <div className="form-group">
                <label className="form-label">College Seal / Logo (PNG/JPG)</label>
                <label 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.25rem',
                    border: '2px dashed var(--surface-border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    backgroundColor: 'var(--background)'
                  }}
                >
                  <Upload size={22} color="var(--text-light)" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginTop: '0.4rem' }}>
                    {collegeLogo ? 'Replace Logo' : 'Upload College Logo'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Max 5MB • PNG / JPG
                  </span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    style={{ display: 'none' }}
                    onChange={(e) => handleAssetUpload(e, 'logo')}
                    disabled={isUploading}
                  />
                </label>
              </div>

              {/* Signature Image */}
              <div className="form-group">
                <label className="form-label">Dean Signature (PNG/JPG)</label>
                <label 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.25rem',
                    border: '2px dashed var(--surface-border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    backgroundColor: 'var(--background)'
                  }}
                >
                  <Upload size={22} color="var(--text-light)" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--secondary)', marginTop: '0.4rem' }}>
                    {signature ? 'Replace Signature' : 'Upload Authority Signature'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Max 5MB • PNG / JPG
                  </span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    style={{ display: 'none' }}
                    onChange={(e) => handleAssetUpload(e, 'signature')}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
