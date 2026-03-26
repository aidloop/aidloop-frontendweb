const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const els = {
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  organizationCount: document.getElementById("organizationCount"),
  pendingCount: document.getElementById("pendingCount"),
  eventsCount: document.getElementById("eventsCount"),
  activeUsersCount: document.getElementById("activeUsersCount"),
  activityTable: document.getElementById("activityTable"),
  searchInput: document.getElementById("searchInput"),
  goVerificationQueue: document.getElementById("goVerificationQueue"),
  viewOrganizations: document.getElementById("viewOrganizations"),
  viewEvents: document.getElementById("viewEvents"),
  logoutBtn: document.getElementById("logoutBtn"),
  logoutModal: document.getElementById("logoutModal"),
  closeLogoutModal: document.getElementById("closeLogoutModal"),
  cancelLogout: document.getElementById("cancelLogout"),
  confirmLogout: document.getElementById("confirmLogout")
};

let activityRowsCache = [];

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

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function setStatValue(element, target) {
  const safeTarget = Number.isFinite(Number(target)) ? Number(target) : 0;
  const duration = 600;
  const steps = 24;
  const increment = safeTarget / steps;
  let current = 0;
  let step = 0;

  const timer = setInterval(() => {
    step += 1;
    current += increment;

    if (step >= steps) {
      element.textContent = safeTarget;
      clearInterval(timer);
      return;
    }

    element.textContent = Math.round(current);
  }, duration / steps);
}

function normalizeUsers(usersPayload) {
  if (Array.isArray(usersPayload)) return usersPayload;
  if (Array.isArray(usersPayload?.users)) return usersPayload.users;
  if (Array.isArray(usersPayload?.data)) return usersPayload.data;
  return [];
}

function normalizeEvents(eventsPayload) {
  if (Array.isArray(eventsPayload)) return eventsPayload;
  if (Array.isArray(eventsPayload?.events)) return eventsPayload.events;
  if (Array.isArray(eventsPayload?.data)) return eventsPayload.data;
  return [];
}

function buildRecentActivity(users, events) {
  const activities = [];

  users.slice(0, 5).forEach((user) => {
    const isOrganizer = String(user.role || "").toLowerCase() === "organizer";
    const isPending =
      String(user.status || "").toLowerCase() === "pending" ||
      String(user.approvalStatus || "").toLowerCase() === "pending";

    if (isOrganizer && isPending) {
      activities.push({
        activity: "Submitted for Verification",
        entity: user.fullName || user.name || user.email || "Organizer",
        date: user.createdAt || user.updatedAt,
        status: "Pending"
      });
    }
  });

  events.slice(0, 5).forEach((event) => {
    activities.push({
      activity: "Event Created",
      entity: event.name || "Untitled Event",
      date: event.createdAt || event.date,
      status: event.status || "Published"
    });
  });

  return activities
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 8)
    .map((item) => ({
      ...item,
      formattedDate: formatDate(item.date)
    }));
}

function renderRecentActivity(rows) {
  activityRowsCache = rows;
  applyActivitySearch();
}

function getStatusBadgeClass(status) {
  const normalized = String(status).toLowerCase();

  if (normalized.includes("pending")) return "pending";
  if (normalized.includes("published")) return "published";
  if (normalized.includes("completed")) return "completed";
  if (normalized.includes("approved")) return "published";
  return "pending";
}

function applyActivitySearch() {
  const query = els.searchInput.value.trim().toLowerCase();
  const filtered = activityRowsCache.filter((row) =>
    `${row.activity} ${row.entity} ${row.formattedDate} ${row.status}`
      .toLowerCase()
      .includes(query)
  );

  if (!filtered.length) {
    els.activityTable.innerHTML = `
      <tr>
        <td colspan="4">No matching activity found.</td>
      </tr>
    `;
    return;
  }

  els.activityTable.innerHTML = filtered
    .map(
      (row) => `
        <tr>
          <td>${row.activity}</td>
          <td>${row.entity}</td>
          <td>${row.formattedDate}</td>
          <td>
            <span class="status-badge ${getStatusBadgeClass(row.status)}">
              ${row.status}
            </span>
          </td>
        </tr>
      `
    )
    .join("");
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

async function loadDashboardData() {
  try {
    const [usersPayload, eventsPayload] = await Promise.all([
      apiRequest("/user").catch(() => apiRequest("/users")),
      apiRequest("/events")
    ]);

    const users = normalizeUsers(usersPayload);
    const events = normalizeEvents(eventsPayload);

    const organizers = users.filter(
      (user) => String(user.role || "").toLowerCase() === "organizer"
    );

    const pendingOrganizers = organizers.filter((user) => {
      const status = String(user.status || "").toLowerCase();
      const approvalStatus = String(user.approvalStatus || "").toLowerCase();
      return status === "pending" || approvalStatus === "pending";
    });

    const activeUsers = users.filter((user) => user.isActive !== false);

    setStatValue(els.organizationCount, organizers.length);
    setStatValue(els.pendingCount, pendingOrganizers.length);
    setStatValue(els.eventsCount, events.length);
    setStatValue(els.activeUsersCount, activeUsers.length);

    const recentActivity = buildRecentActivity(users, events);
    renderRecentActivity(recentActivity);
  } catch (error) {
    console.error("Failed to load dashboard data:", error.message);
    els.activityTable.innerHTML = `
      <tr>
        <td colspan="4">Failed to load dashboard data.</td>
      </tr>
    `;
  }
}

function bindUI() {
  els.goVerificationQueue.addEventListener("click", () => {
    window.location.href = "../verification/verification-queue.html";
  });

  els.viewOrganizations.addEventListener("click", () => {
    window.location.href = "../organizations/organization-directory.html";
  });

  els.viewEvents.addEventListener("click", () => {
    window.location.href = "../events/events-oversight.html";
  });

  els.searchInput.addEventListener("input", applyActivitySearch);

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
  await loadDashboardData();
});