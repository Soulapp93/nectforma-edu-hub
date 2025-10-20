import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { userRole, loading } = useCurrentUser();
  const location = useLocation();

  // Vérifier s'il y a un utilisateur démo
  const demoUser = sessionStorage.getItem('demo_user');
  let isAdmin = false;

  if (demoUser) {
    const userData = JSON.parse(demoUser);
    isAdmin = userData.role === 'Admin' || userData.role === 'AdminPrincipal';
  } else {
    isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    // Rediriger vers la page formations si l'utilisateur n'est pas admin
    return <Navigate to="/formations" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
