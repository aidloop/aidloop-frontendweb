const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const elements = {
  overlay: document.getElementById("overlay"),
  closeBtn: document.getElementById("closeBtn"),
  flagBtn: document.getElementById("flagBtn"),
  eventTitle: document.getElementById("eventTitle"),
  orgName: document.getElementById("orgName"),
  socialLinks: document.getElementById("socialLinks"),
  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  dateTime: document.getElementById("dateTime"),
  slotsFilled: document.getElementById("slotsFilled"),
  description: document.getElementById("description"),
  statusBadge: document.getElementById("statusBadge"),
  feedback: document.getElementById("feedback")
};

let eventId = null;
let currentEvent = null;

function getEventIdFromURL() {
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

function getEventStatus(event) {
  const status = String(event.status || "").toLowerCase();
  if (status === "cancelled" || status === "canceled") return "cancelled";
  if (status === "flagged") return "flagged";
  return "published";
}

function setStatusBadge(status) {
  elements.statusBadge.className = `status-badge ${status}`;

  if (status === "cancelled") {
    elements.statusBadge.textContent = "Cancelled";
    return;
  }

  if (status === "flagged") {
    elements.statusBadge.textContent = "Flagged";
    return;
  }

  elements.statusBadge.textContent = "Published";
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

function getOrganizerEmail(event) {
  if (typeof event.organizer === "object" && event.organizer) {
    return event.organizer.email || "—";
  }

  return event.contactEmail || event.email || "—";
}

function getOrganizerPhone(event) {
  if (typeof event.organizer === "object" && event.organizer) {
    return event.organizer.phoneNumber || event.organizer.phone || "—";
  }

  return event.phoneNumber || event.phone || "—";
}

function renderSocialLinks(event) {
  const organizer = event.organizer && typeof event.organizer === "object"
    ? event.organizer
    : {};

  const links =
    organizer.socialLinks ||
    organizer.website ||
    organizer.socialLink ||
    organizer.link ||
    event.socialLinks ||
    event.website ||
    "";

  if (!links) {
    elements.socialLinks.textContent = "—";
    return;
  }

  if (Array.isArray(links)) {
    elements.socialLinks.innerHTML = links
      .map(
        (link) =>
          `<a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a>`
      )
      .join("<br>");
    return;
  }

  elements.socialLinks.innerHTML = `<a href="${links}" target="_blank" rel="noopener noreferrer">${links}</a>`;
}

function getLocation(event) {
  if (typeof event.location === "string" && event.location.trim()) {
    return event.location;
  }

  if (event.location && typeof event.location === "object") {
    const venue = event.location.venue || "";
    const city = event.location.city || "";
    const state = event.location.state || "";
    return [venue, city || state].filter(Boolean).join(", ") || "—";
  }

  return event.city || "—";
}

function getSlotsText(event) {
  const filled =
    event.filledSlots ??
    event.registrationsCount ??
    event.registeredCount ??
    event.attendeesCount ??
    0;

  const total =
    event.volunteerSlots ??
    event.totalSlots ??
    event.capacity ??
    "—";

  return `${filled} / ${total} Volunteers`;
}

function renderEvent(event) {
  currentEvent = event;

  const status = getEventStatus(event);

  elements.eventTitle.textContent = event.name || event.title || "Untitled Event";
  elements.orgName.textContent = getOrganizerName(event);
  elements.email.textContent = getOrganizerEmail(event);
  elements.phoneNumber.textContent = getOrganizerPhone(event);

  const datePart = formatDate(event.date);
  const start = event.startTime || "";
  const end = event.endTime ? ` - ${event.endTime}` : "";
  elements.dateTime.innerHTML = `${datePart}${start ? `<br>${start}${end}` : ""}`;

  elements.slotsFilled.textContent = getSlotsText(event);
  elements.description.textContent = event.description || "No event description available.";

  renderSocialLinks(event);
  setStatusBadge(status);

  if (status === "cancelled" || status === "flagged") {
    elements.flagBtn.disabled = true;
    elements.flagBtn.textContent = status === "cancelled" ? "Cancelled" : "Flagged";
  } else {
    elements.flagBtn.disabled = false;
    elements.flagBtn.textContent = "Flag Event";
  }
}

async function loadEventDetails() {
  eventId = getEventIdFromURL();

  if (!eventId) {
    elements.eventTitle.textContent = "Event not found";
    elements.description.textContent = "No event ID was provided in the URL.";
    return;
  }

  try {
    const event = await apiRequest(`/events/${eventId}`);
    renderEvent(event);
  } catch (error) {
    elements.eventTitle.textContent = "Error";
    elements.description.textContent = error.message;
    elements.statusBadge.className = "status-badge cancelled";
    elements.statusBadge.textContent = "Unavailable";
  }
}

async function flagEvent() {
  if (!currentEvent) return;

  const confirmed = window.confirm("Flag this event? This will cancel it.");
  if (!confirmed) return;

  try {
    elements.flagBtn.disabled = true;
    elements.flagBtn.textContent = "Processing...";
    elements.feedback.textContent = "";

    try {
      await apiRequest(`/events/${eventId}/cancel/admin`, {
        method: "PATCH",
        body: JSON.stringify({
          reason: "Flagged by admin"
        })
      });
    } catch {
      await apiRequest(`/events/${eventId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({
          reason: "Flagged by admin"
        })
      });
    }

    currentEvent.status = "cancelled";
    renderEvent(currentEvent);

    elements.feedback.textContent = "Event flagged successfully.";
    elements.feedback.className = "feedback success";
  } catch (error) {
    elements.feedback.textContent = error.message;
    elements.feedback.className = "feedback error";
    renderEvent(currentEvent);
  }
}

function closeModal() {
  window.location.href = "events-oversight.html";
}

elements.closeBtn.addEventListener("click", closeModal);
elements.flagBtn.addEventListener("click", flagEvent);

elements.overlay.addEventListener("click", (event) => {
  if (event.target === elements.overlay) {
    closeModal();
  }
});

document.addEventListener("DOMContentLoaded", loadEventDetails);












// import { apiRequest, normalizeArray } from "../../assets/js/api.js";
// import { requireAdmin } from "../../assets/js/auth.js";
// import { getQueryParam, formatDate, getLocationText } from "../../assets/js/utils.js";

// const id = getQueryParam("id");
// let currentEvent = null;

// async function load() {
//   const payload = await apiRequest("/events");
//   const events = normalizeArray(payload, ["events"]);
//   currentEvent = events.find((e) => String(e._id || e.id) === String(id));
//   document.getElementById("eventTitle").textContent = currentEvent?.name || "Event not found";
//   document.getElementById("eventInfo").textContent = `${formatDate(currentEvent?.date, "long")} • ${getLocationText(currentEvent)}`;
// }

// document.getElementById("cancelBtn").addEventListener("click", async () => {
//   try {
//     await apiRequest(`/events/${id}/cancel`, { method: "PATCH", body: JSON.stringify({ reason: "Flagged by admin" }) });
//     document.getElementById("feedback").textContent = "Event cancelled successfully.";
//     document.getElementById("feedback").className = "success-message";
//   } catch (err) {
//     document.getElementById("feedback").textContent = err.message || "Failed to cancel event.";
//     document.getElementById("feedback").className = "form-error";
//   }
// });

// document.addEventListener("DOMContentLoaded", async () => { await requireAdmin(); await load(); });
