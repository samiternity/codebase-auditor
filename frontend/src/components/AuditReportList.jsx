import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AuditReportList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dashboard/audits`);
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error('Failed to fetch audits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAudits();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>Loading recent audits...</div>;
  }

  if (reports.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>No audits run yet. Connect your GitHub repository to trigger the first audit!</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>PR Title</th>
            <th>Repository</th>
            <th>Status</th>
            <th>Score</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const date = new Date(report.created_at).toLocaleDateString();
            return (
              <tr key={report.id}>
                <td style={{ fontWeight: 500 }}>
                  {report.pr_title || 'Untitled PR'}
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                    {report.pr_url ? (
                        <a href={report.pr_url} target="_blank" rel="noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>
                            View on GitHub
                        </a>
                    ) : (
                        `#${report.pr_id}`
                    )}
                  </div>
                </td>
                <td>{report.repo_name}</td>
                <td>
                  {report.status === 'pass' ? (
                    <span className="badge badge-pass"><CheckCircle size={14} /> Pass</span>
                  ) : (
                    <span className="badge badge-fail"><XCircle size={14} /> Fail</span>
                  )}
                </td>
                <td>
                  <span style={{ color: report.compliance_score === 100 ? '#4ADE80' : report.compliance_score >= 60 ? '#FBBF24' : '#F87171' }}>
                    {report.compliance_score}%
                  </span>
                </td>
                <td style={{ color: '#94A3B8' }}>{date}</td>
                <td>
                  <Link to={"/report/$($report.id)"} className="view-btn" style={{textDecoration: 'none', display: 'inline-block'}}>View Report</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AuditReportList;

