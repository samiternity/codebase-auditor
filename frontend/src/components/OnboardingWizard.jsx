import { useState, useEffect } from 'react';
import { GitBranch, CheckCircle, Terminal } from 'lucide-react';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const OnboardingWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [repoUrl, setRepoUrl] = useState('');
  const [webhookConfig, setWebhookConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  const startIngestion = async (e) => {
    e.preventDefault();
    if (!repoUrl) return;
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/repositories/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: repoUrl })
      });
      if (!res.ok) throw new Error('Failed to start ingestion');
      
      const configRes = await fetch(`${API_URL}/api/repositories/webhook-config`);
      if (configRes.ok) {
        setWebhookConfig(await configRes.json());
      }
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const connectLogStream = () => {
    setStep(3);
    const eventSource = new EventSource(`${API_URL}/api/repositories/logs`);
    eventSource.onmessage = (event) => {
      if (event.data === "DONE") {
        eventSource.close();
        setTimeout(onComplete, 2000);
      } else {
        setLogs(prev => [...prev, event.data]);
      }
    };
    eventSource.onerror = () => {
      eventSource.close();
    };
  };

  return (
    <div className="glass-card" style={{ gridColumn: 'span 12', padding: '3rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
        {step === 1 && "Onboard Repository"}
        {step === 2 && "Configure Webhook"}
        {step === 3 && "Vectorizing..."}
      </h2>
      
      {step === 1 && (
        <form onSubmit={startIngestion} style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Enter your GitHub repository URL to begin.</p>
          <input 
            type="url" 
            placeholder="https://github.com/org/repo" 
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            required
            style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '1.1rem' }}
          />
          <button type="submit" style={{ padding: '1rem', background: 'var(--text-accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
            Start Setup
          </button>
          {error && <p style={{ color: 'var(--text-danger)' }}>{error}</p>}
        </form>
      )}

      {step === 2 && webhookConfig && (
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Add this webhook to your GitHub repository settings.</p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <p><strong>URL:</strong> <code style={{ color: 'var(--text-accent)' }}>{window.location.origin}/api/webhooks/github</code></p>
            <p><strong>Content Type:</strong> <code>{webhookConfig.content_type}</code></p>
            <p><strong>Secret:</strong> <code>{webhookConfig.webhook_secret}</code></p>
            <p><strong>Events:</strong> Pull requests</p>
          </div>
          <button onClick={connectLogStream} style={{ marginTop: '2rem', width: '100%', padding: '1rem', background: 'var(--text-accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
            I've Added the Webhook &rarr; Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
          <div style={{ background: '#000', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', height: '250px', overflowY: 'auto', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-accent)', marginBottom: '1rem' }}>
              <Terminal size={16} /> Live Ingestion Logs
            </div>
            {logs.map((log, i) => (
              <div key={i} style={{ color: '#E2E8F0', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{log}</div>
            ))}
            {logs.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>Connecting to server...</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingWizard;
