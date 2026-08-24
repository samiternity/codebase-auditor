import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const ReportDetail = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReauditing, setIsReauditing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/audits/${id}`);
      if (!response.ok) throw new Error('Report not found');
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleReAudit = async () => {
    if (!report || !report.pr_id) return;
    setIsReauditing(true);
    try {
      const res = await fetch(`${API_URL}/api/webhooks/re-audit/${report.pr_id}`, { method: 'POST' });
      if (!res.ok) throw new Error('Re-audit failed');
      await fetchReport(); // Refresh report data
    } catch (err) {
      alert(err.message);
    } finally {
      setIsReauditing(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading report...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'var(--text-danger)' }}>Error: {error}</div>;
  if (!report) return null;

  const violations = report.violations ? JSON.parse(report.violations) : [];

  return (
    <div className="dashboard-layout">
      <main className="dashboard-main">
        <header className="dashboard-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-accent)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h1>Audit Report: {report.pr_title || `PR #${report.pr_id}`}</h1>
              <button 
                onClick={handleReAudit} 
                disabled={isReauditing}
                className="view-btn"
                style={{ opacity: isReauditing ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {isReauditing ? 'Re-auditing...' : 'Re-Audit'}
              </button>
            </div>
            {report.status === 'pass' ? (
              <span className="badge badge-pass" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}><CheckCircle size={18} /> Compliant</span>
            ) : (
              <span className="badge badge-fail" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}><XCircle size={18} /> Non-Compliant</span>
            )}
          </div>
        </header>

        <div className="dashboard-grid">
          <div className="glass-card" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-title" style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Repository Info</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>Repository</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{report.repo_name}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>Score</p>
                <p style={{ margin: 0, fontWeight: 500, color: report.compliance_score === 100 ? 'var(--status-good-text)' : 'var(--status-fail-text)' }}>
                  {report.compliance_score}%
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>Date Audited</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{new Date(report.created_at).toLocaleString()}</p>
              </div>
            </div>
            
            {report.pr_url && (
              <a href={report.pr_url} target="_blank" rel="noreferrer" className="view-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                View Original PR on GitHub
              </a>
            )}
          </div>

          <div className="glass-card" style={{ gridColumn: 'span 12' }}>
            <div className="card-header">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} color="var(--text-danger)" /> 
                Violations Found ({violations.length})
              </h2>
            </div>
            
            {violations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--hover-subtle)', borderRadius: '8px' }}>
                <CheckCircle size={48} color="var(--status-good-text)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                <p>No architectural violations detected! This code adheres to all known ADRs.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {violations.map((v, i) => (
                  <div key={i} style={{ padding: '1rem', background: 'var(--status-fail-bg)', borderLeft: '4px solid var(--text-danger)', borderRadius: '4px' }}>
                    <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: '500' }}>
                      {typeof v === 'string' ? v : v.message}
                    </p>
                    {typeof v === 'object' && v.file && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                        In <code>{v.file}</code> {v.line && `at line ${v.line}`}
                      </p>
                    )}
                    {typeof v === 'object' && v.snippet && (
                      <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem', color: '#E2E8F0', marginTop: '0.5rem', overflowX: 'auto', fontFamily: 'var(--font-mono)' }}>
                        {v.snippet}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {report.suggested_fix && (
            <div className="glass-card" style={{ gridColumn: 'span 12' }}>
               <div className="card-header">
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lightbulb size={20} color="#FBBF24" /> 
                  Suggested Remediation
                </h2>
              </div>
              <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: 'var(--text-secondary)', margin: 0 }}>
                  {report.suggested_fix}
                </pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportDetail;
