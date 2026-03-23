const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const elements = {
  overlay: document.getElementById("overlay"),
  closeBtn: document.getElementById("closeBtn"),
  orgTitle: document.getElementById("orgTitle"),
  orgName: document.getElementById("orgName"),
  socialLinks: document.getElementById("socialLinks"),
  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  location: document.getElementById("location"),
  description: document.getElementById("description"),
  statusBadge: document.getElementById("statusBadge")
};

let organizerId = null;

function getOrganizerIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

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

function getStatus(user) {
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

function getStatusText(status) {
  if (status === "verified") return "Verified";
  if (status === "rejected") return "Rejected";
  return "Awaiting";
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
      user.location.city ||
      user.location.state ||
      user.location.venue ||
      "—"
    );
  }

  return user.city || user.state || "—";
}

function renderSocialLinks(user) {
  const links =
    user.socialLinks ||
    user.website ||
    user.socialLink ||
    user.link ||
    "";

  if (!links) {
    elements.socialLinks.textContent = "—";
    return;
  }

  if (Array.isArray(links)) {
    elements.socialLinks.innerHTML = links
      .map((link) => `<a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a>`)
      .join("<br>");
    return;
  }

  elements.socialLinks.innerHTML = `<a href="${links}" target="_blank" rel="noopener noreferrer">${links}</a>`;
}

function renderOrganizer(user) {
  const displayName = getDisplayName(user);
  const status = getStatus(user);

  elements.orgTitle.textContent = displayName;
  elements.orgName.textContent = displayName;
  elements.email.textContent = user.email || "—";
  elements.phoneNumber.textContent =
    user.phoneNumber ||
    user.phone ||
    user.mobile ||
    "—";
  elements.location.textContent = getLocation(user);
  elements.description.textContent =
    user.description ||
    user.bio ||
    "No description available.";

  renderSocialLinks(user);

  elements.statusBadge.className = `status-badge ${status}`;
  elements.statusBadge.textContent = getStatusText(status);
}

async function loadOrganizerDetails() {
  organizerId = getOrganizerIdFromURL();

  if (!organizerId) {
    elements.orgTitle.textContent = "Organizer not found";
    elements.description.textContent = "No organizer ID was provided in the URL.";
    return;
  }

  try {
    let usersPayload;

    try {
      usersPayload = await apiRequest("/user");
    } catch {
      usersPayload = await apiRequest("/users");
    }

    const users = normalizeUsers(usersPayload);
    const organizer = users.find(
      (user) => String(user._id || user.id) === String(organizerId)
    );

    if (!organizer) {
      throw new Error("Organizer not found.");
    }

    renderOrganizer(organizer);
  } catch (error) {
    elements.orgTitle.textContent = "Error";
    elements.description.textContent = error.message;
    elements.statusBadge.className = "status-badge rejected";
    elements.statusBadge.textContent = "Unavailable";
  }
}

function closeModal() {
  window.location.href = "organization-directory.html";
}

elements.closeBtn.addEventListener("click", closeModal);

elements.overlay.addEventListener("click", (event) => {
  if (event.target === elements.overlay) {
    closeModal();
  }
});

document.addEventListener("DOMContentLoaded", loadOrganizerDetails);









// import { apiRequest, normalizeArray } from "../../assets/js/api.js";
// import { requireAdmin } from "../../assets/js/auth.js";
// import { getQueryParam, getLocationText } from "../../assets/js/utils.js";

// const id = getQueryParam("id");

// document.addEventListener("DOMContentLoaded", async () => {
//   await requireAdmin();
//   try {
//     const payload = await apiRequest("/user");
//     const users = normalizeArray(payload, ["users"]);
//     const org = users.find((u) => String(u._id || u.id) === String(id));
//     document.getElementById("orgName").textContent = org?.fullName || org?.name || org?.organizationName || "Organization";
//     document.getElementById("orgEmail").textContent = org?.email || "—";
//     document.getElementById("orgLocation").textContent = getLocationText(org);
//     document.getElementById("orgDescription").textContent = org?.description || org?.bio || "No description available.";
//   } catch {
//     document.getElementById("orgName").textContent = "Failed to load organization.";
//   }
// });
