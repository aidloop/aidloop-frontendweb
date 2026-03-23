import { apiRequest, normalizeArray } from "../assets/js/api.js";
import { requireRole } from "../assets/js/auth.js";
import { logout } from "../assets/js/logout.js";
import { ROUTES } from "../assets/js/config.js";
import { formatDate } from "../assets/js/utils.js";

const els = {
  totalCertificates: document.getElementById("totalCertificates"),
  issuedCertificates: document.getElementById("issuedCertificates"),
  pendingCertificates: document.getElementById("pendingCertificates"),
  certificatesTable: document.getElementById("certificatesTable"),
  tableCountText: document.getElementById("tableCountText"),
  logoutBtn: document.getElementById("logoutBtn")
};

let organizer = null;
let certificateRows = [];

function getAvatar(user) {
  return user?.profileImage || "https://i.pravatar.cc/100?img=12";
}

function getCertificateId(item) {
  return item._id || item.id || item.certificateId || "";
}

function getCertificateUserId(item) {
  return (
    item.user?._id ||
    item.user?.id ||
    item.volunteer?._id ||
    item.volunteer?.id ||
    item.userId ||
    ""
  );
}

function getCertificateEventId(item) {
  return (
    item.event?._id ||
    item.event?.id ||
    item.eventId ||
    ""
  );
}

function getCertificateUserName(item) {
  return (
    item.user?.fullName ||
    item.user?.name ||
    item.volunteer?.fullName ||
    item.volunteer?.name ||
    item.volunteerName ||
    "Unknown Volunteer"
  );
}

function getCertificateUserEmail(item) {
  return (
    item.user?.email ||
    item.volunteer?.email ||
    item.email ||
    "—"
  );
}

function getCertificateEventName(item) {
  return (
    item.event?.name ||
    item.event?.title ||
    item.eventName ||
    "Untitled Event"
  );
}

function rowKey(userId, eventId) {
  return `${String(userId)}::${String(eventId)}`;
}

function normalizeIssuedCertificates(records) {
  return records.map((item) => ({
    type: "certificate",
    status: "issued",
    certificateId: getCertificateId(item),
    userId: getCertificateUserId(item),
    eventId: getCertificateEventId(item),
    userName: getCertificateUserName(item),
    userEmail: getCertificateUserEmail(item),
    userAvatar: getAvatar(item.user || item.volunteer),
    eventName: getCertificateEventName(item),
    date: item.issuedAt || item.createdAt || item.event?.date || "",
    raw: item
  }));
}

async function getOrganizerEvents() {
  const eventsPayload = await apiRequest("/events");
  const allEvents = normalizeArray(eventsPayload, ["events"]);
  const organizerId = String(organizer._id || organizer.id || "");

  return allEvents.filter((event) => {
    if (typeof event.organizer === "object" && event.organizer) {
      return String(event.organizer._id || event.organizer.id || "") === organizerId;
    }
    return String(event.organizerId || "") === organizerId;
  });
}

async function getRegistrationsForEvents(events) {
  const allRegistrations = [];

  for (const event of events) {
    const eventId = event._id || event.id;
    const regsPayload = await apiRequest(`/applications/events/${eventId}/registrations`);
    const registrations = Array.isArray(regsPayload)
      ? regsPayload
      : regsPayload.data || [];

    registrations.forEach((reg) => {
      allRegistrations.push({
        ...reg,
        _eventId: eventId,
        _eventName: event.name || event.title || "Untitled Event",
        _eventDate: event.date || reg.createdAt || ""
      });
    });
  }

  return allRegistrations;
}

function buildPendingRows(registrations, issuedKeys) {
  return registrations
    .filter((reg) => {
      const userId = reg.user?._id || reg.user?.id || "";
      const eventId = reg._eventId || "";
      return !issuedKeys.has(rowKey(userId, eventId));
    })
    .map((reg) => ({
      type: "registration",
      status: "pending",
      certificateId: "",
      userId: reg.user?._id || reg.user?.id || "",
      eventId: reg._eventId || "",
      userName: reg.user?.fullName || reg.user?.name || "Unknown Volunteer",
      userEmail: reg.user?.email || "—",
      userAvatar: getAvatar(reg.user),
      eventName: reg._eventName,
      date: reg._eventDate,
      attendance: String(reg.attendance || "").toLowerCase(),
      raw: reg
    }));
}

function renderStats(rows) {
  const total = rows.length;
  const issued = rows.filter((row) => row.status === "issued").length;
  const pending = rows.filter((row) => row.status === "pending").length;

  els.totalCertificates.textContent = total;
  els.issuedCertificates.textContent = issued;
  els.pendingCertificates.textContent = pending;
}

function renderTable(rows) {
  els.tableCountText.textContent = `Showing ${rows.length} of ${rows.length} certificates`;

  if (!rows.length) {
    els.certificatesTable.innerHTML = `
      <tr>
        <td colspan="5">No certificate records found.</td>
      </tr>
    `;
    return;
  }

  els.certificatesTable.innerHTML = rows.map((row) => `
    <tr>
      <td>
        <div class="person-cell">
          <img class="avatar" src="${row.userAvatar}" alt="${row.userName}" />
          <span>${row.userName}</span>
        </div>
      </td>
      <td>${row.eventName}</td>
      <td>${formatDate(row.date, "long")}</td>
      <td>
        <span class="status-badge ${row.status === "issued" ? "status-issued" : "status-pending"}">
          ${row.status === "issued" ? "Issued" : "Pending"}
        </span>
      </td>
      <td class="row-actions">
        ${
          row.status === "issued" && row.certificateId
            ? `<a href="../certificates/certificate-preview.html?id=${encodeURIComponent(row.certificateId)}" title="View Certificate">
                 <i class="fa-solid fa-ellipsis"></i>
               </a>`
            : `<button type="button" class="pending-action" title="Certificate not available yet">
                 <i class="fa-solid fa-ellipsis"></i>
               </button>`
        }
      </td>
    </tr>
  `).join("");
}

async function loadCertificatesPage() {
  const ownEvents = await getOrganizerEvents();
  const registrations = await getRegistrationsForEvents(ownEvents);

  let issuedPayload = [];
  try {
    issuedPayload = await apiRequest("/certificates/my-certificates");
  } catch {
    issuedPayload = [];
  }

  const issuedCertificates = normalizeArray(issuedPayload, ["certificates"]);
  const issuedRows = normalizeIssuedCertificates(issuedCertificates);

  const issuedKeys = new Set(
    issuedRows.map((row) => rowKey(row.userId, row.eventId))
  );

  const pendingRows = buildPendingRows(registrations, issuedKeys);

  certificateRows = [...issuedRows, ...pendingRows].sort(
    (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
  );

  renderStats(certificateRows);
  renderTable(certificateRows);
}

els.logoutBtn.addEventListener("click", () => {
  logout(ROUTES.organizerLogin);
});

document.addEventListener("DOMContentLoaded", async () => {
  organizer = await requireRole("organizer", ROUTES.organizerLogin);
  if (!organizer) return;

  try {
    await loadCertificatesPage();
  } catch (error) {
    els.certificatesTable.innerHTML = `
      <tr>
        <td colspan="5">Failed to load certificates.</td>
      </tr>
    `;
  }
});











// import { apiRequest, normalizeArray } from "../../assets/js/api.js";
// import { requireOrganizer } from "../../assets/js/auth.js";
// import { logout } from "../../assets/js/logout.js";
// import { ROUTES } from "../../assets/js/config.js";
// import { formatDate } from "../../assets/js/utils.js";

// const els = {
//   totalCertificates: document.getElementById("totalCertificates"),
//   issuedCertificates: document.getElementById("issuedCertificates"),
//   pendingCertificates: document.getElementById("pendingCertificates"),
//   certificatesTable: document.getElementById("certificatesTable"),
//   tableCountText: document.getElementById("tableCountText"),
//   logoutBtn: document.getElementById("logoutBtn")
// };

// function rowKey(userId, eventId) { return `${String(userId)}::${String(eventId)}`; }
// function avatar(user) { return user?.profileImage || "https://i.pravatar.cc/100?img=12"; }

// function normalizeIssued(records) {
//   return records.map((item) => ({
//     status: "issued",
//     certificateId: item._id || item.id || item.certificateId || "",
//     userId: item.user?._id || item.user?.id || item.volunteer?._id || item.volunteer?.id || item.userId || "",
//     eventId: item.event?._id || item.event?.id || item.eventId || "",
//     userName: item.user?.fullName || item.user?.name || item.volunteer?.fullName || item.volunteer?.name || item.volunteerName || "Unknown Volunteer",
//     userAvatar: avatar(item.user || item.volunteer),
//     eventName: item.event?.name || item.eventName || "Untitled Event",
//     date: item.issuedAt || item.createdAt || item.event?.date || ""
//   }));
// }

// function render(rows) {
//   els.totalCertificates.textContent = rows.length;
//   els.issuedCertificates.textContent = rows.filter((r) => r.status === "issued").length;
//   els.pendingCertificates.textContent = rows.filter((r) => r.status === "pending").length;
//   els.tableCountText.textContent = `Showing ${rows.length} of ${rows.length} certificates`;
//   els.certificatesTable.innerHTML = rows.map((row) => `
//     <tr>
//       <td><div class="person-cell"><img class="avatar" src="${row.userAvatar}" alt="${row.userName}" /><span>${row.userName}</span></div></td>
//       <td>${row.eventName}</td>
//       <td>${formatDate(row.date, "long")}</td>
//       <td><span class="status-badge ${row.status === "issued" ? "status-issued" : "status-pending"}">${row.status === "issued" ? "Issued" : "Pending"}</span></td>
//       <td>${row.status === "issued" && row.certificateId ? `<a href="../../Admin/certificates/certificate-preview.html?id=${encodeURIComponent(row.certificateId)}">View</a>` : "..."}</td>
//     </tr>
//   `).join("") || `<tr><td colspan="5">No certificate records found.</td></tr>`;
// }

// document.addEventListener("DOMContentLoaded", async () => {
//   const organizer = await requireOrganizer();
//   if (!organizer) return;
//   els.logoutBtn.addEventListener("click", () => logout(ROUTES.home));

//   try {
//     const eventsPayload = await apiRequest("/events");
//     const allEvents = normalizeArray(eventsPayload, ["events"]);
//     const organizerId = String(organizer._id || organizer.id || "");
//     const ownEvents = allEvents.filter((event) => {
//       if (typeof event.organizer === "object" && event.organizer) {
//         return String(event.organizer._id || event.organizer.id || "") === organizerId;
//       }
//       return String(event.organizerId || "") === organizerId;
//     });

//     const registrations = [];
//     for (const event of ownEvents) {
//       const data = await apiRequest(`/applications/events/${event._id || event.id}/registrations`);
//       const regs = Array.isArray(data) ? data : data.data || [];
//       regs.forEach((reg) => registrations.push({ ...reg, _eventId: event._id || event.id, _eventName: event.name || "Untitled Event", _eventDate: event.date }));
//     }

//     let issuedPayload = [];
//     try { issuedPayload = await apiRequest("/certificates/my-certificates"); } catch { issuedPayload = []; }
//     const issuedRows = normalizeIssued(normalizeArray(issuedPayload, ["certificates"]));
//     const issuedKeys = new Set(issuedRows.map((r) => rowKey(r.userId, r.eventId)));

//     const pendingRows = registrations
//       .filter((reg) => !issuedKeys.has(rowKey(reg.user?._id || reg.user?.id || "", reg._eventId || "")))
//       .map((reg) => ({
//         status: "pending",
//         certificateId: "",
//         userId: reg.user?._id || reg.user?.id || "",
//         eventId: reg._eventId,
//         userName: reg.user?.fullName || reg.user?.name || "Unknown Volunteer",
//         userAvatar: avatar(reg.user),
//         eventName: reg._eventName,
//         date: reg._eventDate || reg.createdAt || ""
//       }));

//     render([...issuedRows, ...pendingRows].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
//   } catch {
//     els.certificatesTable.innerHTML = `<tr><td colspan="5">Failed to load certificates.</td></tr>`;
//   }
// });
