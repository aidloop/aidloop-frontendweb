const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const els = {
  orgTitle: document.getElementById("orgTitle"),
  orgName: document.getElementById("orgName"),
  socialLinks: document.getElementById("socialLinks"),
  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  location: document.getElementById("location"),
  description: document.getElementById("description"),
  statusBadge: document.getElementById("statusBadge"),
  rejectBtn: document.getElementById("rejectBtn"),
  approveBtn: document.getElementById("approveBtn"),
  feedback: document.getElementById("feedback")
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

function detectStatus(user) {
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
    return "approved";
  }

  return "awaiting";
}

function getLocationText(user) {
  if (typeof user.location === "string" && user.location.trim()) {
    return user.location;
  }

  if (user.location && typeof user.location === "object") {
    return user.location.city || user.location.venue || user.location.state || "—";
  }

  return user.city || user.state || "—";
}

function renderSocialLinks(user) {
  const links = user.socialLinks || user.website || user.socialLink || user.link || "";

  if (!links) {
    els.socialLinks.textContent = "—";
    return;
  }

  if (Array.isArray(links)) {
    els.socialLinks.innerHTML = links
      .map(link => `<a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a>`)
      .join("<br>");
    return;
  }

  els.socialLinks.innerHTML = `<a href="${links}" target="_blank" rel="noopener noreferrer">${links}</a>`;
}

function setBadge(status) {
  els.statusBadge.className = "status-badge";

  if (status === "approved") {
    els.statusBadge.classList.add("approved");
    els.statusBadge.textContent = "Approved";
    return;
  }

  if (status === "rejected") {
    els.statusBadge.classList.add("rejected");
    els.statusBadge.textContent = "Rejected";
    return;
  }

  els.statusBadge.classList.add("awaiting");
  els.statusBadge.textContent = "Awaiting Verification";
}

function renderOrganizer(user) {
  const displayName = user.fullName || user.name || user.organizationName || "Unnamed Organizer";
  const currentStatus = detectStatus(user);

  els.orgTitle.textContent = displayName;
  els.orgName.textContent = displayName;
  els.email.textContent = user.email || "—";
  els.phoneNumber.textContent = user.phoneNumber || user.phone || user.mobile || "—";
  els.location.textContent = getLocationText(user);
  els.description.textContent = user.description || user.bio || "No description available.";

  renderSocialLinks(user);
  setBadge(currentStatus);

  if (currentStatus === "approved" || currentStatus === "rejected") {
    els.approveBtn.disabled = true;
    els.rejectBtn.disabled = true;
  }
}

function setLoadingState(isLoading) {
  els.approveBtn.disabled = isLoading;
  els.rejectBtn.disabled = isLoading;

  els.approveBtn.textContent = isLoading ? "Processing..." : "Approve";
  els.rejectBtn.textContent = isLoading ? "Processing..." : "Reject";
}

async function loadOrganizer() {
  organizerId = getOrganizerIdFromURL();

  if (!organizerId) {
    els.feedback.textContent = "Organizer ID not found in URL.";
    els.feedback.classList.add("error");
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
      user => String(user._id || user.id) === String(organizerId)
    );

    if (!organizer) {
      throw new Error("Organizer not found.");
    }

    renderOrganizer(organizer);
  } catch (error) {
    els.feedback.textContent = error.message;
    els.feedback.classList.add("error");
  }
}

async function approveOrganizer() {
  try {
    setLoadingState(true);
    els.feedback.textContent = "";

    await apiRequest(`/admin/organizers/${organizerId}/approve`, {
      method: "PATCH"
    });

    setBadge("approved");
    els.feedback.textContent = "Organizer approved successfully.";
    els.feedback.classList.remove("error");
    els.feedback.classList.add("success");

    setTimeout(() => {
      window.location.href = "verification-queue.html";
    }, 1000);
  } catch (error) {
    els.feedback.textContent = error.message;
    els.feedback.classList.remove("success");
    els.feedback.classList.add("error");
  } finally {
    setLoadingState(false);
  }
}

async function rejectOrganizer() {
  try {
    setLoadingState(true);
    els.feedback.textContent = "";

    await apiRequest(`/admin/organizers/${organizerId}/reject`, {
      method: "PATCH"
    });

    setBadge("rejected");
    els.feedback.textContent = "Organizer rejected successfully.";
    els.feedback.classList.remove("error");
    els.feedback.classList.add("success");

    setTimeout(() => {
      window.location.href = "verification-queue.html";
    }, 1000);
  } catch (error) {
    els.feedback.textContent = error.message;
    els.feedback.classList.remove("success");
    els.feedback.classList.add("error");
  } finally {
    setLoadingState(false);
  }
}

els.approveBtn.addEventListener("click", approveOrganizer);
els.rejectBtn.addEventListener("click", rejectOrganizer);

document.addEventListener("DOMContentLoaded", loadOrganizer);
