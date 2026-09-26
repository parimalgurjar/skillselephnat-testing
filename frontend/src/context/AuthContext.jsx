
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
} from "../services/authApi";

const AuthContext = createContext(null);

export const TOKEN_KEY = "skillselephant_token";
export const USER_KEY = "skillselephant_user";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =====================================================
     LOGOUT
  ===================================================== */

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
localStorage.removeItem(USER_KEY);

    setUser(null);
  }, []);

  /* =====================================================
     LOGIN
  ===================================================== */

  const login = useCallback(async (credentials) => {
    const response = await loginUser(credentials);

    if (
      !response?.success ||
      !response?.token ||
      !response?.user
    ) {
      throw new Error(
        response?.message || "Login failed."
      );
    }

    localStorage.setItem(
  TOKEN_KEY,
  response.token
);

localStorage.setItem(
  USER_KEY,
  JSON.stringify(response.user)
);

    setUser(response.user);

    return response;
  }, []);

  /* =====================================================
     UPDATE CURRENT USER STATE
  ===================================================== */

  const updateUser = useCallback((updatedUser) => {
    if (!updatedUser) return;

    setUser((previousUser) => {
      const newUser = {
        ...previousUser,
        ...updatedUser,
      };

     localStorage.setItem(
  USER_KEY,
  JSON.stringify(newUser)
);

      return newUser;
    });
  }, []);

  /* =====================================================
     LOAD CURRENT USER
  ===================================================== */

  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await getCurrentUser();

      if (
        response?.success &&
        response?.user
      ) {
        localStorage.setItem(
  USER_KEY,
  JSON.stringify(response.user)
);

        setUser(response.user);
      } else {
        logout();
      }
    } catch (error) {
  if (error.response?.status === 401) {
    logout();
  } else {
    console.error(
      "Failed to load current user:",
      error.message
    );
  }
} finally {
      setLoading(false);
    }
  }, [logout]);

  /* =====================================================
     INITIAL AUTH CHECK
  ===================================================== */

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  /* =====================================================
     CONTEXT VALUE
  ===================================================== */

  const value = useMemo(
    () => ({
      user,
      loading,

      isAuthenticated: Boolean(user),

      login,
      logout,

      updateUser,

      refreshUser: loadCurrentUser,
    }),
    [
      user,
      loading,
      login,
      logout,
      updateUser,
      loadCurrentUser,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/* =====================================================
   CUSTOM HOOK
===================================================== */

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
};

export default AuthContext;
