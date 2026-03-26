const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const els = {
  eventTitle: document.getElementById("eventTitle"),
  statusBadge: document.getElementById("statusBadge"),
  orgName: document.getElementById("orgName"),
  socialLinks: document.getElementById("socialLinks"),
  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  dateTime: document.getElementById("dateTime"),
  slotsFilled: document.getElementById("slotsFilled"),
  description: document.getElementById("description"),
  feedback: document.getElementById("feedback"),
  closeBtn: document.getElementById("closeBtn"),
  flagBtn: document.getElementById("flagBtn")
};

const eventId = new URLSearchParams(window.location.search).get("id");
let currentEvent = null;

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

function formatTimeValue(value) {
  if (!value) return "";
  if (String(value).includes("AM") || String(value).includes("PM")) return value;

  const [hours, minutes] = String(value).split(":");
  if (!hours || !minutes) return value;

  const hourNum = Number(hours);
  const suffix = hourNum >= 12 ? "PM" : "AM";
  const normalizedHour = hourNum % 12 || 12;
  return `${normalizedHour}:${minutes} ${suffix}`;
}

function getStatusValue(event) {
  const status = String(event.status || "").toLowerCase();

  if (status.includes("cancel")) return "cancelled";
  if (status.includes("draft")) return "draft";
  return "published";
}

function setStatusBadge(status) {
  const normalized = getStatusValue({ status });
  els.statusBadge.textContent =
    normalized.charAt(0).toUpperCase() + normalized.slice(1);

  els.statusBadge.className = "status-badge";
  els.statusBadge.classList.add(normalized);
}

function getOrganizerName(event) {
  return (
    event.organizer?.fullName ||
    event.organizer?.name ||
    event.organizerName ||
    "—"
  );
}

function getOrganizerEmail(event) {
  return (
    event.organizer?.email ||
    event.contactEmail ||
    event.email ||
    "—"
  );
}

function getOrganizerPhone(event) {
  return (
    event.organizer?.phoneNumber ||
    event.organizer?.phone ||
    event.phoneNumber ||
    event.phone ||
    "—"
  );
}

function getSocialLink(event) {
  return (
    event.organizer?.website ||
    event.organizer?.socialLink ||
    event.organizer?.socialLinks?.[0] ||
    event.website ||
    event.socialLink ||
    event.socialLinks?.[0] ||
    ""
  );
}

function renderSocialLinks(link) {
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

function getSlotsFilled(event) {
  const filled =
    event.filledSlots ??
    event.registrationsCount ??
    event.registeredCount ??
    event.attendeesCount ??
    0;

  const total = event.volunteerSlots ?? event.slots ?? 0;
  return `${filled} / ${total}`;
}

function populateEvent(event) {
  els.eventTitle.textContent = event.name || event.title || "Untitled Event";
  setStatusBadge(event.status);

  els.orgName.textContent = getOrganizerName(event);
  els.email.textContent = getOrganizerEmail(event);
  els.phoneNumber.textContent = getOrganizerPhone(event);

  renderSocialLinks(getSocialLink(event));

  const formattedDate = formatDate(event.date);
  const startTime = formatTimeValue(event.startTime);
  const endTime = formatTimeValue(event.endTime);

  els.dateTime.textContent =
    startTime && endTime
      ? `${formattedDate} • ${startTime} - ${endTime}`
      : startTime
      ? `${formattedDate} • ${startTime}`
      : formattedDate;

  els.slotsFilled.textContent = getSlotsFilled(event);
  els.description.textContent =
    event.description || "No event description available.";
}

function setFeedback(message, type = "") {
  els.feedback.textContent = message;
  els.feedback.className = "feedback";
  if (type) {
    els.feedback.classList.add(type);
  }
}

async function loadEventDetails() {
  if (!eventId) {
    setFeedback("No event ID provided.", "error");
    els.flagBtn.disabled = true;
    return;
  }

  try {
    const payload = await apiRequest("/events");
    const events = normalizeEvents(payload);

    currentEvent = events.find(
      (event) => String(event._id || event.id) === String(eventId)
    );

    if (!currentEvent) {
      throw new Error("Event not found");
    }

    populateEvent(currentEvent);
  } catch (error) {
    els.eventTitle.textContent = "Unable to load event";
    els.description.textContent = "Failed to fetch event details.";
    setFeedback(error.message || "Failed to load event details.", "error");
    els.flagBtn.disabled = true;
  }
}

async function flagEvent() {
  if (!eventId) return;

  try {
    els.flagBtn.disabled = true;
    els.flagBtn.textContent = "Flagging...";

    await apiRequest(`/events/${eventId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({
        reason: "Flagged by admin"
      })
    });

    setFeedback("Event flagged and cancelled successfully.", "success");
    setStatusBadge("cancelled");
  } catch (error) {
    setFeedback(error.message || "Failed to flag event.", "error");
    els.flagBtn.disabled = false;
    els.flagBtn.textContent = "Flag Event";
  }
}

function closeModal() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.href = "events-oversight.html";
}

els.closeBtn.addEventListener("click", closeModal);
els.flagBtn.addEventListener("click", flagEvent);

document.addEventListener("DOMContentLoaded", loadEventDetails);