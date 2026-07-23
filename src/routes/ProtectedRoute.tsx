import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, sessionExpired } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ sessionExpired }} />;
  }

  return <Outlet />;
}
