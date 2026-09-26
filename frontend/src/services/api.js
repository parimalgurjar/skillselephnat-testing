import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const TOKEN_KEY = "skillselephant_token";
const USER_KEY = "skillselephant_user";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

/* =====================================================
   REQUEST INTERCEPTOR
===================================================== */

api.interceptors.request.use(
  (config) => {
   const token = localStorage.getItem(
  TOKEN_KEY
);

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error)
);

/* =====================================================
   RESPONSE INTERCEPTOR
===================================================== */

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error.response?.status;

    const requestUrl =
      error.config?.url || "";

    /* ===============================================
       TIMEOUT / NETWORK FAILURE
    =============================================== */

    if (error.code === "ECONNABORTED") {
      error.userMessage =
        "Server is taking too long to respond. Please try again.";
    }

    /* ===============================================
       UNAUTHORIZED AUTHENTICATION FAILURE
    =============================================== */

    if (status === 401) {
      /*
        Login itself can legitimately return 401 when
        credentials are incorrect.

        Do not redirect/reload in that case.
      */

      const isLoginRequest =
        requestUrl.includes("/auth/login");

      if (!isLoginRequest) {
        /*
          Clear persistent authentication data.
        */

      localStorage.removeItem(TOKEN_KEY);
localStorage.removeItem(USER_KEY);

        /*
          AuthContext stores the authenticated user
          in React memory.

          Reloading through /login causes the app
          to mount again and initialize correctly.
        */

        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.replace("/login");
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;