const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const els = {
  closeBtn: document.getElementById("closeBtn"),
  orgTitle: document.getElementById("orgTitle"),
  statusBadge: document.getElementById("statusBadge"),
  orgName: document.getElementById("orgName"),
  socialLinks: document.getElementById("socialLinks"),
  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  location: document.getElementById("location"),
  description: document.getElementById("description")
};

const organizerId = new URLSearchParams(window.location.search).get("id");

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
  return user.fullName || user.name || user.organizationName || "Organization";
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

  return "awaiting";
}

function setStatusBadge(status) {
  els.statusBadge.textContent =
    status === "verified"
      ? "Verified"
      : status === "rejected"
      ? "Rejected"
      : "Awaiting";

  els.statusBadge.className = "status-badge";
  els.statusBadge.classList.add(status);
}

function renderSocialLinks(user) {
  const link =
    user.website ||
    user.socialLink ||
    user.socialLinks?.[0] ||
    "";

  if (!link) {
    els.socialLinks.textContent = "—";
    return;
  }

  els.socialLinks.innerHTML = `
    <a class="social-link" href="${link}" target="_blank" rel="noopener noreferrer">
      ${link}
    </a>
  `;
}

function populateOrganizer(user) {
  const status = getOrganizerStatus(user);

  els.orgTitle.textContent = getDisplayName(user);
  els.orgName.textContent = getDisplayName(user);
  els.email.textContent = user.email || "—";
  els.phoneNumber.textContent = user.phoneNumber || user.phone || "—";
  els.location.textContent = getLocation(user);
  els.description.innerHTML = `<p>${
    user.description ||
    user.bio ||
    "No organization description available."
  }</p>`;

  renderSocialLinks(user);
  setStatusBadge(status);
}

async function loadOrganizerDetails() {
  if (!organizerId) {
    els.orgTitle.textContent = "No organizer selected";
    els.description.innerHTML = "<p>No organizer ID provided.</p>";
    return;
  }

  try {
    let payload;

    try {
      payload = await apiRequest("/user");
    } catch {
      payload = await apiRequest("/users");
    }

    const users = normalizeUsers(payload);

    const organizer = users.find(
      (user) => String(user._id || user.id) === String(organizerId)
    );

    if (!organizer) {
      throw new Error("Organizer not found");
    }

    populateOrganizer(organizer);
  } catch (error) {
    els.orgTitle.textContent = "Unable to load organizer";
    els.description.innerHTML = `<p>${error.message || "Failed to fetch organizer details."}</p>`;
  }
}

function closeModal() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.href = "organization-directory.html";
}

els.closeBtn.addEventListener("click", closeModal);

document.addEventListener("DOMContentLoaded", loadOrganizerDetails);