import { apiRequest, normalizeArray } from "../assets/js/api.js";
import { requireRole } from "../assets/js/auth.js";
import { formatDate } from "../assets/js/utils.js";
import { ROUTES } from "../assets/js/config.js";
import { logout } from "../assets/js/logout.js";
import { bindFilterButtons } from "../assets/js/ui.js";

const els = {
  organizerAvatar: document.getElementById("organizerAvatar"),
  eventsTable: document.getElementById("eventsTable"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  logoutBtn: document.getElementById("logoutBtn")
};

let organizer = null;
let allEvents = [];
let currentFilter = "all";

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

function getEventStatus(event) {
  const raw = String(event.status || "").toLowerCase();

  if (raw === "cancelled" || raw === "canceled") return "cancelled";
  if (raw === "draft") return "draft";
  if (raw === "published") {
    const eventDate = event.date ? new Date(event.date) : null;
    const now = new Date();

    if (eventDate && !Number.isNaN(eventDate.getTime()) && eventDate < now) {
      return "completed";
    }

    return "published";
  }

  const eventDate = event.date ? new Date(event.date) : null;
  const now = new Date();

  if (eventDate && !Number.isNaN(eventDate.getTime()) && eventDate < now) {
    return "completed";
  }

  return "upcoming";
}

function getStatusText(status) {
  if (status === "published") return "Published";
  if (status === "draft") return "Draft";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Upcoming";
}

function getVolunteerCount(event) {
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
    0;

  return `${filled}/${total}`;
}

function renderEvents() {
  let filtered = [...allEvents];

  if (currentFilter !== "all") {
    filtered = filtered.filter((event) => getEventStatus(event) === currentFilter);
  }

  filtered.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));

  if (!filtered.length) {
    els.eventsTable.innerHTML = `
      <tr>
        <td colspan="6">No events found.</td>
      </tr>
    `;
    return;
  }

  els.eventsTable.innerHTML = filtered.map((event) => {
    const status = getEventStatus(event);
    const id = event._id || event.id || "";

    return `
      <tr>
        <td>${event.name || event.title || "Untitled Event"}</td>
        <td>${getLocation(event)}</td>
        <td>${formatDate(event.date, "long")}</td>
        <td>${getVolunteerCount(event)}</td>
        <td>
          <span class="status-badge status-${status}">
            ${getStatusText(status)}
          </span>
        </td>
        <td class="row-actions">
          <a href="event-details.html?id=${encodeURIComponent(id)}" title="View Event">
            <i class="fa-solid fa-ellipsis"></i>
          </a>
        </td>
      </tr>
    `;
  }).join("");
}

async function loadEvents() {
  const payload = await apiRequest("/events");
  const events = normalizeArray(payload, ["events"]);

  const organizerId = String(organizer._id || organizer.id || "");

  allEvents = events.filter((event) => {
    if (typeof event.organizer === "object" && event.organizer) {
      return String(event.organizer._id || event.organizer.id || "") === organizerId;
    }

    return String(event.organizerId || "") === organizerId;
  });

  renderEvents();
}

document.addEventListener("DOMContentLoaded", async () => {
  organizer = await requireRole("organizer", ROUTES.organizerLogin);
  if (!organizer) return;

  if (organizer.profileImage) {
    els.organizerAvatar.src = organizer.profileImage;
  }

  bindFilterButtons(els.filterButtons, (filter) => {
    currentFilter = filter;
    renderEvents();
  });

  els.logoutBtn.addEventListener("click", () => {
    logout(ROUTES.organizerLogin);
  });

  try {
    await loadEvents();
  } catch (error) {
    els.eventsTable.innerHTML = `
      <tr>
        <td colspan="6">Failed to load events.</td>
      </tr>
    `;
  }
});









// import { apiRequest, normalizeArray } from "../../assets/js/api.js";
// import { requireOrganizer } from "../../assets/js/auth.js";
// import { logout } from "../../assets/js/logout.js";
// import { ROUTES } from "../../assets/js/config.js";
// import { formatDate, getLocationText } from "../../assets/js/utils.js";

// const table = document.getElementById("eventsTable");
// document.getElementById("logoutBtn").addEventListener("click", () => logout(ROUTES.home));

// function statusOf(event) {
//   const raw = String(event.status || "").toLowerCase();
//   if (raw === "cancelled" || raw === "canceled") return "cancelled";
//   if (raw === "draft") return "draft";
//   if (raw === "published" && event.date && new Date(event.date) < new Date()) return "completed";
//   return raw || "published";
// }

// document.addEventListener("DOMContentLoaded", async () => {
//   const organizer = await requireOrganizer();
//   if (!organizer) return;

//   try {
//     const payload = await apiRequest("/events");
//     const events = normalizeArray(payload, ["events"]);
//     const organizerId = String(organizer._id || organizer.id || "");
//     const own = events.filter((event) => {
//       if (typeof event.organizer === "object" && event.organizer) {
//         return String(event.organizer._id || event.organizer.id || "") === organizerId;
//       }
//       return String(event.organizerId || "") === organizerId;
//     });

//     table.innerHTML = own.map((event) => `
//       <tr>
//         <td>${event.name || "Untitled Event"}</td>
//         <td>${getLocationText(event)}</td>
//         <td>${formatDate(event.date, "long")}</td>
//         <td>${event.filledSlots ?? event.registrationsCount ?? 0}/${event.volunteerSlots ?? 0}</td>
//         <td><span class="status-badge status-${statusOf(event)}">${statusOf(event)}</span></td>
//         <td><a href="event-details.html?id=${encodeURIComponent(event._id || event.id)}">Details</a></td>
//       </tr>
//     `).join("") || `<tr><td colspan="6">No events found.</td></tr>`;
//   } catch {
//     table.innerHTML = `<tr><td colspan="6">Failed to load events.</td></tr>`;
//   }
// });
