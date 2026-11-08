import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  RefreshCw, 
  CheckCircle2, 
  Lock, 
  FileText, 
  Database, 
  Server, 
  ExternalLink,
  Search,
  Clock,
  Info
} from 'lucide-react';
import axios from 'axios';
import { getBackendURL } from '../../lib/utils';

const BACKEND_URL = getBackendURL();

const SecurityCenter = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSecurityOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('adminToken');
      const response = await axios.get(`${BACKEND_URL}/admins/security-overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (err) {
      console.error('Error fetching security overview:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized: Administrator privileges required to access Security Center.');
      } else {
        setError(err.response?.data?.detail || 'Failed to fetch security overview from backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityOverview();
  }, []);

  const controls = data?.controls || [];
  const summary = data?.summary || {
    verified_count: 0,
    needs_attention_count: 0,
    not_verified_count: 0,
    total_controls: 0
  };
  const auditChain = data?.audit_chain;

  const filteredControls = controls.filter(control => {
    const matchesFilter = filter === 'all' || 
      (filter === 'verified' && control.status === 'Verified') ||
      (filter === 'attention' && control.status === 'Needs attention') ||
      (filter === 'not_verified' && control.status === 'Not verified');

    const matchesSearch = !searchTerm || 
      control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.evidence.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Verified':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#10B981',
            fontSize: '0.8rem',
            fontWeight: 600,
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            <CheckCircle2 size={13} />
            Verified
          </span>
        );
      case 'Needs attention':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '9999px',
            background: 'rgba(245, 158, 11, 0.1)',
            color: '#F59E0B',
            fontSize: '0.8rem',
            fontWeight: 600,
            border: '1px solid rgba(245, 158, 11, 0.25)'
          }}>
            <AlertTriangle size={13} />
            Needs attention
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '9999px',
            background: 'rgba(156, 163, 175, 0.1)',
            color: '#9CA3AF',
            fontSize: '0.8rem',
            fontWeight: 600,
            border: '1px solid rgba(156, 163, 175, 0.25)'
          }}>
            <HelpCircle size={13} />
            Not verified
          </span>
        );
    }
  };

  const getEvidenceTypeBadge = (control) => {
    if (control.is_live_check) {
      return (
        <span style={{
          fontSize: '0.72rem',
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'rgba(16, 185, 129, 0.08)',
          color: '#059669',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          fontWeight: 600
        }}>
          ● Live Runtime Check
        </span>
      );
    }
    if (control.evidence_type === 'recorded_test_evidence') {
      return (
        <span style={{
          fontSize: '0.72rem',
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'rgba(79, 70, 229, 0.08)',
          color: '#4F46E5',
          border: '1px solid rgba(79, 70, 229, 0.25)',
          fontWeight: 600
        }}>
          ◈ Recorded CI Test Evidence
        </span>
      );
    }
    if (control.evidence_type === 'dependency_audit_report') {
      return (
        <span style={{
          fontSize: '0.72rem',
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'rgba(245, 158, 11, 0.08)',
          color: '#D97706',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          fontWeight: 600
        }}>
          📋 Dependency Audit Findings
        </span>
      );
    }
    return (
      <span style={{
        fontSize: '0.72rem',
        padding: '2px 8px',
        borderRadius: '4px',
        background: 'rgba(107, 114, 128, 0.08)',
        color: '#6B7280',
        border: '1px solid rgba(107, 114, 128, 0.25)',
        fontWeight: 600
      }}>
        ◌ Hosted Scope Unverified
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <ShieldCheck size={22} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary, #111827)' }}>
              Security Center
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted, #6B7280)', fontSize: '0.95rem' }}>
            Evidence-based control verification, cryptographic audit chain checks, and evaluator audit trails.
          </p>
        </div>

        <button
          onClick={fetchSecurityOverview}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            background: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--border-color, #E5E7EB)',
            color: 'var(--text-primary, #111827)',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Verifying...' : 'Re-verify Controls'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#DC2626',
          marginBottom: '2rem',
          fontSize: '0.95rem'
        }}>
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #E5E7EB)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #6B7280)', marginBottom: '0.5rem', fontWeight: 500 }}>
            Total Controls Monitored
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary, #111827)' }}>
            {summary.total_controls}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #6B7280)', marginTop: '0.25rem' }}>
            Mapped against real attack surface
          </div>
        </div>

        <div style={{
          background: 'var(--card-bg, #ffffff)',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#059669', marginBottom: '0.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} /> Verified Controls
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#059669' }}>
            {summary.verified_count}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.25rem' }}>
            Confirmed by live checks & test runs
          </div>
        </div>

        <div style={{
          background: 'var(--card-bg, #ffffff)',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#D97706', marginBottom: '0.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} /> Needs Attention
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#D97706' }}>
            {summary.needs_attention_count}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#D97706', marginTop: '0.25rem' }}>
            Supply chain & build-time toolchain
          </div>
        </div>

        <div style={{
          background: 'var(--card-bg, #ffffff)',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #E5E7EB)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #6B7280)', marginBottom: '0.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HelpCircle size={16} /> Cloud / Not Verified
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#6B7280' }}>
            {summary.not_verified_count}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #6B7280)', marginTop: '0.25rem' }}>
            Requires cloud console audit
          </div>
        </div>
      </div>

      {/* Cryptographic Audit Trail Card */}
      {auditChain && (
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #E5E7EB)',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: auditChain.verified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: auditChain.verified ? '#10B981' : '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Lock size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary, #111827)' }}>
                  Audit Log Hash-Chain Integrity
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #6B7280)' }}>
                  Administrative mutations are sealed with SHA-256 linking to the previous entry hash.
                </p>
              </div>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: auditChain.fully_verified_collection 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(245, 158, 11, 0.1)',
              color: auditChain.fully_verified_collection ? '#10B981' : '#D97706',
              fontSize: '0.85rem',
              fontWeight: 600
            }}>
              {auditChain.fully_verified_collection ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              {auditChain.fully_verified_collection
                ? 'Complete Cryptographic Chain Verified'
                : (auditChain.legacy_records_skipped > 0
                    ? `Mixed Log: ${auditChain.legacy_records_skipped} Legacy Skipped`
                    : (auditChain.is_truncated ? 'Partial Scan: Limit Reached' : 'Integrity Mismatch Detected'))}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            background: 'var(--bg-subtle, #F9FAFB)',
            padding: '1rem',
            borderRadius: '8px',
            fontSize: '0.85rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted, #6B7280)' }}>Total in DB:</span>{' '}
              <strong style={{ color: 'var(--text-primary, #111827)' }}>
                {auditChain.total_records_in_db ?? 0} records
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #6B7280)' }}>Records Scanned:</span>{' '}
              <strong style={{ color: 'var(--text-primary, #111827)' }}>
                {auditChain.records_scanned ?? 0}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #6B7280)' }}>Hash-Chained Verified:</span>{' '}
              <strong style={{ color: '#059669' }}>
                {auditChain.records_verified ?? 0}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #6B7280)' }}>Legacy Skipped:</span>{' '}
              <strong style={{ color: auditChain.legacy_records_skipped > 0 ? '#D97706' : '#111827' }}>
                {auditChain.legacy_records_skipped ?? 0}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #6B7280)' }}>Scan Coverage:</span>{' '}
              <strong style={{ color: 'var(--text-primary, #111827)' }}>
                {auditChain.complete_scan ? '100% of collection' : 'Truncated'}
              </strong>
            </div>
          </div>

          {/* Explanatory callout distinguishing scanned vs cryptographically verified */}
          <div style={{
            marginTop: '1rem',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            fontSize: '0.82rem',
            color: '#1E40AF',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#2563EB' }} />
            <div>
              <strong>Understanding Scan Coverage vs Cryptographic Verification:</strong>{' '}
              <em>Records scanned</em> reflects how many documents were retrieved and parsed. 
              <em>Hash-chained verified</em> reflects records whose cryptographic SHA-256 signatures matched the preceding block. 
              If unchained legacy records exist, the scan may be 100% complete across the collection, but the collection cannot be certified as fully cryptographically verified.
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#6B7280', fontStyle: 'italic' }}>
            Note on security boundary: Hash chaining detects client-side mutations and sequence gaps. It does not prevent a privileged database administrator with raw MongoDB access from recomputing hashes.
          </div>
        </div>
      )}

      {/* Controls List Section */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        borderRadius: '12px',
        border: '1px solid var(--border-color, #E5E7EB)',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        marginBottom: '2rem'
      }}>
        {/* Controls Filters */}
        <div style={{
          padding: '1.25rem',
          borderBottom: '1px solid var(--border-color, #E5E7EB)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Controls' },
              { id: 'verified', label: 'Verified' },
              { id: 'attention', label: 'Needs Attention' },
              { id: 'not_verified', label: 'Not Verified' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: filter === tab.id ? 'var(--primary, #2563EB)' : 'var(--bg-subtle, #F3F4F6)',
                  color: filter === tab.id ? '#ffffff' : 'var(--text-secondary, #4B5563)',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search controls or evidence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                fontSize: '0.85rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #D1D5DB)',
                background: 'var(--bg-input, #ffffff)',
                color: 'var(--text-primary, #111827)'
              }}
            />
          </div>
        </div>

        {/* Control Rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredControls.map((control, idx) => (
            <div
              key={control.id || idx}
              style={{
                padding: '1.25rem',
                borderBottom: idx === filteredControls.length - 1 ? 'none' : '1px solid var(--border-color, #F3F4F6)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--text-primary, #111827)' }}>
                      {control.name}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--bg-subtle, #F3F4F6)',
                      color: 'var(--text-secondary, #4B5563)'
                    }}>
                      {control.category}
                    </span>
                    {getEvidenceTypeBadge(control)}
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary, #4B5563)', lineHeight: 1.5 }}>
                    {control.description}
                  </p>
                </div>
                <div>
                  {getStatusBadge(control.status)}
                </div>
              </div>

              <div style={{
                marginTop: '0.5rem',
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'var(--bg-subtle, #F9FAFB)',
                border: '1px solid var(--border-color, #E5E7EB)',
                fontSize: '0.82rem',
                color: 'var(--text-muted, #4B5563)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} style={{ color: '#6B7280', flexShrink: 0 }} />
                  <span><strong>Evidence:</strong> {control.evidence}</span>
                </div>
                
                {control.is_live_check && control.last_verified ? (
                  <div style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    <span>Checked live at: {new Date(control.last_verified).toLocaleTimeString()}</span>
                  </div>
                ) : control.evidence_type === 'recorded_test_evidence' ? (
                  <div style={{ fontSize: '0.75rem', color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} />
                    <span>Recorded from CI test run</span>
                  </div>
                ) : control.evidence_type === 'dependency_audit_report' ? (
                  <div style={{ fontSize: '0.75rem', color: '#D97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} />
                    <span>Recorded from package lockfile audit</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HelpCircle size={12} />
                    <span>Pending cloud deployment review</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredControls.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
              No controls match the selected filters.
            </div>
          )}
        </div>
      </div>

      {/* Evaluator Scope & Operational Boundaries Note */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        borderRadius: '12px',
        border: '1px solid var(--border-color, #E5E7EB)',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.75rem', color: 'var(--text-primary, #111827)' }}>
          Evaluator Architecture & Boundary Notes
        </h3>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.88rem', color: 'var(--text-secondary, #4B5563)', lineHeight: 1.6 }}>
          <li>
            <strong>Token Realm Separation:</strong> Distinct 32+ character HMAC-SHA256 secrets ensure an admin token cannot authorize a client endpoint, and vice versa. Verified live at request time.
          </li>
          <li>
            <strong>Client Isolation:</strong> Database queries enforce <code>client_id</code> constraints on projects, tasks, milestones, comments, and private files. Cross-client access attempts return 404 or 401.
          </li>
          <li>
            <strong>Audit Log Integrity & Mixed Logs:</strong> Unkeyed SHA-256 hash chaining detects mutations, sequence deletions, and reordering. If unchained legacy records exist, the verifier skips them to evaluate the chained portion but marks the overall control <code>Needs attention</code> to distinguish scanned records from fully certified records.
          </li>
          <li>
            <strong>Rate Limiting Scope:</strong> In-memory sliding window operates per backend worker process. Multi-worker production clusters require Redis (<code>REDIS_URL</code>).
          </li>
          <li>
            <strong>Frontend Build Toolchain:</strong> Authoritative dependencies are locked in <code>frontend/yarn.lock</code> (CI builds with <code>yarn install --frozen-lockfile</code>). CRA toolchain (<code>react-scripts 5.0.1</code>) contains 40 transitive advisories (9 High) affecting the build environment; migration to Vite is planned.
          </li>
          <li>
            <strong>Backend Dependencies:</strong> <code>backend/requirements.txt</code> runtime dependencies (cryptography, urllib3, certifi, python-multipart, pyjwt, anyio) updated to compatible releases; 18 packages retain upstream advisories requiring staged migration.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SecurityCenter;
