import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("owner" | "staff")[];
  requireRole?: boolean;
}

const ProtectedRoute = ({ children, allowedRoles, requireRole = true }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated but has no membership yet → onboarding
  if (requireRole && !role) {
    return <Navigate to="/onboarding" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Staff trying to access admin → redirect to staff panel
    if (role === "staff") return <Navigate to="/staff" replace />;
    // Owner trying to access staff-only → redirect to admin
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
