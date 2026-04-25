import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar      from './components/Navbar';
import Landing     from './pages/Landing';
import Auth        from './pages/Auth';
import Dashboard   from './pages/Dashboard';
import JourneyMap  from './pages/JourneyMap';
import Challenge   from './pages/Challenge';
import Profile     from './pages/Profile';
import Certificate from './pages/Certificate';
import Learn       from './pages/Learn';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="spinner" style={{ width:32, height:32, borderWidth:3 }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function AppInner() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"              element={<Landing />} />
        <Route path="/login"         element={<Auth />} />
        <Route path="/signup"        element={<Auth />} />
        <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/journey"       element={<ProtectedRoute><JourneyMap /></ProtectedRoute>} />
        <Route path="/challenge/:id" element={<ProtectedRoute><Challenge /></ProtectedRoute>} />
        <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/certificate"   element={<ProtectedRoute><Certificate /></ProtectedRoute>} />
        <Route path="/learn"         element={<ProtectedRoute><Learn /></ProtectedRoute>} />
        <Route path="*"              element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </AuthProvider>
  );
}
