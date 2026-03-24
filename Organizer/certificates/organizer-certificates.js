import { apiRequest, normalizeArray } from "../../assets/js/api.js";
import { requireOrganizer } from "../../assets/js/auth.js";
import { logout } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";
import { formatDate } from "../../assets/js/utils.js";

const els = {
  totalCertificates: document.getElementById("totalCertificates"),
  issuedCertificates: document.getElementById("issuedCertificates"),
  pendingCertificates: document.getElementById("pendingCertificates"),
  certificatesTable: document.getElementById("certificatesTable"),
  tableCountText: document.getElementById("tableCountText"),
  logoutBtn: document.getElementById("logoutBtn")
};

function rowKey(userId, eventId) { return `${String(userId)}::${String(eventId)}`; }
function avatar(user) { return user?.profileImage || "https://i.pravatar.cc/100?img=12"; }

function normalizeIssued(records) {
  return records.map((item) => ({
    status: "issued",
    certificateId: item._id || item.id || item.certificateId || "",
    userId: item.user?._id || item.user?.id || item.volunteer?._id || item.volunteer?.id || item.userId || "",
    eventId: item.event?._id || item.event?.id || item.eventId || "",
    userName: item.user?.fullName || item.user?.name || item.volunteer?.fullName || item.volunteer?.name || item.volunteerName || "Unknown Volunteer",
    userAvatar: avatar(item.user || item.volunteer),
    eventName: item.event?.name || item.eventName || "Untitled Event",
    date: item.issuedAt || item.createdAt || item.event?.date || ""
  }));
}

function render(rows) {
  els.totalCertificates.textContent = rows.length;
  els.issuedCertificates.textContent = rows.filter((r) => r.status === "issued").length;
  els.pendingCertificates.textContent = rows.filter((r) => r.status === "pending").length;
  els.tableCountText.textContent = `Showing ${rows.length} of ${rows.length} certificates`;
  els.certificatesTable.innerHTML = rows.map((row) => `
    <tr>
      <td><div class="person-cell"><img class="avatar" src="${row.userAvatar}" alt="${row.userName}" /><span>${row.userName}</span></div></td>
      <td>${row.eventName}</td>
      <td>${formatDate(row.date, "long")}</td>
      <td><span class="status-badge ${row.status === "issued" ? "status-issued" : "status-pending"}">${row.status === "issued" ? "Issued" : "Pending"}</span></td>
      <td>${row.status === "issued" && row.certificateId ? `<a href="../../Admin/certificates/certificate-preview.html?id=${encodeURIComponent(row.certificateId)}">View</a>` : "..."}</td>
    </tr>
  `).join("") || `<tr><td colspan="5">No certificate records found.</td></tr>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const organizer = await requireOrganizer();
  if (!organizer) return;
  els.logoutBtn.addEventListener("click", () => logout(ROUTES.home));

  try {
    const eventsPayload = await apiRequest("/events");
    const allEvents = normalizeArray(eventsPayload, ["events"]);
    const organizerId = String(organizer._id || organizer.id || "");
    const ownEvents = allEvents.filter((event) => {
      if (typeof event.organizer === "object" && event.organizer) {
        return String(event.organizer._id || event.organizer.id || "") === organizerId;
      }
      return String(event.organizerId || "") === organizerId;
    });

    const registrations = [];
    for (const event of ownEvents) {
      const data = await apiRequest(`/applications/events/${event._id || event.id}/registrations`);
      const regs = Array.isArray(data) ? data : data.data || [];
      regs.forEach((reg) => registrations.push({ ...reg, _eventId: event._id || event.id, _eventName: event.name || "Untitled Event", _eventDate: event.date }));
    }

    let issuedPayload = [];
    try { issuedPayload = await apiRequest("/certificates/my-certificates"); } catch { issuedPayload = []; }
    const issuedRows = normalizeIssued(normalizeArray(issuedPayload, ["certificates"]));
    const issuedKeys = new Set(issuedRows.map((r) => rowKey(r.userId, r.eventId)));

    const pendingRows = registrations
      .filter((reg) => !issuedKeys.has(rowKey(reg.user?._id || reg.user?.id || "", reg._eventId || "")))
      .map((reg) => ({
        status: "pending",
        certificateId: "",
        userId: reg.user?._id || reg.user?.id || "",
        eventId: reg._eventId,
        userName: reg.user?.fullName || reg.user?.name || "Unknown Volunteer",
        userAvatar: avatar(reg.user),
        eventName: reg._eventName,
        date: reg._eventDate || reg.createdAt || ""
      }));

    render([...issuedRows, ...pendingRows].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
  } catch {
    els.certificatesTable.innerHTML = `<tr><td colspan="5">Failed to load certificates.</td></tr>`;
  }
});
