const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const els = {
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  userTable: document.getElementById("userTable"),
  userTableWrap: document.getElementById("userTableWrap"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  logoutBtn: document.getElementById("logoutBtn"),
  logoutModal: document.getElementById("logoutModal"),
  closeLogoutModal: document.getElementById("closeLogoutModal"),
  cancelLogout: document.getElementById("cancelLogout"),
  confirmLogout: document.getElementById("confirmLogout")
};

let usersCache = [];

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

function renderUsers() {
  const query = els.searchInput.value.trim().toLowerCase();

  const filtered = usersCache.filter((user) => {
    const searchableText = `
      ${getDisplayName(user)}
      ${user.email || ""}
      ${getLocation(user)}
      ${getRole(user)}
    `.toLowerCase();

    return searchableText.includes(query);
  });

  if (!filtered.length) {
    els.userTableWrap.style.display = "none";
    els.emptyState.style.display = "block";
    return;
  }

  els.userTableWrap.style.display = "table";
  els.emptyState.style.display = "none";

  els.userTable.innerHTML = filtered.map((user) => {
    const role = getRole(user);
    const id = user._id || user.id || "";
    const isActive = user.isActive !== false;

    return `
      <tr>
        <td>${getDisplayName(user)}</td>
        <td>${user.email || "—"}</td>
        <td>${getLocation(user)}</td>
        <td><span class="role-badge ${role}">${role}</span></td>
        <td>
          <div class="actions-cell">
            <a class="action-link" href="user-details.html?id=${encodeURIComponent(id)}">View</a>
            <button
              class="action-btn ${isActive ? "" : "deactivated"}"
              data-id="${id}"
              ${isActive ? "" : "disabled"}
            >
              ${isActive ? "Deactivate" : "Deactivated"}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  bindDeactivateButtons();
}

function bindDeactivateButtons() {
  document.querySelectorAll(".action-btn[data-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      if (!id || button.disabled) return;

      try {
        button.disabled = true;
        button.textContent = "Deactivating...";

        await apiRequest(`/admin/users/${id}/deactivate`, {
          method: "PATCH"
        });

        usersCache = usersCache.map((user) =>
          String(user._id || user.id) === String(id)
            ? { ...user, isActive: false }
            : user
        );

        renderUsers();
      } catch (error) {
        console.error("Failed to deactivate user:", error.message);
        button.disabled = false;
        button.textContent = "Deactivate";
      }
    });
  });
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

async function loadAdminProfile() {
  try {
    let profile;
    try {
      profile = await apiRequest("/users/me");
    } catch {
      profile = await apiRequest("/user/me");
    }

    els.adminName.textContent =
      profile.fullName ||
      profile.name ||
      "Admin User";

    els.adminRole.textContent =
      profile.role
        ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
        : "Admin";

    if (profile.profileImage) {
      els.adminAvatar.src = profile.profileImage;
    }
  } catch (error) {
    console.error("Failed to load admin profile:", error.message);
    window.location.href = "../profile/admin-profile.html";
  }
}

async function loadUsers() {
  try {
    const payload = await apiRequest("/user").catch(() => apiRequest("/users"));
    usersCache = normalizeUsers(payload);
    renderUsers();
  } catch (error) {
    console.error("Failed to load users:", error.message);
    els.userTable.innerHTML = `
      <tr>
        <td colspan="5">Failed to load users.</td>
      </tr>
    `;
  }
}

function bindUI() {
  els.searchInput.addEventListener("input", renderUsers);

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
  await loadUsers();
});