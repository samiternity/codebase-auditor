import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ReportDetail from './components/ReportDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/report/:id" element={<ReportDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

