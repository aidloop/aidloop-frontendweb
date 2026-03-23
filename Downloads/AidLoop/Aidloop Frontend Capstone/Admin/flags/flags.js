const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const elements = {
  searchInput: document.getElementById("searchInput"),
  flagsTable: document.getElementById("flagsTable"),
  emptyState: document.getElementById("emptyState"),
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  filterButtons: document.querySelectorAll(".filter-btn")
};

let flaggedOrganizations = [];
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

function normalizeEvents(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.events)) return payload.events;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizeUsers(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getUserStatus(user) {
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

  return "awaiting";
}

function getSeverity(count) {
  if (count <= 2) return "low";
  if (count <= 4) return "medium";
  return "high";
}

function getSeverityText(severity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
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

function getOrganizerId(event) {
  if (typeof event.organizer === "object" && event.organizer) {
    return event.organizer._id || event.organizer.id || "";
  }
  return event.organizerId || "";
}

function getOrganizerName(event) {
  if (typeof event.organizer === "object" && event.organizer) {
    return (
      event.organizer.fullName ||
      event.organizer.name ||
      event.organizer.organizationName ||
      "Organizer"
    );
  }
  return event.organizerName || "Organizer";
}

function getOrganizerSubtitle(user) {
  return user?.tagline || user?.organizationType || user?.bio || "Registered organization";
}

function buildFlagData(events, users) {
  const usersMap = new Map(
    users
      .filter((user) => String(user.role || "").toLowerCase() === "organizer")
      .map((user) => [String(user._id || user.id), user])
  );

  const cancelledEvents = events.filter((event) => {
    const status = String(event.status || "").toLowerCase();
    return status === "cancelled" || status === "canceled";
  });

  const grouped = new Map();

  cancelledEvents.forEach((event) => {
    const organizerId = String(getOrganizerId(event));
    const organizerName = getOrganizerName(event);

    if (!grouped.has(organizerId)) {
      grouped.set(organizerId, {
        organizerId,
        organizerName,
        organizer: usersMap.get(organizerId) || null,
        cancellations: 0,
        lastEventDate: null,
        lastEventName: "",
        reason: "Frequent Cancellations"
      });
    }

    const record = grouped.get(organizerId);
    record.cancellations += 1;

    const eventDate = event.date || event.updatedAt || event.createdAt || null;
    if (!record.lastEventDate || new Date(eventDate) > new Date(record.lastEventDate)) {
      record.lastEventDate = eventDate;
      record.lastEventName = event.name || event.title || "Untitled Event";
    }

    if (event.cancelReason || event.reason) {
      record.reason = event.cancelReason || event.reason;
    }
  });

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    severity: getSeverity(item.cancellations),
    userStatus: item.organizer ? getUserStatus(item.organizer) : "awaiting"
  }));
}

function renderFlags() {
  const query = elements.searchInput.value.trim().toLowerCase();

  const filtered = flaggedOrganizations.filter((item) => {
    const matchesFilter =
      currentFilter === "all" ? true : item.userStatus === currentFilter;

    const searchableText = `
      ${item.organizerName}
      ${item.reason}
      ${item.lastEventName}
      ${item.userStatus}
      ${item.severity}
    `.toLowerCase();

    return matchesFilter && searchableText.includes(query);
  });

  if (!filtered.length) {
    elements.flagsTable.innerHTML = "";
    elements.emptyState.style.display = "flex";
    return;
  }

  elements.emptyState.style.display = "none";

  elements.flagsTable.innerHTML = filtered
    .map((item) => `
      <tr data-status="${item.userStatus}">
        <td>
          <div class="org-cell">
            <div class="org-icon">
              <i class="fa-regular fa-building"></i>
            </div>
            <div class="org-info">
              <h4>${item.organizerName}</h4>
              <p>${getOrganizerSubtitle(item.organizer)}</p>
            </div>
          </div>
        </td>
        <td>${item.cancellations}</td>
        <td>
          <span class="severity-badge ${item.severity}">
            ${getSeverityText(item.severity)}
          </span>
        </td>
        <td>${formatDate(item.lastEventDate)}</td>
        <td class="flag-reason">${item.reason}</td>
        <td class="action-links">
          <a href="#" class="review-link" data-id="${item.organizerId}">Review</a> |
          <a href="mailto:${item.organizer?.email || ""}">Contact</a>
        </td>
      </tr>
    `)
    .join("");

  attachReviewHandlers();
}

function attachReviewHandlers() {
  document.querySelectorAll(".review-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const organizerId = link.dataset.id;
      window.location.href = `flag-details.html?id=${encodeURIComponent(organizerId)}`;
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

async function loadFlags() {
  try {
    const [eventsPayload, usersPayload] = await Promise.all([
      apiRequest("/events"),
      apiRequest("/user").catch(() => apiRequest("/users"))
    ]);

    const events = normalizeEvents(eventsPayload);
    const users = normalizeUsers(usersPayload);

    flaggedOrganizations = buildFlagData(events, users);
    renderFlags();
  } catch (error) {
    console.error("Failed to load flags:", error.message);
    elements.flagsTable.innerHTML = `
      <tr>
        <td colspan="6">Failed to load flags.</td>
      </tr>
    `;
  }
}

function bindFilters() {
  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      elements.filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.filter;
      renderFlags();
    });
  });
}

function bindSearch() {
  elements.searchInput.addEventListener("input", renderFlags);
}

document.addEventListener("DOMContentLoaded", async () => {
  bindFilters();
  bindSearch();
  await loadAdminProfile();
  await loadFlags();
});










// import { apiRequest, normalizeArray } from "../../assets/js/api.js";
// import { requireAdmin } from "../../assets/js/auth.js";
// import { logout } from "../../assets/js/logout.js";
// import { ROUTES } from "../../assets/js/config.js";
// import { formatDate } from "../../assets/js/utils.js";

// const table = document.getElementById("flagsTable");
// document.getElementById("logoutBtn").addEventListener("click", () => logout(ROUTES.home));

// function severity(count) {
//   if (count <= 2) return "Low";
//   if (count <= 4) return "Medium";
//   return "High";
// }

// document.addEventListener("DOMContentLoaded", async () => {
//   await requireAdmin();
//   try {
//     const [eventsPayload, usersPayload] = await Promise.all([apiRequest("/events"), apiRequest("/user")]);
//     const events = normalizeArray(eventsPayload, ["events"]);
//     const users = normalizeArray(usersPayload, ["users"]);
//     const organizers = users.filter((u) => String(u.role || "").toLowerCase() === "organizer");

//     const flagged = organizers.map((org) => {
//       const orgEvents = events.filter((e) => String(e.organizer?._id || e.organizerId || "") === String(org._id || org.id));
//       const cancelled = orgEvents.filter((e) => ["cancelled", "canceled"].includes(String(e.status || "").toLowerCase()));
//       return {
//         org,
//         cancellations: cancelled.length,
//         lastDate: cancelled[0]?.date || null,
//         reason: cancelled[0]?.cancelReason || cancelled[0]?.reason || (cancelled.length ? "Frequent cancellations" : "—")
//       };
//     }).filter((item) => item.cancellations > 0);

//     table.innerHTML = flagged.map((item) => `
//       <tr>
//         <td>${item.org.fullName || item.org.name || item.org.organizationName || "Organization"}</td>
//         <td>${item.cancellations}</td>
//         <td>${severity(item.cancellations)}</td>
//         <td>${formatDate(item.lastDate, "long")}</td>
//         <td>${item.reason}</td>
//         <td><a href="flag-details.html?id=${encodeURIComponent(item.org._id || item.org.id)}">Review</a></td>
//       </tr>
//     `).join("") || `<tr><td colspan="6">No flags found.</td></tr>`;
//   } catch {
//     table.innerHTML = `<tr><td colspan="6">Failed to load flags.</td></tr>`;
//   }
// });
