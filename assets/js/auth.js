import { apiRequest } from "./api.js";
import { ROUTES } from "./config.js";

export async function getCurrentUser() {
  try {
    return await apiRequest("/users/me");
  } catch {
    return await apiRequest("/user/me");
  }
}

export async function requireRole(role, redirectTo) {
  try {
    const user = await getCurrentUser();
    if (String(user.role || "").toLowerCase() !== String(role).toLowerCase()) {
      window.location.href = redirectTo;
      return null;
    }
    return user;
  } catch {
    window.location.href = redirectTo;
    return null;
  }
}

export const requireAdmin = () => requireRole("admin", ROUTES.adminLogin);
export const requireOrganizer = () => requireRole("organizer", ROUTES.organizerLogin);
