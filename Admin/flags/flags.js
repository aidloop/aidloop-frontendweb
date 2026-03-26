const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const els = {
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  flagsTable: document.getElementById("flagsTable"),
  flagsTableWrap: document.querySelector(".table-wrapper table"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  logoutBtn: document.getElementById("logoutBtn"),
  logoutModal: document.getElementById("logoutModal"),
  closeLogoutModal: document.getElementById("closeLogoutModal"),
  cancelLogout: document.getElementById("cancelLogout"),
  confirmLogout: document.getElementById("confirmLogout")
};

let flagsCache = [];
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

function normalizeEvents(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.events)) return payload.events;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
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

function getSeverity(count) {
  if (count <= 2) return "low";
  if (count <= 4) return "medium";
  return "high";
}

function getSeverityLabel(count) {
  const severity = getSeverity(count);
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function getOrganizerName(user) {
  return user.fullName || user.name || user.organizationName || "Organization";
}

function buildFlags(users, events) {
  const organizers = users.filter(
    (user) => String(user.role || "").toLowerCase() === "organizer"
  );

  return organizers
    .map((organizer) => {
      const organizerId = String(organizer._id || organizer.id || "");

      const organizerEvents = events.filter((event) => {
        const eventOrganizerId =
          String(event.organizer?._id || event.organizer?.id || event.organizerId || "");
        return eventOrganizerId === organizerId;
      });

      const cancelledEvents = organizerEvents.filter((event) => {
        const status = String(event.status || "").toLowerCase();
        return status.includes("cancel");
      });

      if (!cancelledEvents.length) return null;

      const latestCancelled = cancelledEvents.sort(
        (a, b) => new Date(b.date || b.updatedAt || b.createdAt || 0) - new Date(a.date || a.updatedAt || a.createdAt || 0)
      )[0];

      return {
        id: organizerId,
        status: getOrganizerStatus(organizer),
        name: getOrganizerName(organizer),
        cancellations: cancelledEvents.length,
        severity: getSeverity(cancelledEvents.length),
        severityLabel: getSeverityLabel(cancelledEvents.length),
        lastEventDate: latestCancelled?.date || latestCancelled?.updatedAt || latestCancelled?.createdAt || "",
        reason:
          latestCancelled?.cancelReason ||
          latestCancelled?.reason ||
          "Frequent cancellations"
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastEventDate || 0) - new Date(a.lastEventDate || 0));
}

function renderFlags() {
  const query = els.searchInput.value.trim().toLowerCase();

  let filtered = [...flagsCache];

  if (currentFilter !== "all") {
    filtered = filtered.filter((item) => item.status === currentFilter);
  }

  if (query) {
    filtered = filtered.filter((item) => {
      const searchableText = `
        ${item.name}
        ${item.cancellations}
        ${item.severityLabel}
        ${formatDate(item.lastEventDate)}
        ${item.reason}
      `.toLowerCase();

      return searchableText.includes(query);
    });
  }

  if (!filtered.length) {
    els.flagsTableWrap.style.display = "none";
    els.emptyState.style.display = "block";
    return;
  }

  els.flagsTableWrap.style.display = "table";
  els.emptyState.style.display = "none";

  els.flagsTable.innerHTML = filtered.map((item) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.cancellations}</td>
      <td>
        <span class="severity-badge ${item.severity}">
          ${item.severityLabel}
        </span>
      </td>
      <td>${formatDate(item.lastEventDate)}</td>
      <td>${item.reason}</td>
      <td>
        <a class="action-link" href="flag-details.html?id=${encodeURIComponent(item.id)}">
          Review
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
      renderFlags();
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

async function loadFlags() {
  try {
    const [usersPayload, eventsPayload] = await Promise.all([
      apiRequest("/user").catch(() => apiRequest("/users")),
      apiRequest("/events")
    ]);

    const users = normalizeUsers(usersPayload);
    const events = normalizeEvents(eventsPayload);

    flagsCache = buildFlags(users, events);
    renderFlags();
  } catch (error) {
    console.error("Failed to load flags:", error.message);
    els.flagsTable.innerHTML = `
      <tr>
        <td colspan="6">Failed to load flags.</td>
      </tr>
    `;
  }
}

function bindUI() {
  els.searchInput.addEventListener("input", renderFlags);

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
  await loadFlags();
});