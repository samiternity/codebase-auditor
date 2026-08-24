import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, FileCode2, ShieldAlert, Settings, Menu, X } from 'lucide-react';
import ComplianceTrendChart from './ComplianceTrendChart';
import TopViolationsChart from './TopViolationsChart';
import AuditReportList from './AuditReportList';
import RepoOnboardingCard from './RepoOnboardingCard';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [overallScore, setOverallScore] = useState(100);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    // Check if system is onboarded
    fetch(`${API_URL}/api/dashboard/system/status`)
      .then(res => res.json())
      .then(data => setIsOnboarded(data.is_onboarded))
      .catch(err => {
        console.error(err);
        setIsOnboarded(false);
      });

    // Fetch score
    fetch(`${API_URL}/api/dashboard/analytics/score`)
      .then(res => res.json())
      .then(data => setOverallScore(data.score))
      .catch(console.error);
  }, []);

  return (
    <div className="dashboard-layout">
      {/* Mobile Header & Hamburger */}
      <div className="mobile-header">
        <div className="sidebar-header" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
          <ShieldAlert size={24} color="#62b1ff" aria-hidden="true" />
          <h2>Auditor Pro</h2>
        </div>
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''}`}
        aria-label="Main Navigation"
      >
        <div className="sidebar-header desktop-only">
          <ShieldAlert size={24} color="#62b1ff" aria-hidden="true" />
          <h2>Auditor Pro</h2>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active" aria-current="page">
            <LayoutDashboard size={18} aria-hidden="true" />
            Overview
          </Link>
          <button className="nav-item btn-reset" onClick={() => alert('Audit Reports view coming soon!')}>
            <FileCode2 size={18} aria-hidden="true" />
            Audit Reports
          </button>
          <button className="nav-item btn-reset" onClick={() => alert('Settings coming soon!')}>
            <Settings size={18} aria-hidden="true" />
            Settings
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Security & Compliance Overview</h1>
        </header>

        <div className="dashboard-grid">
          <RepoOnboardingCard />
          <div className="glass-card score-card">
            <div className="score-info">
              <h3>Overall Compliance Score</h3>
              {!isOnboarded ? (
                <div className="skeleton skeleton-score" style={{ marginTop: '0.5rem' }}></div>
              ) : (
                <p className="score-value">{overallScore}<span style={{ fontSize: '1.25rem', color: '#64748B' }}>%</span></p>
              )}
            </div>
            {!isOnboarded ? (
              <div className="skeleton" style={{ width: '80px', height: '30px', borderRadius: '15px' }}></div>
            ) : (
              <div className="score-status status-good" role="status" aria-label="Score status: Healthy">
                Healthy
              </div>
            )}
          </div>

          <div className="glass-card trend-card">
            <div className="card-header">
              <h2 className="card-title">7-Day Compliance Trend</h2>
            </div>
            <ComplianceTrendChart isOnboarded={isOnboarded} />
          </div>

          <div className="glass-card violations-card">
            <div className="card-header">
              <h2 className="card-title">Top ADR Violations</h2>
            </div>
            <TopViolationsChart isOnboarded={isOnboarded} />
          </div>

          <div className="glass-card reports-card">
            <div className="card-header">
              <h2 className="card-title">Recent PR Audits</h2>
            </div>
            <AuditReportList isOnboarded={isOnboarded} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

