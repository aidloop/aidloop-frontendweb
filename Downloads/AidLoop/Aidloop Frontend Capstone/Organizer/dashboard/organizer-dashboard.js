import { apiRequest, normalizeArray } from "../assets/js/api.js";
import { requireRole } from "../assets/js/auth.js";
import { formatDate } from "../assets/js/utils.js";
import { ROUTES } from "../assets/js/config.js";
import { logout } from "../assets/js/logout.js";

const els = {
  organizerAvatar: document.getElementById("organizerAvatar"),
  totalEvents: document.getElementById("totalEvents"),
  upcomingEvents: document.getElementById("upcomingEvents"),
  completedEvents: document.getElementById("completedEvents"),
  totalVolunteers: document.getElementById("totalVolunteers"),
  eventsTable: document.getElementById("eventsTable"),
  logoutBtn: document.getElementById("logoutBtn")
};

let organizer = null;
let allEvents = [];

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

  if (raw === "cancelled" || raw === "canceled") return "draft";
  if (raw === "draft") return "draft";
  if (raw === "published") return "published";

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

function computeStats(events) {
  const totalEvents = events.length;
  const upcomingEvents = events.filter((event) => {
    const status = getEventStatus(event);
    return status === "upcoming" || status === "published";
  }).length;

  const completedEvents = events.filter((event) => getEventStatus(event) === "completed").length;

  const totalVolunteers = events.reduce((sum, event) => {
    return sum + (
      event.filledSlots ??
      event.registrationsCount ??
      event.registeredCount ??
      event.attendeesCount ??
      0
    );
  }, 0);

  els.totalEvents.textContent = totalEvents;
  els.upcomingEvents.textContent = upcomingEvents;
  els.completedEvents.textContent = completedEvents;
  els.totalVolunteers.textContent = totalVolunteers;
}

function renderEvents(events) {
  if (!events.length) {
    els.eventsTable.innerHTML = `
      <tr>
        <td colspan="6">No events found.</td>
      </tr>
    `;
    return;
  }

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
    .slice(0, 5);

  els.eventsTable.innerHTML = recentEvents.map((event) => {
    const status = getEventStatus(event);
    const id = event._id || event.id || "";

    return `
      <tr>
        <td>${event.name || event.title || "Untitled Event"}</td>
        <td>${getLocation(event)}</td>
        <td>${formatDate(event.date, "long")}</td>
        <td>${getVolunteerCount(event)}</td>
        <td><span class="status-badge status-${status}">${getStatusText(status)}</span></td>
        <td class="row-actions">
          <a href="../Event-Listing/event-listing.html?id=${encodeURIComponent(id)}" style="color:inherit;">
            <i class="fa-solid fa-ellipsis"></i>
          </a>
        </td>
      </tr>
    `;
  }).join("");
}

async function loadOrganizerDashboard() {
  const payload = await apiRequest("/events");
  const events = normalizeArray(payload, ["events"]);

  const organizerId = String(organizer._id || organizer.id || "");

  allEvents = events.filter((event) => {
    if (typeof event.organizer === "object" && event.organizer) {
      return String(event.organizer._id || event.organizer.id || "") === organizerId;
    }

    return String(event.organizerId || "") === organizerId;
  });

  computeStats(allEvents);
  renderEvents(allEvents);
}

document.addEventListener("DOMContentLoaded", async () => {
  organizer = await requireRole("organizer", ROUTES.organizerLogin);
  if (!organizer) return;

  if (organizer.profileImage) {
    els.organizerAvatar.src = organizer.profileImage;
  }

  els.logoutBtn.addEventListener("click", () => {
    logout(ROUTES.organizerLogin);
  });

  try {
    await loadOrganizerDashboard();
  } catch (error) {
    els.eventsTable.innerHTML = `
      <tr>
        <td colspan="6">Failed to load dashboard data.</td>
      </tr>
    `;
  }
});









// import { apiRequest, normalizeArray } from "../../assets/js/api.js";
// import { requireOrganizer } from "../../assets/js/auth.js";
// import { logout } from "../../assets/js/logout.js";
// import { ROUTES } from "../../assets/js/config.js";
// import { formatDate, getLocationText } from "../../assets/js/utils.js";

// const els = {
//   totalEvents: document.getElementById("totalEvents"),
//   upcomingEvents: document.getElementById("upcomingEvents"),
//   completedEvents: document.getElementById("completedEvents"),
//   totalVolunteers: document.getElementById("totalVolunteers"),
//   eventsTable: document.getElementById("eventsTable"),
//   logoutBtn: document.getElementById("logoutBtn")
// };

// let organizer;

// function getStatus(event) {
//   const raw = String(event.status || "").toLowerCase();
//   if (raw === "draft") return "draft";
//   if (raw === "cancelled" || raw === "canceled") return "cancelled";
//   const eventDate = event.date ? new Date(event.date) : null;
//   if (raw === "published" && eventDate && eventDate < new Date()) return "completed";
//   if (raw === "published") return "published";
//   return "published";
// }

// document.addEventListener("DOMContentLoaded", async () => {
//   organizer = await requireOrganizer();
//   if (!organizer) return;

//   els.logoutBtn.addEventListener("click", () => logout(ROUTES.home));

//   try {
//     const payload = await apiRequest("/events");
//     const allEvents = normalizeArray(payload, ["events"]);
//     const organizerId = String(organizer._id || organizer.id || "");
//     const events = allEvents.filter((event) => {
//       if (typeof event.organizer === "object" && event.organizer) {
//         return String(event.organizer._id || event.organizer.id || "") === organizerId;
//       }
//       return String(event.organizerId || "") === organizerId;
//     });

//     const totalVolunteers = events.reduce((sum, event) => sum + (event.filledSlots ?? event.registrationsCount ?? 0), 0);
//     els.totalEvents.textContent = events.length;
//     els.upcomingEvents.textContent = events.filter((e) => getStatus(e) === "published").length;
//     els.completedEvents.textContent = events.filter((e) => getStatus(e) === "completed").length;
//     els.totalVolunteers.textContent = totalVolunteers;

//     els.eventsTable.innerHTML = events.slice(0, 5).map((event) => `
//       <tr>
//         <td>${event.name || "Untitled Event"}</td>
//         <td>${getLocationText(event)}</td>
//         <td>${formatDate(event.date, "long")}</td>
//         <td>${event.filledSlots ?? event.registrationsCount ?? 0}/${event.volunteerSlots ?? 0}</td>
//         <td><span class="status-badge status-${getStatus(event)}">${getStatus(event)}</span></td>
//       </tr>
//     `).join("") || `<tr><td colspan="5">No events found.</td></tr>`;
//   } catch {
//     els.eventsTable.innerHTML = `<tr><td colspan="5">Failed to load dashboard data.</td></tr>`;
//   }
// });
