const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const elements = {
  searchInput: document.getElementById("searchInput"),
  directoryTable: document.getElementById("directoryTable"),
  emptyState: document.getElementById("emptyState"),
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  filterButtons: document.querySelectorAll(".filter-btn")
};

let organizers = [];
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

function getVerificationStatus(user) {
  const status = String(user.status || "").toLowerCase();
  const approvalStatus = String(user.approvalStatus || "").toLowerCase();
  const isVerified = Boolean(user.isVerified);

  if (status === "rejected" || approvalStatus === "rejected") {
    return "rejected";
  }

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

function getDisplayName(user) {
  return user.fullName || user.name || user.organizationName || "Unnamed Organizer";
}

function getSubtitle(user) {
  return user.tagline || user.organizationType || user.bio || "Registered organization";
}

function getLocation(user) {
  if (typeof user.location === "string" && user.location.trim()) {
    return user.location;
  }

  if (user.location && typeof user.location === "object") {
    return (
      user.location.city ||
      user.location.state ||
      user.location.venue ||
      "—"
    );
  }

  return user.city || user.state || "—";
}

function badgeText(status) {
  if (status === "verified") return "Verified";
  if (status === "rejected") return "Rejected";
  return "Awaiting Verification";
}

function renderTable() {
  const query = elements.searchInput.value.trim().toLowerCase();

  const filtered = organizers.filter((organizer) => {
    const status = organizer._verificationStatus;

    const matchesFilter =
      currentFilter === "all" ? true : status === currentFilter;

    const searchableText = `
      ${getDisplayName(organizer)}
      ${organizer.email || ""}
      ${getLocation(organizer)}
      ${status}
    `.toLowerCase();

    return matchesFilter && searchableText.includes(query);
  });

  if (!filtered.length) {
    elements.directoryTable.innerHTML = "";
    elements.emptyState.style.display = "flex";
    return;
  }

  elements.emptyState.style.display = "none";

  elements.directoryTable.innerHTML = filtered
    .map((organizer) => {
      const id = organizer._id || organizer.id || "";
      const status = organizer._verificationStatus;

      return `
        <tr data-status="${status}" data-name="${getDisplayName(organizer)}">
          <td>
            <div class="org-cell">
              <div class="org-icon">
                <i class="fa-regular fa-building"></i>
              </div>
              <div class="org-info">
                <h4>${getDisplayName(organizer)}</h4>
                <p>${getSubtitle(organizer)}</p>
              </div>
            </div>
          </td>
          <td>${organizer.email || "—"}</td>
          <td>${getLocation(organizer)}</td>
          <td><span class="status-badge ${status}">${badgeText(status)}</span></td>
          <td><button class="details-btn" data-id="${id}">View Details</button></td>
        </tr>
      `;
    })
    .join("");

  attachDetailHandlers();
}

function attachDetailHandlers() {
  document.querySelectorAll(".details-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const organizerId = button.dataset.id;
      window.location.href = `organization-details.html?id=${encodeURIComponent(organizerId)}`;
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

async function loadOrganizations() {
  try {
    let usersPayload;

    try {
      usersPayload = await apiRequest("/user");
    } catch {
      usersPayload = await apiRequest("/users");
    }

    const users = normalizeUsers(usersPayload);

    organizers = users
      .filter((user) => String(user.role || "").toLowerCase() === "organizer")
      .map((user) => ({
        ...user,
        _verificationStatus: getVerificationStatus(user)
      }));

    renderTable();
  } catch (error) {
    console.error("Failed to load organizations:", error.message);
    elements.directoryTable.innerHTML = `
      <tr>
        <td colspan="5">Failed to load organizations.</td>
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
      renderTable();
    });
  });
}

function bindSearch() {
  elements.searchInput.addEventListener("input", renderTable);
}

document.addEventListener("DOMContentLoaded", async () => {
  bindFilters();
  bindSearch();
  await loadAdminProfile();
  await loadOrganizations();
});










// import { apiRequest, normalizeArray } from "../../assets/js/api.js";
// import { requireAdmin } from "../../assets/js/auth.js";
// import { logout } from "../../assets/js/logout.js";
// import { ROUTES } from "../../assets/js/config.js";
// import { getLocationText } from "../../assets/js/utils.js";

// const table = document.getElementById("directoryTable");
// document.getElementById("logoutBtn").addEventListener("click", () => logout(ROUTES.home));

// document.addEventListener("DOMContentLoaded", async () => {
//   await requireAdmin();
//   try {
//     const payload = await apiRequest("/user");
//     const users = normalizeArray(payload, ["users"]);
//     const organizers = users.filter((u) => String(u.role || "").toLowerCase() === "organizer");
//     table.innerHTML = organizers.map((u) => `
//       <tr>
//         <td>${u.fullName || u.name || u.organizationName || "Unnamed Organizer"}</td>
//         <td>${u.email || "—"}</td>
//         <td>${getLocationText(u)}</td>
//         <td>${u.isVerified ? "Verified" : "Pending"}</td>
//         <td><a href="organization-details.html?id=${encodeURIComponent(u._id || u.id)}">View Details</a></td>
//       </tr>
//     `).join("") || `<tr><td colspan="5">No organizations found.</td></tr>`;
//   } catch {
//     table.innerHTML = `<tr><td colspan="5">Failed to load organizations.</td></tr>`;
//   }
// });
