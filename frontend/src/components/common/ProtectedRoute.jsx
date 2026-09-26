import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import LoadingScreen from "./LoadingScreen";

import {
  getDashboardPath,
} from "../../utils/authRedirect";

const ProtectedRoute = ({
  children,
  allowedRoles = [],
}) => {
  const {
    user,
    loading,
  } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <LoadingScreen
        message="Checking authentication..."
      />
    );
  }

  /* ================= NOT LOGGED IN ================= */

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname +
            location.search,
        }}
      />
    );
  }

  /* ================= ROLE NOT ALLOWED ================= */

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <Navigate
        to={getDashboardPath(user.role)}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;