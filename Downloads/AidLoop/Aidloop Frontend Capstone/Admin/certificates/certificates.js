const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const elements = {
  searchInput: document.getElementById("searchInput"),
  certificatesTable: document.getElementById("certificatesTable"),
  emptyState: document.getElementById("emptyState"),
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  filterButtons: document.querySelectorAll(".filter-btn")
};

let allCertificates = [];
let currentFilter = "all";

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

function normalizeCertificates(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.certificates)) return payload.certificates;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getVolunteerName(item) {
  return (
    item.volunteerName ||
    item.user?.fullName ||
    item.user?.name ||
    item.volunteer?.fullName ||
    item.volunteer?.name ||
    "—"
  );
}

function getEventName(item) {
  return (
    item.eventName ||
    item.event?.name ||
    item.event?.title ||
    "—"
  );
}

function getOrganizerName(item) {
  return (
    item.organizerName ||
    item.organizer?.fullName ||
    item.organizer?.name ||
    item.organizer?.organizationName ||
    item.event?.organizer?.fullName ||
    item.event?.organizer?.name ||
    item.event?.organizer?.organizationName ||
    "—"
  );
}

function getCertificateStatus(item) {
  return String(item.status || "issued").toLowerCase();
}

function getCertificateId(item) {
  return item.certificateId || item._id || item.id || "";
}

async function loadAdminProfile() {
  try {
    let profile;

    try {
      profile = await apiRequest("/users/me");
    } catch {
      profile = await apiRequest("/user/me");
    }

    elements.adminName.textContent = profile.fullName || profile.name || "Admin";
    elements.adminRole.textContent = profile.role
      ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
      : "Admin";

    if (profile.profileImage) {
      elements.adminAvatar.src = profile.profileImage;
    }
  } catch (error) {
    console.error("Failed to load admin profile:", error.message);
    window.location.href = "../login/admin-login.html";
  }
}

async function loadCertificates() {
  try {
    const payload = await apiRequest("/certificates/my-certificates");
    allCertificates = normalizeCertificates(payload);
    renderCertificates();
  } catch (error) {
    console.error("Failed to load certificates:", error.message);
    elements.certificatesTable.innerHTML = `
      <tr>
        <td colspan="5">Failed to load certificates.</td>
      </tr>
    `;
  }
}

function renderCertificates() {
  const query = elements.searchInput.value.trim().toLowerCase();

  const filtered = allCertificates.filter((item) => {
    const status = getCertificateStatus(item);

    const matchesFilter =
      currentFilter === "all"
        ? true
        : status === currentFilter;

    const searchable = `
      ${getVolunteerName(item)}
      ${getEventName(item)}
      ${getOrganizerName(item)}
      ${status}
    `.toLowerCase();

    return matchesFilter && searchable.includes(query);
  });

  if (!filtered.length) {
    elements.certificatesTable.innerHTML = "";
    elements.emptyState.style.display = "flex";
    return;
  }

  elements.emptyState.style.display = "none";

  elements.certificatesTable.innerHTML = filtered
    .map((item) => {
      const certificateId = getCertificateId(item);
      const status = getCertificateStatus(item);

      return `
        <tr data-status="${status}">
          <td>${getVolunteerName(item)}</td>
          <td>${getEventName(item)}</td>
          <td>${getOrganizerName(item)}</td>
          <td>${formatDate(item.dateIssued || item.issuedAt || item.createdAt)}</td>
          <td class="action-links">
            <a href="certificate-preview.html?id=${encodeURIComponent(certificateId)}">
              View Certificate
            </a>
          </td>
        </tr>
      `;
    })
    .join("");
}

function bindFilters() {
  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      elements.filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.filter;
      renderCertificates();
    });
  });
}

function bindSearch() {
  elements.searchInput.addEventListener("input", renderCertificates);
}

document.addEventListener("DOMContentLoaded", async () => {
  bindFilters();
  bindSearch();
  await loadAdminProfile();
  await loadCertificates();
});