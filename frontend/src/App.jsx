import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import ReportDetail from './components/ReportDetail';
import AdminPanel from './components/AdminPanel';
import AuthProtectedRoute from './components/AuthProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/report/:id" element={<AuthProtectedRoute><ReportDetail /></AuthProtectedRoute>} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/dashboard" 
            element={
              <AuthProtectedRoute>
                <Dashboard />
              </AuthProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AuthProtectedRoute>
                <AdminPanel />
              </AuthProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

