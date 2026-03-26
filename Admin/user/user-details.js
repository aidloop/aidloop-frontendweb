const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const els = {
  userTitle: document.getElementById("userTitle"),
  roleBadge: document.getElementById("roleBadge"),
  userName: document.getElementById("userName"),
  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  location: document.getElementById("location"),
  dateJoined: document.getElementById("dateJoined"),
  statusBadge: document.getElementById("statusBadge"),
  description: document.getElementById("description"),
  feedback: document.getElementById("feedback"),
  deactivateBtn: document.getElementById("deactivateBtn"),
  reactivateBtn: document.getElementById("reactivateBtn")
};

const userId = new URLSearchParams(window.location.search).get("id");
let currentUser = null;

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

function normalizeUsers(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function getDisplayName(user) {
  return user.fullName || user.name || user.organizationName || "User";
}

function getLocation(user) {
  if (typeof user.location === "string" && user.location.trim()) {
    return user.location;
  }

  if (user.location && typeof user.location === "object") {
    return (
      [user.location.venue, user.location.city || user.location.state]
        .filter(Boolean)
        .join(", ") || "—"
    );
  }

  return user.city || user.state || "—";
}

function getRole(user) {
  return String(user.role || "user").toLowerCase();
}

function getStatus(user) {
  return user.isActive === false ? "deactivated" : "active";
}

function setFeedback(message, type = "") {
  els.feedback.textContent = message;
  els.feedback.className = "feedback";
  if (type) {
    els.feedback.classList.add(type);
  }
}

function setRoleBadge(role) {
  els.roleBadge.textContent = role.charAt(0).toUpperCase() + role.slice(1);
  els.roleBadge.className = "role-badge";
  els.roleBadge.classList.add(role);
}

function setStatusBadge(status) {
  els.statusBadge.textContent =
    status === "deactivated" ? "Deactivated" : "Active";
  els.statusBadge.className = "status-badge";
  els.statusBadge.classList.add(status);
}

function syncButtons(status) {
  if (status === "deactivated") {
    els.deactivateBtn.disabled = true;
    els.deactivateBtn.textContent = "Deactivated";
    els.reactivateBtn.disabled = false;
  } else {
    els.deactivateBtn.disabled = false;
    els.deactivateBtn.textContent = "Deactivate";
    els.reactivateBtn.disabled = false;
  }
}

function populateUser(user) {
  currentUser = user;

  const role = getRole(user);
  const status = getStatus(user);

  els.userTitle.textContent = getDisplayName(user);
  els.userName.textContent = getDisplayName(user);
  els.email.textContent = user.email || "—";
  els.phoneNumber.textContent = user.phoneNumber || user.phone || "—";
  els.location.textContent = getLocation(user);
  els.dateJoined.textContent = formatDate(user.createdAt || user.dateJoined);
  els.description.textContent =
    user.description ||
    user.bio ||
    "No description available.";

  setRoleBadge(role);
  setStatusBadge(status);
  syncButtons(status);
}

async function loadUserDetails() {
  if (!userId) {
    els.userTitle.textContent = "No user selected";
    els.description.textContent = "No user ID provided.";
    els.deactivateBtn.disabled = true;
    els.reactivateBtn.disabled = true;
    return;
  }

  try {
    const payload = await apiRequest("/user").catch(() => apiRequest("/users"));
    const users = normalizeUsers(payload);

    const user = users.find(
      (item) => String(item._id || item.id) === String(userId)
    );

    if (!user) {
      throw new Error("User not found");
    }

    populateUser(user);
  } catch (error) {
    els.userTitle.textContent = "Unable to load user";
    els.description.textContent = error.message || "Failed to fetch user details.";
    els.deactivateBtn.disabled = true;
    els.reactivateBtn.disabled = true;
    setFeedback(error.message || "Failed to load user details.", "error");
  }
}

async function deactivateUser() {
  if (!userId) return;

  try {
    els.deactivateBtn.disabled = true;
    els.deactivateBtn.textContent = "Deactivating...";

    await apiRequest(`/admin/users/${userId}/deactivate`, {
      method: "PATCH"
    });

    currentUser = {
      ...currentUser,
      isActive: false
    };

    setStatusBadge("deactivated");
    syncButtons("deactivated");
    setFeedback("User deactivated successfully.", "success");
  } catch (error) {
    syncButtons(getStatus(currentUser || {}));
    setFeedback(error.message || "Failed to deactivate user.", "error");
  }
}

function handleReactivate() {
  setFeedback(
    "No reactivation endpoint has been provided yet.",
    "error"
  );
}

els.deactivateBtn.addEventListener("click", deactivateUser);
els.reactivateBtn.addEventListener("click", handleReactivate);

document.addEventListener("DOMContentLoaded", loadUserDetails);