import { apiRequest } from "./api.js";
import { ROUTES } from "./config.js";

export async function logout(redirectTo = ROUTES.home) {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } catch {
    // ignore
  } finally {
    localStorage.removeItem("aidloop_admin_email");
    localStorage.removeItem("aidloop_organizer_email");
    localStorage.removeItem("aidloop_volunteer_email");
    sessionStorage.removeItem("aidloop_pending_verification_email");
    window.location.href = redirectTo;
  }
}
