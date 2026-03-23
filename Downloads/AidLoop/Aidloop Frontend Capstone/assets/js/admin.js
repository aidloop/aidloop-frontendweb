import { getCurrentUser } from "./auth.js";

export async function hydrateAdminHeader({
  nameSelector = "#adminName",
  roleSelector = "#adminRole",
  avatarSelector = "#adminAvatar"
} = {}) {
  const nameEl = document.querySelector(nameSelector);
  const roleEl = document.querySelector(roleSelector);
  const avatarEl = document.querySelector(avatarSelector);

  try {
    const profile = await getCurrentUser();

    if (nameEl) {
      nameEl.textContent = profile.fullName || profile.name || "Admin";
    }

    if (roleEl) {
      roleEl.textContent = profile.role
        ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
        : "Admin";
    }

    if (avatarEl && profile.profileImage) {
      avatarEl.src = profile.profileImage;
    }

    return profile;
  } catch (error) {
    console.error("Failed to load admin header:", error.message);
    return null;
  }
}