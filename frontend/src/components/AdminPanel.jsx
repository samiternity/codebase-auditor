import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Users, LayoutDashboard, LogOut, Trash2, GitBranch, CheckCircle } from 'lucide-react';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AdminPanel = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // User Management State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Repository Ingestion State
  const [repoUrl, setRepoUrl] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState(null); // null, 'success', 'error'
  const [ingestMessage, setIngestMessage] = useState('');
  const [webhookConfig, setWebhookConfig] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        setUsers(data.users);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ new_role: newRole })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to update role');
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to delete user');
      }

      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleIngestRepo = async (e) => {
    e.preventDefault();
    if (!repoUrl) return;
    
    setIngesting(true);
    setIngestStatus(null);
    setIngestMessage('');
    setWebhookConfig(null);

    try {
      const response = await fetch(`${API_URL}/api/repositories/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ github_url: repoUrl })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to start ingestion');
      }

      setIngestStatus('success');
      setIngestMessage(data.message);
      
      // Fetch webhook config after success
      fetchWebhookConfig();
      
    } catch (err) {
      setIngestStatus('error');
      setIngestMessage(err.message);
    } finally {
      setIngesting(false);
    }
  };

  const fetchWebhookConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/repositories/webhook-config`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const config = await response.json();
        setWebhookConfig(config);
      }
    } catch (err) {
      console.error("Failed to fetch webhook config", err);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <ShieldAlert size={24} color="#62b1ff" />
          <h2>Auditor Pro</h2>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item">
            <LayoutDashboard size={18} />
            Overview
          </Link>
          <Link to="/admin" className="nav-item active">
            <Users size={18} />
            User Management
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user.username}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Admin Panel</h1>
        </header>

        {/* Repository Ingestion Section */}
        <div className="glass-card" style={{ marginTop: '2rem', padding: '1.5rem' }}>
          <div className="card-header" style={{ marginBottom: '1.5rem' }}>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GitBranch size={20} color="#10b981" />
              Onboard Repository
            </h2>
          </div>
          
          <form onSubmit={handleIngestRepo} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="url" 
              placeholder="https://github.com/organization/repo" 
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '1rem'
              }}
            />
            <button 
              type="submit" 
              disabled={ingesting}
              style={{
                padding: '0.75rem 1.5rem',
                background: ingesting ? '#475569' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: ingesting ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {ingesting ? 'Starting...' : 'Ingest Repository'}
            </button>
          </form>

          {ingestStatus === 'error' && (
            <div style={{ marginTop: '1rem', color: '#f87171', padding: '0.75rem', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '8px' }}>
              Error: {ingestMessage}
            </div>
          )}

          {ingestStatus === 'success' && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', marginBottom: '1rem' }}>
                <CheckCircle size={20} />
                <span style={{ fontWeight: '600' }}>{ingestMessage}</span>
              </div>
              
              {webhookConfig && (
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <h3 style={{ color: '#60a5fa', marginBottom: '1rem', fontSize: '1.1rem' }}>Next Steps: Webhook Configuration</h3>
                  <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Go to your GitHub repository Settings &gt; Webhooks, and configure it exactly as follows:</p>
                  
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <span style={{ color: '#cbd5e1', display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Payload URL:</span>
                      <code style={{ background: '#0f172a', padding: '0.5rem', borderRadius: '4px', display: 'block', color: '#e2e8f0', userSelect: 'all' }}>
                        {API_URL}/api/webhooks/github
                      </code>
                    </div>
                    <div>
                      <span style={{ color: '#cbd5e1', display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Content Type:</span>
                      <code style={{ background: '#0f172a', padding: '0.5rem', borderRadius: '4px', display: 'block', color: '#e2e8f0', userSelect: 'all' }}>
                        {webhookConfig.content_type}
                      </code>
                    </div>
                    <div>
                      <span style={{ color: '#cbd5e1', display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Secret:</span>
                      <code style={{ background: '#0f172a', padding: '0.5rem', borderRadius: '4px', display: 'block', color: '#e2e8f0', userSelect: 'all' }}>
                        {webhookConfig.webhook_secret}
                      </code>
                    </div>
                    <div>
                      <span style={{ color: '#cbd5e1', display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Events:</span>
                      <span style={{ color: '#e2e8f0' }}>Select <strong>"Let me select individual events"</strong> and check <strong>"Pull requests"</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Management Section */}
        <div className="glass-card reports-card" style={{ marginTop: '2rem' }}>
          <div className="card-header">
            <h2 className="card-title">All Users</h2>
          </div>
          
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading users...</div>
          ) : error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#f87171' }}>Error: {error}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '1rem 0' }}>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '1rem 0', fontWeight: '500', color: '#f8fafc' }}>{u.username}</td>
                      <td style={{ color: '#cbd5e1' }}>{u.email}</td>
                      <td>
                        <select 
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={u.id === user.sub && u.role === 'admin'}
                          style={{
                            background: 'rgba(15, 23, 42, 0.6)',
                            color: '#e2e8f0',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="admin">Admin</option>
                          <option value="senior-dev">Senior Dev</option>
                          <option value="junior-dev">Junior Dev</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.id === user.sub}
                          style={{
                            background: 'transparent',
                            color: u.id === user.sub ? '#475569' : '#f87171',
                            border: 'none',
                            cursor: u.id === user.sub ? 'not-allowed' : 'pointer',
                            padding: '0.5rem'
                          }}
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
