const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const elements = {
  searchInput: document.getElementById("searchInput"),
  userTable: document.getElementById("userTable"),
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar")
};

let allUsers = [];

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

function getDisplayName(user) {
  return user.fullName || user.name || user.organizationName || "Unnamed User";
}

function getLocation(user) {
  if (typeof user.location === "string" && user.location.trim()) {
    return user.location;
  }

  if (user.location && typeof user.location === "object") {
    return user.location.city || user.location.state || user.location.venue || "—";
  }

  return user.city || user.state || "—";
}

function getRole(user) {
  const role = String(user.role || "user").toLowerCase();
  if (role === "organizer") return "Organizer";
  if (role === "volunteer") return "Volunteer";
  if (role === "admin") return "Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getRoleClass(user) {
  return String(user.role || "").toLowerCase() === "organizer"
    ? "organizer"
    : "volunteer";
}

function isUserActive(user) {
  if (typeof user.isActive === "boolean") return user.isActive;
  const status = String(user.status || "").toLowerCase();
  return status !== "deactivated" && status !== "inactive";
}

function renderUsers() {
  const query = elements.searchInput.value.trim().toLowerCase();

  const filteredUsers = allUsers.filter((user) => {
    const searchable = `
      ${getDisplayName(user)}
      ${user.email || ""}
      ${getLocation(user)}
      ${getRole(user)}
    `.toLowerCase();

    return searchable.includes(query);
  });

  if (!filteredUsers.length) {
    elements.userTable.innerHTML = `
      <tr>
        <td colspan="5">No users found.</td>
      </tr>
    `;
    return;
  }

  elements.userTable.innerHTML = filteredUsers
    .map((user) => {
      const id = user._id || user.id || "";
      const active = isUserActive(user);

      return `
        <tr data-id="${id}">
          <td>${getDisplayName(user)}</td>
          <td>${user.email || "—"}</td>
          <td>${getLocation(user)}</td>
          <td><span class="role-badge ${getRoleClass(user)}">${getRole(user)}</span></td>
          <td class="actions-cell">
            <button class="btn btn-view" data-id="${id}">View</button>
            <button
              class="btn ${active ? "btn-active" : "btn-deactivate"} action-status-btn"
              data-id="${id}"
              data-active="${active}"
            >
              ${active ? "Active" : "Deactivate"}
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  bindActionButtons();
}

function bindActionButtons() {
  document.querySelectorAll(".btn-view").forEach((button) => {
    button.addEventListener("click", () => {
      const userId = button.dataset.id;
      window.location.href = `user-details.html?id=${encodeURIComponent(userId)}`;
    });
  });

  document.querySelectorAll(".action-status-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const userId = button.dataset.id;
      const isActive = button.dataset.active === "true";

      if (!isActive) {
        alert("This user is already deactivated.");
        return;
      }

      const confirmed = window.confirm("Deactivate this user?");
      if (!confirmed) return;

      try {
        button.disabled = true;
        button.textContent = "Processing...";

        await apiRequest(`/admin/users/${userId}/deactivate`, {
          method: "PATCH"
        });

        const userIndex = allUsers.findIndex(
          (user) => String(user._id || user.id) === String(userId)
        );

        if (userIndex > -1) {
          allUsers[userIndex].isActive = false;
          allUsers[userIndex].status = "deactivated";
        }

        renderUsers();
      } catch (error) {
        alert(error.message);
        renderUsers();
      }
    });
  });
}

async function loadAdminProfile() {
  try {
    let profile;

    try {
      profile = await apiRequest("/users/me");
    } catch {
      profile = await apiRequest("/user/me");
    }

    elements.adminName.textContent = profile.fullName || profile.name || "Admin";
    elements.adminRole.textContent = profile.role
      ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
      : "Admin";

    if (profile.profileImage) {
      elements.adminAvatar.src = profile.profileImage;
    }
  } catch (error) {
    console.error("Failed to load admin profile:", error.message);
    window.location.href = "../login/admin-login.html";
  }
}

async function loadUsers() {
  try {
    const usersPayload = await apiRequest("/user");
    allUsers = normalizeUsers(usersPayload);
    renderUsers();
  } catch (error) {
    console.error("Failed to load users:", error.message);
    elements.userTable.innerHTML = `
      <tr>
        <td colspan="5">Failed to load users.</td>
      </tr>
    `;
  }
}

function bindSearch() {
  elements.searchInput.addEventListener("input", renderUsers);
}

document.addEventListener("DOMContentLoaded", async () => {
  bindSearch();
  await loadAdminProfile();
  await loadUsers();
});