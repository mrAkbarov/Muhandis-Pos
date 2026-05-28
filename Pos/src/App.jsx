import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AppRoutes from './routes/AppRoutes';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import { getHomePath } from './config/roles';

function AppShell() {
  return (
    <Layout>
      <AppRoutes />
    </Layout>
  );
}

export default function App() {
  const { authReady, currentUser } = useAuth();

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f2f5' }}>
        <p className="text-gray-500 text-sm">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={currentUser ? <Navigate to={getHomePath(currentUser.role)} replace /> : <Login />}
      />
      <Route
        path="/*"
        element={currentUser ? <AppShell /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
