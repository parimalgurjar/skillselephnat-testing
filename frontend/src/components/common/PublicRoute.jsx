import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import LoadingScreen from "./LoadingScreen";

import {
  getDashboardPath,
  getSafeRedirectPath,
} from "../../utils/authRedirect";

const PublicRoute = ({ children }) => {
  const {
    user,
    loading,
  } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <LoadingScreen message="Loading..." />
    );
  }

  if (user) {
    const from = location.state?.from;

    const redirectPath = from
      ? getSafeRedirectPath(
          user.role,
          from
        )
      : getDashboardPath(user.role);

    return (
      <Navigate
        to={redirectPath}
        replace
      />
    );
  }

  return children;
};

export default PublicRoute;