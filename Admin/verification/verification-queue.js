const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const elements = {
  searchInput: document.getElementById("searchInput"),
  orgTable: document.getElementById("orgTable"),
  pendingCount: document.getElementById("pendingCount"),
  adminName: document.getElementById("adminName"),
  adminAvatar: document.getElementById("adminAvatar"),
  filterButtons: document.querySelectorAll(".filter-btn")
};

let organizers = [];
let currentFilter = "awaiting";

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

function getDisplayName(user) {
  return user.fullName || user.name || user.organizationName || "Unnamed Organizer";
}

function badgeText(status) {
  if (status === "verified") return "Verified";
  if (status === "rejected") return "Rejected";
  return "Awaiting Verification";
}

function updatePendingCount() {
  const count = organizers.filter(
    (organizer) => organizer._verificationStatus === "awaiting"
  ).length;

  elements.pendingCount.textContent = count;
}

function renderTable() {
  const query = elements.searchInput.value.trim().toLowerCase();

  const filtered = organizers.filter((organizer) => {
    const matchesFilter =
      currentFilter === "all"
        ? true
        : organizer._verificationStatus === currentFilter;

    const searchableText = `
      ${getDisplayName(organizer)}
      ${organizer.email || ""}
      ${getLocation(organizer)}
      ${organizer._verificationStatus}
    `.toLowerCase();

    return matchesFilter && searchableText.includes(query);
  });

  if (!filtered.length) {
    elements.orgTable.innerHTML = `
      <tr>
        <td colspan="5">No organizations found.</td>
      </tr>
    `;
    return;
  }

  elements.orgTable.innerHTML = filtered
    .map((organizer) => {
      const id = organizer._id || organizer.id || "";
      const status = organizer._verificationStatus;

      return `
        <tr data-status="${status}">
          <td>${getDisplayName(organizer)}</td>
          <td>${organizer.email || "—"}</td>
          <td>${getLocation(organizer)}</td>
          <td><span class="badge ${status}">${badgeText(status)}</span></td>
          <td>
            <button class="view" data-id="${id}">View Details</button>
          </td>
        </tr>
      `;
    })
    .join("");

  attachViewDetailsHandlers();
}

function attachViewDetailsHandlers() {
  document.querySelectorAll(".view").forEach((button) => {
    button.addEventListener("click", () => {
      const organizerId = button.dataset.id;
      window.location.href = `verification-details.html?id=${encodeURIComponent(organizerId)}`;
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

    elements.adminName.textContent =
      profile.fullName || profile.name || "Admin";

    if (profile.profileImage) {
      elements.adminAvatar.src = profile.profileImage;
    }
  } catch (error) {
    console.error("Failed to load admin profile:", error.message);
    window.location.href = "../login/admin-login.html";
  }
}

async function loadVerificationQueue() {
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

    updatePendingCount();
    renderTable();
  } catch (error) {
    console.error("Failed to load verification queue:", error.message);
    elements.orgTable.innerHTML = `
      <tr>
        <td colspan="5">Failed to load verification queue.</td>
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
  await loadVerificationQueue();
});
