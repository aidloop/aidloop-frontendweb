import { apiRequest } from "../../assets/js/api.js";
import { requireRole } from "../../assets/js/auth.js";
import { logout } from "../../assets/js/logout.js";

const els = {
  name: document.getElementById("eventName"),
  image: document.getElementById("eventImage"),
  description: document.getElementById("eventDescription"),
  time: document.getElementById("eventTime"),
  date: document.getElementById("eventDate"),
  location: document.getElementById("eventLocation"),
  requirements: document.getElementById("requirementsList"),
  totalSlots: document.getElementById("totalSlots"),
  registered: document.getElementById("registered"),
  remaining: document.getElementById("remaining"),
  table: document.getElementById("volunteerTable"),
  statusBadge: document.getElementById("statusBadge"),
  cancelBtn: document.getElementById("cancelBtn"),
  editBtn: document.getElementById("editBtn"),
  logoutBtn: document.getElementById("logoutBtn")
};

const eventId = new URLSearchParams(window.location.search).get("id");

let eventData = null;

function setStatus(status) {
  els.statusBadge.textContent = status;
  els.statusBadge.className = `status-badge status-${status}`;
}

async function loadEvent() {
  const events = await apiRequest("/events");
  eventData = events.find(e => e._id === eventId);

  if (!eventData) {
    els.name.textContent = "Event not found";
    return;
  }

  els.name.textContent = eventData.name;
  els.image.src = eventData.image;
  els.description.textContent = eventData.description;

  els.time.textContent = `${eventData.startTime} - ${eventData.endTime}`;
  els.date.textContent = eventData.date;
  els.location.textContent = eventData.location?.venue + ", " + eventData.location?.city;

  setStatus(eventData.status);

  // Requirements
  els.requirements.innerHTML = eventData.requirements
    .map(r => `<li>${r}</li>`)
    .join("");

  // Stats
  els.totalSlots.textContent = eventData.volunteerSlots;

  await loadVolunteers();
}

async function loadVolunteers() {
  const data = await apiRequest(`/applications/events/${eventId}/registrations`);

  const volunteers = Array.isArray(data) ? data : data.data || [];

  els.registered.textContent = volunteers.length;
  els.remaining.textContent = eventData.volunteerSlots - volunteers.length;

  if (!volunteers.length) {
    els.table.innerHTML = `<tr><td colspan="4">No volunteers yet</td></tr>`;
    return;
  }

  els.table.innerHTML = volunteers.map(v => `
    <tr>
      <td>${v.user?.fullName || "Unknown"}</td>
      <td>${v.user?.email || "—"}</td>
      <td>${new Date(v.createdAt).toDateString()}</td>
      <td><span class="status-published">Confirmed</span></td>
    </tr>
  `).join("");
}

// Cancel event
els.cancelBtn.addEventListener("click", async () => {
  if (!confirm("Cancel this event?")) return;

  await apiRequest(`/events/${eventId}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason: "Cancelled by organizer" })
  });

  alert("Event cancelled");
  location.reload();
});

// Edit
els.editBtn.addEventListener("click", () => {
  window.location.href = `create-event.html?id=${eventId}`;
});

// Logout
els.logoutBtn.addEventListener("click", () => {
  logout("../login/organizer-login.html/");
  
});

// Init
document.addEventListener("DOMContentLoaded", async () => {
  await requireRole("organizer", "../login/organizer-login.html");
  await loadEvent();
});
