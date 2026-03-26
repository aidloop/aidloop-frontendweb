const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const els = {
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  directoryTable: document.getElementById("directoryTable"),
  directoryTableWrap: document.getElementById("directoryTableWrap"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  logoutBtn: document.getElementById("logoutBtn"),
  logoutModal: document.getElementById("logoutModal"),
  closeLogoutModal: document.getElementById("closeLogoutModal"),
  cancelLogout: document.getElementById("cancelLogout"),
  confirmLogout: document.getElementById("confirmLogout")
};

let organizersCache = [];
let currentFilter = "all";

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

function getOrganizerStatus(user) {
  const status = String(user.status || "").toLowerCase();
  const approvalStatus = String(user.approvalStatus || "").toLowerCase();
  const isVerified = Boolean(user.isVerified);

  if (status === "rejected" || approvalStatus === "rejected") return "rejected";

  if (
    status === "verified" ||
    status === "approved" ||
    approvalStatus === "verified" ||
    approvalStatus === "approved" ||
    isVerified
  ) {
    return "verified";
  }

  return "pending";
}

function getDisplayName(user) {
  return user.fullName || user.name || user.organizationName || "Unnamed Organizer";
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

function renderDirectory() {
  const query = els.searchInput.value.trim().toLowerCase();

  let filtered = [...organizersCache];

  if (currentFilter !== "all") {
    filtered = filtered.filter((organizer) => organizer._status === currentFilter);
  }

  if (query) {
    filtered = filtered.filter((organizer) => {
      const searchableText = `
        ${getDisplayName(organizer)}
        ${organizer.email || ""}
        ${getLocation(organizer)}
        ${organizer._status}
      `.toLowerCase();

      return searchableText.includes(query);
    });
  }

  if (!filtered.length) {
    els.directoryTableWrap.style.display = "none";
    els.emptyState.style.display = "block";
    return;
  }

  els.directoryTableWrap.style.display = "table";
  els.emptyState.style.display = "none";

  els.directoryTable.innerHTML = filtered.map((organizer) => `
    <tr>
      <td>${getDisplayName(organizer)}</td>
      <td>${organizer.email || "—"}</td>
      <td>${getLocation(organizer)}</td>
      <td>
        <span class="status-badge ${organizer._status}">
          ${organizer._status.charAt(0).toUpperCase() + organizer._status.slice(1)}
        </span>
      </td>
      <td>
        <a class="action-link" href="organization-details.html?id=${encodeURIComponent(organizer._id || organizer.id)}">
          View Details
        </a>
      </td>
    </tr>
  `).join("");
}

function bindFilters() {
  els.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      els.filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.filter;
      renderDirectory();
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

async function loadOrganizations() {
  try {
    const payload = await apiRequest("/user").catch(() => apiRequest("/users"));
    const users = normalizeUsers(payload);

    organizersCache = users
      .filter((user) => String(user.role || "").toLowerCase() === "organizer")
      .map((user) => ({
        ...user,
        _status: getOrganizerStatus(user)
      }));

    renderDirectory();
  } catch (error) {
    console.error("Failed to load organizations:", error.message);
    els.directoryTable.innerHTML = `
      <tr>
        <td colspan="5">Failed to load organizations.</td>
      </tr>
    `;
  }
}

function bindUI() {
  els.searchInput.addEventListener("input", renderDirectory);
  bindFilters();

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
  await loadOrganizations();
});