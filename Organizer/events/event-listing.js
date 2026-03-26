import { apiRequest, normalizeArray } from "../../assets/js/api.js";
import { requireOrganizer } from "../../assets/js/auth.js";
import { logout } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";
import { formatDate, getLocationText } from "../../assets/js/utils.js";

const table = document.getElementById("eventsTable");
document.getElementById("logoutBtn").addEventListener("click", () => logout(ROUTES.home));

function statusOf(event) {
  const raw = String(event.status || "").toLowerCase();
  if (raw === "cancelled" || raw === "canceled") return "cancelled";
  if (raw === "draft") return "draft";
  if (raw === "published" && event.date && new Date(event.date) < new Date()) return "completed";
  return raw || "published";
}

document.addEventListener("DOMContentLoaded", async () => {
  const organizer = await requireOrganizer();
  if (!organizer) return;

  try {
    const payload = await apiRequest("/events");
    const events = normalizeArray(payload, ["events"]);
    const organizerId = String(organizer._id || organizer.id || "");
    const own = events.filter((event) => {
      if (typeof event.organizer === "object" && event.organizer) {
        return String(event.organizer._id || event.organizer.id || "") === organizerId;
      }
      return String(event.organizerId || "") === organizerId;
    });

    table.innerHTML = own.map((event) => `
      <tr>
        <td>${event.name || "Untitled Event"}</td>
        <td>${getLocationText(event)}</td>
        <td>${formatDate(event.date, "long")}</td>
        <td>${event.filledSlots ?? event.registrationsCount ?? 0}/${event.volunteerSlots ?? 0}</td>
        <td><span class="status-badge status-${statusOf(event)}">${statusOf(event)}</span></td>
        <td><a href="event-details.html?id=${encodeURIComponent(event._id || event.id)}">Details</a></td>
      </tr>
    `).join("") || `<tr><td colspan="6">No events found.</td></tr>`;
  } catch {
    table.innerHTML = `<tr><td colspan="6">Failed to load events.</td></tr>`;
  }
});
