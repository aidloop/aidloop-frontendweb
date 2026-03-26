const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const els = {
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  eventsTable: document.getElementById("eventsTable"),
  eventsTableWrap: document.getElementById("eventsTableWrap"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  logoutBtn: document.getElementById("logoutBtn"),
  logoutModal: document.getElementById("logoutModal"),
  closeLogoutModal: document.getElementById("closeLogoutModal"),
  cancelLogout: document.getElementById("cancelLogout"),
  confirmLogout: document.getElementById("confirmLogout")
};

let eventsCache = [];
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

function normalizeEvents(eventsPayload) {
  if (Array.isArray(eventsPayload)) return eventsPayload;
  if (Array.isArray(eventsPayload?.events)) return eventsPayload.events;
  if (Array.isArray(eventsPayload?.data)) return eventsPayload.data;
  return [];
}

function formatLocation(event) {
  if (typeof event.location === "string" && event.location.trim()) {
    return event.location;
  }

  if (event.location && typeof event.location === "object") {
    return (
      [event.location.venue, event.location.city || event.location.state]
        .filter(Boolean)
        .join(", ") || "—"
    );
  }

  return event.city || event.state || "—";
}

function getStatusValue(event) {
  const status = String(event.status || "").toLowerCase();

  if (status.includes("cancel")) return "cancelled";
  if (status.includes("draft")) return "draft";
  return "published";
}

function getContactEmail(event) {
  return (
    event.organizer?.email ||
    event.contactEmail ||
    event.email ||
    "—"
  );
}

function getEventTitle(event) {
  return event.name || event.title || "Untitled Event";
}

function getEventId(event) {
  return event._id || event.id || "";
}

function renderEvents() {
  const query = els.searchInput.value.trim().toLowerCase();

  let filtered = [...eventsCache];

  if (currentFilter !== "all") {
    filtered = filtered.filter((event) => getStatusValue(event) === currentFilter);
  }

  if (query) {
    filtered = filtered.filter((event) => {
      const searchableText = `
        ${getEventTitle(event)}
        ${getContactEmail(event)}
        ${formatLocation(event)}
        ${getStatusValue(event)}
      `.toLowerCase();

      return searchableText.includes(query);
    });
  }

  if (!filtered.length) {
    els.eventsTableWrap.style.display = "none";
    els.emptyState.style.display = "block";
    return;
  }

  els.eventsTableWrap.style.display = "table";
  els.emptyState.style.display = "none";

  els.eventsTable.innerHTML = filtered.map((event) => {
    const status = getStatusValue(event);

    return `
      <tr>
        <td>${getEventTitle(event)}</td>
        <td>${getContactEmail(event)}</td>
        <td>${formatLocation(event)}</td>
        <td>
          <span class="status-badge ${status}">
            ${status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </td>
        <td>
          <a class="action-link" href="event-details.html?id=${encodeURIComponent(getEventId(event))}">
            View Details
          </a>
        </td>
      </tr>
    `;
  }).join("");
}

function bindFilters() {
  els.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      els.filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.filter;
      renderEvents();
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

async function loadEvents() {
  try {
    const payload = await apiRequest("/events");
    eventsCache = normalizeEvents(payload);
    renderEvents();
  } catch (error) {
    console.error("Failed to load events:", error.message);
    els.eventsTable.innerHTML = `
      <tr>
        <td colspan="5">Failed to load events.</td>
      </tr>
    `;
  }
}

function bindUI() {
  els.searchInput.addEventListener("input", renderEvents);

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
  await loadEvents();
});