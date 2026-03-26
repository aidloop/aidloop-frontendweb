const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const els = {
  adminAvatar: document.getElementById("adminAvatar"),
  adminNameMini: document.getElementById("adminNameMini"),
  adminRoleMini: document.getElementById("adminRoleMini"),
  fullName: document.getElementById("fullName"),
  emailAddress: document.getElementById("emailAddress"),
  role: document.getElementById("role"),
  phoneNumber: document.getElementById("phoneNumber"),
  editProfileBtn: document.getElementById("editProfileBtn"),
  profileFeedback: document.getElementById("profileFeedback"),
  currentPassword: document.getElementById("currentPassword"),
  newPassword: document.getElementById("newPassword"),
  confirmPassword: document.getElementById("confirmPassword"),
  passwordForm: document.getElementById("passwordForm"),
  passwordFeedback: document.getElementById("passwordFeedback"),
  logoutBtn: document.getElementById("logoutBtn"),
  logoutModal: document.getElementById("logoutModal"),
  closeLogoutModal: document.getElementById("closeLogoutModal"),
  cancelLogout: document.getElementById("cancelLogout"),
  confirmLogout: document.getElementById("confirmLogout")
};

let profileEditMode = false;
let currentAdmin = null;

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      (data && data.message) ||
      (data && data.error) ||
      "Request failed"
    );
  }

  return data;
}

function setFeedback(element, message, type = "") {
  element.textContent = message;
  element.className = "feedback";
  if (type) {
    element.classList.add(type);
  }
}

function fillProfile(profile) {
  currentAdmin = profile;

  const fullName = profile.fullName || profile.name || "Admin User";
  const role = profile.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "Admin";

  els.adminNameMini.textContent = fullName;
  els.adminRoleMini.textContent = role;

  els.fullName.value = fullName;
  els.emailAddress.value = profile.email || "";
  els.role.value = role;
  els.phoneNumber.value = profile.phoneNumber || profile.phone || "";

  if (profile.profileImage) {
    els.adminAvatar.src = profile.profileImage;
  }
}

function setProfileInputsReadonly(readonly) {
  els.phoneNumber.readOnly = readonly;
}

function toggleProfileEditMode(forceValue = null) {
  profileEditMode = forceValue !== null ? forceValue : !profileEditMode;
  setProfileInputsReadonly(!profileEditMode);
  els.editProfileBtn.textContent = profileEditMode ? "Save Profile" : "Edit Profile";
}

async function loadAdminProfile() {
  try {
    let profile;
    try {
      profile = await apiRequest("/users/me");
    } catch {
      profile = await apiRequest("/user/me");
    }

    fillProfile(profile);
    toggleProfileEditMode(false);
  } catch (error) {
    setFeedback(els.profileFeedback, error.message || "Failed to load profile.", "error");
  }
}

async function saveProfile() {
  try {
    els.editProfileBtn.disabled = true;

    const updated = await apiRequest("/user/me", {
      method: "PUT",
      body: JSON.stringify({
        phoneNumber: els.phoneNumber.value.trim()
      })
    });

    fillProfile({
      ...currentAdmin,
      ...updated,
      phoneNumber: updated.phoneNumber || els.phoneNumber.value.trim()
    });

    toggleProfileEditMode(false);
    setFeedback(els.profileFeedback, "Profile updated successfully.", "success");
  } catch (error) {
    setFeedback(els.profileFeedback, error.message || "Failed to update profile.", "error");
  } finally {
    els.editProfileBtn.disabled = false;
  }
}

function handleEditProfile() {
  setFeedback(els.profileFeedback, "");
  if (!profileEditMode) {
    toggleProfileEditMode(true);
    return;
  }
  saveProfile();
}

function handlePasswordSubmit(event) {
  event.preventDefault();

  const currentPassword = els.currentPassword.value.trim();
  const newPassword = els.newPassword.value.trim();
  const confirmPassword = els.confirmPassword.value.trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    setFeedback(els.passwordFeedback, "All password fields are required.", "error");
    return;
  }

  if (newPassword !== confirmPassword) {
    setFeedback(els.passwordFeedback, "New passwords do not match.", "error");
    return;
  }

  setFeedback(
    els.passwordFeedback,
    "No admin change-password endpoint has been provided yet.",
    "error"
  );
}

function openLogoutModal() {
  els.logoutModal.classList.remove("hidden");
}

function closeLogoutModal() {
  els.logoutModal.classList.add("hidden");
  els.confirmLogout.disabled = false;
  els.confirmLogout.textContent = "Yes, Log out";
}

async function handleLogout() {
  try {
    els.confirmLogout.disabled = true;
    els.confirmLogout.textContent = "Logging out...";

    await apiRequest("/auth/logout", {
      method: "POST"
    });
  } catch (error) {
    console.warn("Logout failed:", error.message);
  } finally {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "../../index.html";
  }
}

function bindUI() {
  els.editProfileBtn.addEventListener("click", handleEditProfile);
  els.passwordForm.addEventListener("submit", handlePasswordSubmit);

  els.logoutBtn.addEventListener("click", openLogoutModal);
  els.closeLogoutModal.addEventListener("click", closeLogoutModal);
  els.cancelLogout.addEventListener("click", closeLogoutModal);
  els.confirmLogout.addEventListener("click", handleLogout);

  els.logoutModal.addEventListener("click", (event) => {
    if (event.target === els.logoutModal) {
      closeLogoutModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.logoutModal.classList.contains("hidden")) {
      closeLogoutModal();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  bindUI();
  await loadAdminProfile();
});