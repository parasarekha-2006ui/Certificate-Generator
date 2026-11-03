import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle, 
  Search, 
  Calendar, 
  User, 
  Award, 
  GraduationCap, 
  Building2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { verifyService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function VerifyPage() {
  const { certificateId } = useParams();
  const [searchId, setSearchId] = useState(certificateId || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (certificateId) {
      setSearchId(certificateId);
      performVerification(certificateId);
    }
  }, [certificateId]);

  const performVerification = async (idToVerify) => {
    const cleanId = (idToVerify || '').trim();
    if (!cleanId) return;

    setLoading(true);
    setSearched(true);
    setResult(null);

    try {
      const data = await verifyService.verify(cleanId);
      setResult(data);
    } catch (err) {
      if (err.response?.data) {
        setResult(err.response.data);
      } else {
        setResult({
          status: 'Not found',
          valid: false,
          message: `Unable to find certificate record for '${cleanId}'.`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/verify/${searchId.trim()}`);
    }
  };

  return (
    <div className="verify-wrapper">
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{
          width: 58,
          height: 58,
          margin: '0 auto 1rem',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 8px 20px rgba(30, 58, 138, 0.25)'
        }}>
          <GraduationCap size={32} />
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Official Certificate Verification Portal
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.35rem', maxWidth: 520 }}>
          Public authentication registry for academic credentials issued by Apex Institute of Technology & Research.
        </p>
      </div>

      <div className="verify-card">
        {/* Search bar inside card */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface)' }}>
          <form onSubmit={handleSearchSubmit}>
            <label className="form-label">Enter Certificate ID to Verify</label>
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search 
                  size={18} 
                  color="var(--text-light)" 
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} 
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. CERT-2026-XXXXXX"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  style={{ paddingLeft: '2.5rem', fontFamily: 'monospace', textTransform: 'uppercase' }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <span>{loading ? 'Verifying...' : 'Verify Now'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Verification Result Output */}
        <div style={{ padding: '2rem' }}>
          {loading ? (
            <LoadingSpinner text="Querying digital certificate registry..." />
          ) : !searched ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={48} color="var(--primary)" style={{ opacity: 0.4, margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: 600 }}>Enter a Certificate ID or scan a QR code</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.35rem' }}>
                All official certificates contain a unique tamper-evident verification identifier.
              </p>
            </div>
          ) : result?.status === 'Valid' ? (
            <div>
              {/* VALID BADGE BANNER */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                backgroundColor: 'var(--success-bg)',
                border: '1px solid #86efac',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.75rem'
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: 'var(--success)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <div style={{ color: '#047857', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                    OFFICIALLY VERIFIED & VALID CREDENTIAL
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#065f46' }}>
                    This academic document is genuine and authenticated in the college database registry.
                  </div>
                </div>
              </div>

              {/* DETAILS GRID - PUBLIC SAFE DATA ONLY */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>
                    Certificate ID
                  </span>
                  <div style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)', fontSize: '1.05rem', marginTop: 2 }}>
                    {result.certificate.certificate_id}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>
                    Status
                  </span>
                  <div>
                    <span className="badge badge-success" style={{ marginTop: 2 }}>
                      <CheckCircle2 size={13} />
                      {result.certificate.status}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>
                    Student Recipient
                  </span>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem', marginTop: 2 }}>
                    {result.certificate.student_name}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>
                    Certificate Type
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>
                    {result.certificate.certificate_type}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>
                    Event Name
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>
                    {result.certificate.event_name}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>
                    Date of Issue
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>
                    {result.certificate.issue_date}
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>
                    Issuing Authority
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>
                    {result.certificate.issuing_authority}
                  </div>
                </div>
              </div>
            </div>
          ) : result?.status === 'Revoked' ? (
            <div>
              {/* REVOKED BANNER */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid #fca5a5',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.75rem'
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: 'var(--danger)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <div style={{ color: '#991b1b', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                    CERTIFICATE REVOKED • NO LONGER VALID
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>
                    This credential was officially revoked by the college administration on {result.certificate?.revoked_at || 'record'}.
                  </div>
                </div>
              </div>

              {result.certificate && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', opacity: 0.85 }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)' }}>CERTIFICATE ID</span>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{result.certificate.certificate_id}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)' }}>RECIPIENT</span>
                    <div style={{ fontWeight: 700 }}>{result.certificate.student_name}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)' }}>EVENT</span>
                    <div>{result.certificate.event_name}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)' }}>ISSUE DATE</span>
                    <div>{result.certificate.issue_date}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem 1rem',
              backgroundColor: 'var(--warning-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #fde68a'
            }}>
              <AlertCircle size={40} color="var(--warning)" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#92400e', marginBottom: '0.35rem' }}>
                Certificate Not Found
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#b45309', maxWidth: 460, margin: '0 auto' }}>
                No registered academic certificate exists with ID <strong>'{searchId}'</strong>. Please check for spelling mistakes or contact the issuing college authority.
              </p>
            </div>
          )}
        </div>

        {/* Footer privacy pledge */}
        <div style={{
          backgroundColor: 'var(--background)',
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--surface-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            🔒 Privacy Guarantee: Student emails, phone numbers, and private data are never displayed.
          </div>
          <Link to="/login" style={{ color: 'var(--secondary)', fontWeight: 600 }}>
            Admin Portal Login &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
