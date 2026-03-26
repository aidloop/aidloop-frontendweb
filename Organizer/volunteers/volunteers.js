import { apiRequest } from "../../assets/js/api.js";
import { requireRole } from "../../assets/js/auth.js";
import { logout } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";

const eventId = new URLSearchParams(window.location.search).get("eventId");

const els = {
  table: document.getElementById("volunteerTable"),
  total: document.getElementById("totalRegistered"),
  attended: document.getElementById("attendedCount"),
  noShow: document.getElementById("noShowCount"),
  searchInput: document.getElementById("searchInput"),
  tableCountText: document.getElementById("tableCountText"),
  filterBtns: document.querySelectorAll(".filter-btn"),
  logoutBtn: document.getElementById("logoutBtn")
};

let allVolunteers = [];
let currentFilter = "all";

function getStatus(v) {
  return String(v.status || "confirmed").toLowerCase();
}

function getAttendance(v) {
  return String(v.attendance || "").toLowerCase();
}

function getDisplayName(v) {
  return v.user?.fullName || "Unknown";
}

function getEmail(v) {
  return v.user?.email || "—";
}

function getAvatar(v) {
  return v.user?.profileImage || "https://i.pravatar.cc/100?img=12";
}

function getQualification(v) {
  return getAttendance(v) === "attended" ? "Qualified for certificate" : "Pending attendance";
}

function renderStats() {
  const total = allVolunteers.length;
  const attended = allVolunteers.filter((v) => getAttendance(v) === "attended").length;
  const noShow = Math.max(0, total - attended);

  els.total.textContent = total;
  els.attended.textContent = attended;
  els.noShow.textContent = noShow;
}

function renderTable() {
  const query = els.searchInput.value.trim().toLowerCase();

  let filtered = [...allVolunteers];

  if (currentFilter !== "all") {
    filtered = filtered.filter((v) => getStatus(v) === currentFilter);
  }

  if (query) {
    filtered = filtered.filter((v) => {
      const searchable = `${getDisplayName(v)} ${getEmail(v)} ${getQualification(v)}`.toLowerCase();
      return searchable.includes(query);
    });
  }

  els.tableCountText.textContent = `Showing ${filtered.length} of ${allVolunteers.length} entries`;

  if (!filtered.length) {
    els.table.innerHTML = `
      <tr><td colspan="6">No volunteers found</td></tr>
    `;
    return;
  }

  els.table.innerHTML = filtered.map((v) => {
    const id = v._id;
    const attended = getAttendance(v) === "attended";

    return `
      <tr>
        <td>
          <div class="volunteer-name">
            <img class="avatar" src="${getAvatar(v)}" alt="${getDisplayName(v)}" />
            <span>${getDisplayName(v)}</span>
          </div>
        </td>
        <td>${getEmail(v)}</td>
        <td><span class="badge confirmed">Confirmed</span></td>
        <td>
          <div class="attendance-wrap">
            <button
              class="attendance-box ${attended ? "checked" : ""}"
              data-id="${id}"
              title="${attended ? "Attended" : "Mark attended"}"
            >
              ${attended ? '<i class="fa-solid fa-check"></i>' : ""}
            </button>
          </div>
        </td>
        <td class="qualification-cell ${attended ? "qualified" : "pending"}">
          ${attended ? "Qualified for certificate" : "Pending attendance"}
        </td>
        <td class="row-actions">
          <button type="button">
            <i class="fa-solid fa-ellipsis"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  attachAttendanceHandlers();
}

function attachAttendanceHandlers() {
  document.querySelectorAll(".attendance-box").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const targetVolunteer = allVolunteers.find((v) => v._id === id);
      const alreadyAttended = getAttendance(targetVolunteer) === "attended";

      if (alreadyAttended) return;

      try {
        btn.disabled = true;

        await apiRequest(`/applications/registrations/${id}/attendance`, {
          method: "PATCH",
          body: JSON.stringify({ status: "attended" })
        });

        allVolunteers = allVolunteers.map((v) =>
          v._id === id
            ? {
                ...v,
                attendance: "attended",
                certificateQualified: true
              }
            : v
        );

        renderStats();
        renderTable();
      } catch (err) {
        alert(err.message || "Failed to update attendance");
        btn.disabled = false;
      }
    });
  });
}

async function loadVolunteers() {
  const data = await apiRequest(`/applications/events/${eventId}/registrations`);
  const volunteers = Array.isArray(data) ? data : data.data || [];
  allVolunteers = volunteers;

  renderStats();
  renderTable();
}

function bindFilters() {
  els.filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      els.filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderTable();
    });
  });
}

els.searchInput.addEventListener("input", renderTable);

els.logoutBtn.addEventListener("click", () => {
  logout(ROUTES.organizerLogin);
});

document.addEventListener("DOMContentLoaded", async () => {
  await requireRole("organizer", ROUTES.organizerLogin);

  if (!eventId) {
    alert("No event selected");
    window.location.href = ROUTES.eventListing;
    return;
  }

  bindFilters();

  try {
    await loadVolunteers();
  } catch (err) {
    els.table.innerHTML = `
      <tr><td colspan="6">Failed to load volunteers</td></tr>
    `;
  }
});
