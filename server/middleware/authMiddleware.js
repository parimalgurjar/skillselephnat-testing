const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* =====================================================
   PROTECT ROUTE
   Checks JWT token and authenticated user
===================================================== */

const protect = async (req, res, next) => {
  try {
    /* ================= CONFIGURATION CHECK ================= */
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in environment variables");

      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error",
      });
    }

    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select(
      "-password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    /* ================= ACCOUNT STATUS CHECK ================= */

    if (!user.isActive || user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is not active. Please contact the administrator.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
  console.error("Auth Middleware Error:", error.message);

  if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError"
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Authentication service error",
  });
}
};

/* =====================================================
   AUTHORIZE ROLES
   Restricts route access based on user role
===================================================== */

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to perform this action",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
  authorize: authorizeRoles,
};