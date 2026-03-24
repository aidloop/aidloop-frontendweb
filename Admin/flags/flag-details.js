const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const elements = {
  overlay: document.getElementById("overlay"),
  closeBtn: document.getElementById("closeBtn"),
  orgTitle: document.getElementById("orgTitle"),
  orgName: document.getElementById("orgName"),
  severityBadge: document.getElementById("severityBadge"),
  flagReason: document.getElementById("flagReason"),
  lastEventCancelled: document.getElementById("lastEventCancelled"),
  description: document.getElementById("description"),
  contactBtn: document.getElementById("contactBtn"),
  feedback: document.getElementById("feedback")
};

let organizerId = null;
let currentFlagRecord = null;

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

function getSeverity(count) {
  if (count <= 2) return "low";
  if (count <= 4) return "medium";
  return "high";
}

function getSeverityText(severity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
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
    const orgId = String(getOrganizerId(event));
    const organizerName = getOrganizerName(event);

    if (!grouped.has(orgId)) {
      grouped.set(orgId, {
        organizerId: orgId,
        organizerName,
        organizer: usersMap.get(orgId) || null,
        cancellations: 0,
        lastEventDate: null,
        lastEventName: "",
        reason: "Frequent Event Cancellation"
      });
    }

    const record = grouped.get(orgId);
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

  return Array.from(grouped.values()).map((record) => ({
    ...record,
    severity: getSeverity(record.cancellations)
  }));
}

function renderFlagRecord(record) {
  currentFlagRecord = record;

  elements.orgTitle.innerHTML = record.organizerName;
  elements.orgName.innerHTML = record.organizerName;
  elements.flagReason.textContent = record.reason || "Frequent Event Cancellation";
  elements.lastEventCancelled.textContent = record.lastEventName || "—";
  elements.description.textContent =
    record.organizer?.description ||
    record.organizer?.bio ||
    "No organizer description available.";

  elements.severityBadge.className = `severity-badge ${record.severity}`;
  elements.severityBadge.textContent = getSeverityText(record.severity);

  const email = record.organizer?.email || "";
  elements.contactBtn.onclick = () => {
    if (!email) {
      elements.feedback.textContent = "Organizer email not available.";
      elements.feedback.className = "feedback error";
      return;
    }
    window.location.href = `mailto:${email}`;
  };
}

async function loadFlagDetails() {
  organizerId = getOrganizerIdFromURL();

  if (!organizerId) {
    elements.orgTitle.textContent = "Flag not found";
    elements.description.textContent = "No organizer ID was provided in the URL.";
    return;
  }

  try {
    const [eventsPayload, usersPayload] = await Promise.all([
      apiRequest("/events"),
      apiRequest("/user").catch(() => apiRequest("/users"))
    ]);

    const events = normalizeEvents(eventsPayload);
    const users = normalizeUsers(usersPayload);
    const flagRecords = buildFlagData(events, users);

    const record = flagRecords.find(
      (item) => String(item.organizerId) === String(organizerId)
    );

    if (!record) {
      throw new Error("Flag details not found.");
    }

    renderFlagRecord(record);
  } catch (error) {
    elements.orgTitle.textContent = "Error";
    elements.description.textContent = error.message;
    elements.severityBadge.className = "severity-badge high";
    elements.severityBadge.textContent = "Unavailable";
  }
}

function closeModal() {
  window.location.href = "Flags.html";
}

elements.closeBtn.addEventListener("click", closeModal);

elements.overlay.addEventListener("click", (event) => {
  if (event.target === elements.overlay) {
    closeModal();
  }
});

document.addEventListener("DOMContentLoaded", loadFlagDetails);

