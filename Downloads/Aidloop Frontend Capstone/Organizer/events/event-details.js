import { apiRequest } from "../assets/js/api.js";
import { requireRole } from "../assets/js/auth.js";
import { logout } from "../assets/js/logout.js";

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
  logout("../login/login.html");
});

// Init
document.addEventListener("DOMContentLoaded", async () => {
  await requireRole("organizer", "../login/login.html");
  await loadEvent();
});











// import { apiRequest, normalizeArray } from "../../assets/js/api.js";
// import { requireOrganizer } from "../../assets/js/auth.js";
// import { logout } from "../../assets/js/logout.js";
// import { ROUTES } from "../../assets/js/config.js";
// import { getQueryParam, formatDate, getLocationText } from "../../assets/js/utils.js";

// const eventId = getQueryParam("id");
// document.getElementById("logoutBtn").addEventListener("click", () => logout(ROUTES.home));
// document.getElementById("cancelLink").addEventListener("click", (e) => {
//   e.preventDefault();
//   window.location.href = `${ROUTES.organizerCancelEvent}?id=${encodeURIComponent(eventId)}`;
// });

// document.addEventListener("DOMContentLoaded", async () => {
//   await requireOrganizer();
//   try {
//     const payload = await apiRequest("/events");
//     const events = normalizeArray(payload, ["events"]);
//     const event = events.find((e) => String(e._id || e.id) === String(eventId));
//     document.getElementById("eventName").textContent = event?.name || "Event not found";
//     document.getElementById("eventDescription").textContent = event?.description || "";
//     document.getElementById("eventDate").textContent = formatDate(event?.date, "long");
//     document.getElementById("eventLocation").textContent = getLocationText(event);

//     const regsPayload = await apiRequest(`/applications/events/${eventId}/registrations`);
//     const regs = Array.isArray(regsPayload) ? regsPayload : regsPayload.data || [];
//     document.getElementById("volunteerTable").innerHTML = regs.map((v) => `
//       <tr>
//         <td>${v.user?.fullName || "Unknown"}</td>
//         <td>${v.user?.email || "—"}</td>
//         <td>${formatDate(v.createdAt, "long")}</td>
//         <td>${v.attendance || "confirmed"}</td>
//       </tr>
//     `).join("") || `<tr><td colspan="4">No volunteers yet.</td></tr>`;
//   } catch {
//     document.getElementById("volunteerTable").innerHTML = `<tr><td colspan="4">Failed to load event details.</td></tr>`;
//   }
// });
