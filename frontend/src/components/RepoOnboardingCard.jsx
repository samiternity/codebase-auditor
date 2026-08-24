import { useState } from 'react';
import { GitBranch, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const RepoOnboardingCard = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState(null); // null, 'success', 'error'
  const [ingestMessage, setIngestMessage] = useState('');
  const [webhookConfig, setWebhookConfig] = useState(null);

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
          'Content-Type': 'application/json'
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
      const response = await fetch(`${API_URL}/api/repositories/webhook-config`);
      if (response.ok) {
        const config = await response.json();
        setWebhookConfig(config);
      }
    } catch (err) {
      console.error("Failed to fetch webhook config", err);
    }
  };

  return (
    <div className="glass-card" style={{ gridColumn: 'span 12' }}>
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
                    {window.location.origin}/api/webhooks/github
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
  );
};

export default RepoOnboardingCard;
