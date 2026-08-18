import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, FileCode2, ShieldAlert, Users, Settings, LogOut, Menu, X } from 'lucide-react';
import ComplianceTrendChart from './ComplianceTrendChart';
import TopViolationsChart from './TopViolationsChart';
import AuditReportList from './AuditReportList';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || `${API_URL}';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [overallScore, setOverallScore] = useState(100);

  useEffect(() => {
    fetch(`${API_URL}/api/dashboard/analytics/score')
      .then(res => res.json())
      .then(data => setOverallScore(data.score))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          <button className="nav-item" style={{ border: 'none', background: 'transparent', width: '100%', textAlign: 'left', fontFamily: 'inherit', fontSize: 'inherit' }} onClick={() => alert('Audit Reports view coming soon!')}>
            <FileCode2 size={18} aria-hidden="true" />
            Audit Reports
          </button>
          {user.role === 'admin' && (
            <Link to="/admin" className="nav-item">
              <Users size={18} aria-hidden="true" />
              User Management
            </Link>
          )}
          <button className="nav-item" style={{ border: 'none', background: 'transparent', width: '100%', textAlign: 'left', fontFamily: 'inherit', fontSize: 'inherit' }} onClick={() => alert('Settings coming soon!')}>
            <Settings size={18} aria-hidden="true" />
            Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user.username}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout" aria-label="Log out">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Security & Compliance Overview</h1>
        </header>

        <div className="dashboard-grid">
          <div className="glass-card score-card">
            <div className="score-info">
              <h3>Overall Compliance Score</h3>
              <p className="score-value">{overallScore}<span style={{ fontSize: '1.25rem', color: '#64748B' }}>%</span></p>
            </div>
            <div className="score-status status-good" role="status" aria-label="Score status: Healthy">
              Healthy
            </div>
          </div>

          <div className="glass-card trend-card">
            <div className="card-header">
              <h2 className="card-title">7-Day Compliance Trend</h2>
            </div>
            <ComplianceTrendChart />
          </div>

          <div className="glass-card violations-card">
            <div className="card-header">
              <h2 className="card-title">Top ADR Violations</h2>
            </div>
            <TopViolationsChart />
          </div>

          <div className="glass-card reports-card">
            <div className="card-header">
              <h2 className="card-title">Recent PR Audits</h2>
            </div>
            <AuditReportList />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

