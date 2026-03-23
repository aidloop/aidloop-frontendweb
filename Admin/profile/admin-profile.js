const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const elements = {
  fullName: document.getElementById("fullName"),
  email: document.getElementById("emailAddress"),
  role: document.getElementById("role"),
  phoneNumber: document.getElementById("phoneNumber"),
  editBtn: document.getElementById("editProfileBtn"),
  profileForm: document.getElementById("profileForm"),
  passwordForm: document.getElementById("passwordForm")
};

let isEditing = false;

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
      data?.message || data?.error || "Request failed"
    );
  }

  return data;
}

function setInputsEditable(editable) {
  elements.phoneNumber.readOnly = !editable;
}

function populateProfile(profile) {
  elements.fullName.value =
    profile.fullName || profile.name || "";

  elements.email.value = profile.email || "";

  elements.role.value =
    profile.role
      ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
      : "Admin";

  elements.phoneNumber.value =
    profile.phoneNumber ||
    profile.phone ||
    "";
}

async function loadProfile() {
  try {
    let profile;

    try {
      profile = await apiRequest("/user/me");
    } catch {
      profile = await apiRequest("/users/me");
    }

    populateProfile(profile);
  } catch (error) {
    console.error("Failed to load profile:", error.message);
    window.location.href = "../login/admin-login.html";
  }
}

async function updateProfile() {
  try {
    const payload = {
      phoneNumber: elements.phoneNumber.value
    };

    await apiRequest("/user/me", {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    alert("Profile updated successfully ✅");
  } catch (error) {
    alert(error.message);
  }
}

function toggleEditMode() {
  isEditing = !isEditing;

  setInputsEditable(isEditing);

  elements.editBtn.textContent = isEditing
    ? "Save Changes"
    : "Edit Profile";

  if (!isEditing) {
    updateProfile();
  }
}

function handlePasswordChange(e) {
  e.preventDefault();

  const current = document.getElementById("currentPassword").value;
  const newPass = document.getElementById("newPassword").value;
  const confirm = document.getElementById("confirmPassword").value;

  if (!current || !newPass || !confirm) {
    alert("All fields are required");
    return;
  }

  if (newPass !== confirm) {
    alert("Passwords do not match");
    return;
  }

  // ⚠️ No backend endpoint provided for password change
  alert("Password change endpoint not implemented yet");
}

document.addEventListener("DOMContentLoaded", async () => {
  setInputsEditable(false);

  elements.editBtn.addEventListener("click", toggleEditMode);
  elements.passwordForm.addEventListener("submit", handlePasswordChange);

  await loadProfile();
});