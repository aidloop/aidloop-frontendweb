import { apiRequest, normalizeArray } from "../../assets/js/api.js";
import { requireOrganizer } from "../../assets/js/auth.js";
import { logout } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";
import { formatDate, getLocationText } from "../../assets/js/utils.js";

const els = {
  totalEvents: document.getElementById("totalEvents"),
  upcomingEvents: document.getElementById("upcomingEvents"),
  completedEvents: document.getElementById("completedEvents"),
  totalVolunteers: document.getElementById("totalVolunteers"),
  eventsTable: document.getElementById("eventsTable"),
  logoutBtn: document.getElementById("logoutBtn")
};

let organizer;

function getStatus(event) {
  const raw = String(event.status || "").toLowerCase();
  if (raw === "draft") return "draft";
  if (raw === "cancelled" || raw === "canceled") return "cancelled";
  const eventDate = event.date ? new Date(event.date) : null;
  if (raw === "published" && eventDate && eventDate < new Date()) return "completed";
  if (raw === "published") return "published";
  return "published";
}

document.addEventListener("DOMContentLoaded", async () => {
  organizer = await requireOrganizer();
  if (!organizer) return;

  els.logoutBtn.addEventListener("click", () => logout(ROUTES.home));

  try {
    const payload = await apiRequest("/events");
    const allEvents = normalizeArray(payload, ["events"]);
    const organizerId = String(organizer._id || organizer.id || "");
    const events = allEvents.filter((event) => {
      if (typeof event.organizer === "object" && event.organizer) {
        return String(event.organizer._id || event.organizer.id || "") === organizerId;
      }
      return String(event.organizerId || "") === organizerId;
    });

    const totalVolunteers = events.reduce((sum, event) => sum + (event.filledSlots ?? event.registrationsCount ?? 0), 0);
    els.totalEvents.textContent = events.length;
    els.upcomingEvents.textContent = events.filter((e) => getStatus(e) === "published").length;
    els.completedEvents.textContent = events.filter((e) => getStatus(e) === "completed").length;
    els.totalVolunteers.textContent = totalVolunteers;

    els.eventsTable.innerHTML = events.slice(0, 5).map((event) => `
      <tr>
        <td>${event.name || "Untitled Event"}</td>
        <td>${getLocationText(event)}</td>
        <td>${formatDate(event.date, "long")}</td>
        <td>${event.filledSlots ?? event.registrationsCount ?? 0}/${event.volunteerSlots ?? 0}</td>
        <td><span class="status-badge status-${getStatus(event)}">${getStatus(event)}</span></td>
      </tr>
    `).join("") || `<tr><td colspan="5">No events found.</td></tr>`;
  } catch {
    els.eventsTable.innerHTML = `<tr><td colspan="5">Failed to load dashboard data.</td></tr>`;
  }
});
