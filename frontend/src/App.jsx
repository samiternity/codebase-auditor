import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import ReportDetail from './components/ReportDetail';
import AuthProtectedRoute from './components/AuthProtectedRoute';

import { useEffect, useContext, useState } from 'react';
import { AuthContext } from './context/AuthContext';

const LoginSuccess = () => {
  const { setUser } = useContext(AuthContext);

  const [debugMsg, setDebugMsg] = useState('Parsing URL...');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlUsername = urlParams.get('username');

    if (urlToken && urlUsername) {
      setDebugMsg(`Success! Found token for ${urlUsername}. Redirecting...`);
      localStorage.setItem('token', urlToken);
      const userObj = { username: urlUsername, role: 'admin' };
      localStorage.setItem('user', JSON.stringify(userObj));
      setUser(userObj);
      
      setTimeout(() => {
        window.history.replaceState({}, document.title, '/dashboard');
        window.location.reload(); 
      }, 1500);
    } else {
      setDebugMsg(`Error: Missing token or username in URL. Search: ${window.location.search}`);
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    }
  }, [setUser]);

  return <div style={{ padding: '2rem', color: '#E2E8F0', textAlign: 'center' }}>{debugMsg}</div>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/success" element={<LoginSuccess />} />
          <Route path="/report/:id" element={<AuthProtectedRoute><ReportDetail /></AuthProtectedRoute>} />
          <Route path="/dashboard" element={<AuthProtectedRoute><Dashboard /></AuthProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

