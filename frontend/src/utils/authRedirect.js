export const getDashboardPath = (role) => {
  switch (role) {
    case "ADMIN":
      return "/admin";

    case "TEACHER":
      return "/teacher";

    case "STUDENT":
      return "/student";

    default:
      return "/login";
  }
};

export const isValidRolePath = (role, path) => {
  if (!path || typeof path !== "string") {
    return false;
  }

  switch (role) {
    case "ADMIN":
      return path.startsWith("/admin");

    case "TEACHER":
      return path.startsWith("/teacher");

    case "STUDENT":
      return path.startsWith("/student");

    default:
      return false;
  }
};

export const getSafeRedirectPath = (
  role,
  requestedPath
) => {
  if (
    isValidRolePath(
      role,
      requestedPath
    )
  ) {
    return requestedPath;
  }

  return getDashboardPath(role);
};