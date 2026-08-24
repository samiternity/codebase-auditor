import React from 'react';
import { ShieldAlert, Github } from 'lucide-react';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const LoginPage = () => {
  const handleGithubLogin = () => {
    window.location.href = `${API_URL}/api/auth/github/login`;
  };

  return (
    <div className="dashboard-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <ShieldAlert size={48} color="#22C55E" />
        </div>
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Auditor Pro</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>Enterprise codebase compliance</p>
        
        <button 
          onClick={handleGithubLogin}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '1rem',
            background: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Github size={20} />
          Continue with GitHub
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
