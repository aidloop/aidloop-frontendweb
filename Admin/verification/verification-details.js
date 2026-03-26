const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const els = {
  orgTitle: document.getElementById("orgTitle"),
  statusBadge: document.getElementById("statusBadge"),
  orgName: document.getElementById("orgName"),
  socialLinks: document.getElementById("socialLinks"),
  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  location: document.getElementById("location"),
  description: document.getElementById("description"),
  rejectBtn: document.getElementById("rejectBtn"),
  approveBtn: document.getElementById("approveBtn"),
  feedback: document.getElementById("feedback")
};

const organizerId = new URLSearchParams(window.location.search).get("id");
let currentOrganizer = null;

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

function getVerificationStatus(user) {
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
      : "Awaiting Verification";

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

function setFeedback(message, type = "") {
  els.feedback.textContent = message;
  els.feedback.className = "feedback";
  if (type) {
    els.feedback.classList.add(type);
  }
}

function populateOrganizer(user) {
  const status = getVerificationStatus(user);

  currentOrganizer = user;

  els.orgTitle.textContent = getDisplayName(user);
  els.orgName.textContent = getDisplayName(user);
  els.email.textContent = user.email || "—";
  els.phoneNumber.textContent =
    user.phoneNumber || user.phone || "—";
  els.location.textContent = getLocation(user);
  els.description.textContent =
    user.description ||
    user.bio ||
    "No organization description available.";

  renderSocialLinks(user);
  setStatusBadge(status);

  if (status === "verified") {
    els.approveBtn.disabled = true;
  }

  if (status === "rejected") {
    els.rejectBtn.disabled = true;
  }
}

async function loadOrganizerDetails() {
  if (!organizerId) {
    setFeedback("No organizer ID provided.", "error");
    els.rejectBtn.disabled = true;
    els.approveBtn.disabled = true;
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
    els.description.textContent = "Failed to fetch organizer details.";
    setFeedback(error.message || "Failed to load organizer details.", "error");
    els.rejectBtn.disabled = true;
    els.approveBtn.disabled = true;
  }
}

async function approveOrganizer() {
  if (!organizerId) return;

  try {
    els.approveBtn.disabled = true;
    els.rejectBtn.disabled = true;

    await apiRequest(`/admin/organizers/${organizerId}/approve`, {
      method: "PATCH"
    });

    setStatusBadge("verified");
    setFeedback("Organizer approved successfully.", "success");

    setTimeout(() => {
      window.location.href = "verification-queue.html";
    }, 900);
  } catch (error) {
    els.approveBtn.disabled = false;
    els.rejectBtn.disabled = false;
    setFeedback(error.message || "Failed to approve organizer.", "error");
  }
}

async function rejectOrganizer() {
  if (!organizerId) return;

  try {
    els.approveBtn.disabled = true;
    els.rejectBtn.disabled = true;

    await apiRequest(`/admin/organizers/${organizerId}/reject`, {
      method: "PATCH"
    });

    setStatusBadge("rejected");
    setFeedback("Organizer rejected successfully.", "success");

    setTimeout(() => {
      window.location.href = "verification-queue.html";
    }, 900);
  } catch (error) {
    els.approveBtn.disabled = false;
    els.rejectBtn.disabled = false;
    setFeedback(error.message || "Failed to reject organizer.", "error");
  }
}

els.approveBtn.addEventListener("click", approveOrganizer);
els.rejectBtn.addEventListener("click", rejectOrganizer);

document.addEventListener("DOMContentLoaded", loadOrganizerDetails);
