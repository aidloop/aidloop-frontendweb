const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const els = {
  closeBtn: document.getElementById("closeBtn"),
  orgTitle: document.getElementById("orgTitle"),
  severityBadge: document.getElementById("severityBadge"),
  orgName: document.getElementById("orgName"),
  flagReason: document.getElementById("flagReason"),
  lastEventCancelled: document.getElementById("lastEventCancelled"),
  description: document.getElementById("description"),
  feedback: document.getElementById("feedback"),
  contactBtn: document.getElementById("contactBtn")
};

const organizerId = new URLSearchParams(window.location.search).get("id");
let currentOrganizer = null;
let currentCancelledEvent = null;

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
    month: "long",
    year: "numeric"
  });
}

function getOrganizerName(user) {
  return user.fullName || user.name || user.organizationName || "Organization";
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

function setSeverity(count) {
  const severity = getSeverity(count);
  els.severityBadge.textContent = getSeverityLabel(count);
  els.severityBadge.className = "severity-badge";
  els.severityBadge.classList.add(severity);
}

function setFeedback(message, type = "") {
  els.feedback.textContent = message;
  els.feedback.className = "feedback";
  if (type) {
    els.feedback.classList.add(type);
  }
}

function populateDetails(organizer, cancelledEvents) {
  const latestCancelled = [...cancelledEvents].sort(
    (a, b) =>
      new Date(b.date || b.updatedAt || b.createdAt || 0) -
      new Date(a.date || a.updatedAt || a.createdAt || 0)
  )[0];

  currentOrganizer = organizer;
  currentCancelledEvent = latestCancelled || null;

  const cancellationsCount = cancelledEvents.length;
  const reason =
    latestCancelled?.cancelReason ||
    latestCancelled?.reason ||
    "Frequent cancellations";

  els.orgTitle.textContent = getOrganizerName(organizer);
  els.orgName.textContent = getOrganizerName(organizer);
  els.flagReason.textContent = reason;

  els.lastEventCancelled.textContent = latestCancelled
    ? `${latestCancelled.name || latestCancelled.title || "Untitled Event"} • ${formatDate(
        latestCancelled.date || latestCancelled.updatedAt || latestCancelled.createdAt
      )}`
    : "—";

  els.description.textContent =
    organizer.description ||
    organizer.bio ||
    "No organizer description available.";

  setSeverity(cancellationsCount);
}

async function loadFlagDetails() {
  if (!organizerId) {
    setFeedback("No organizer ID provided.", "error");
    els.contactBtn.disabled = true;
    return;
  }

  try {
    const [usersPayload, eventsPayload] = await Promise.all([
      apiRequest("/user").catch(() => apiRequest("/users")),
      apiRequest("/events")
    ]);

    const users = normalizeUsers(usersPayload);
    const events = normalizeEvents(eventsPayload);

    const organizer = users.find(
      (user) => String(user._id || user.id) === String(organizerId)
    );

    if (!organizer) {
      throw new Error("Organizer not found");
    }

    const cancelledEvents = events.filter((event) => {
      const eventOrganizerId = String(
        event.organizer?._id ||
        event.organizer?.id ||
        event.organizerId ||
        ""
      );
      const status = String(event.status || "").toLowerCase();
      return (
        eventOrganizerId === String(organizerId) &&
        status.includes("cancel")
      );
    });

    if (!cancelledEvents.length) {
      throw new Error("No flagged cancelled events found for this organizer");
    }

    populateDetails(organizer, cancelledEvents);
  } catch (error) {
    els.orgTitle.textContent = "Unable to load flag details";
    els.description.textContent = "Failed to fetch organizer flag details.";
    setFeedback(error.message || "Failed to load flag details.", "error");
    els.contactBtn.disabled = true;
  }
}

function contactOrganizer() {
  if (!currentOrganizer) return;

  const organizerName = getOrganizerName(currentOrganizer);
  const organizerEmail = currentOrganizer.email || "";
  const subject = encodeURIComponent(`AidLoop Flag Review - ${organizerName}`);
  const body = encodeURIComponent(
    `Hello ${organizerName},\n\nWe are contacting you regarding flagged activity connected to your recent event record on AidLoop.\n\nPlease reply with clarification on the cancelled event and any relevant updates.\n\nThank you.`
  );

  if (!organizerEmail) {
    setFeedback("No organizer email available.", "error");
    return;
  }

  window.location.href = `mailto:${organizerEmail}?subject=${subject}&body=${body}`;
  setFeedback("Opening your email client...", "success");
}

function closeModal() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.href = "flags.html";
}

els.closeBtn.addEventListener("click", closeModal);
els.contactBtn.addEventListener("click", contactOrganizer);

document.addEventListener("DOMContentLoaded", loadFlagDetails);