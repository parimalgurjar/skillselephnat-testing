import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RoleRoute = ({ allowedRoles = [] }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasPermission = allowedRoles.includes(user.role);

  if (!hasPermission) {
    if (user.role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    }

    if (user.role === "TEACHER") {
      return <Navigate to="/teacher" replace />;
    }

    if (user.role === "STUDENT") {
      return <Navigate to="/student" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;