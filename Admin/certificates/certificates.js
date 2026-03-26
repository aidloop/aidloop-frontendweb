const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const els = {
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  certificatesTable: document.getElementById("certificatesTable"),
  certificatesTableWrap: document.getElementById("certificatesTableWrap"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  logoutBtn: document.getElementById("logoutBtn"),
  logoutModal: document.getElementById("logoutModal"),
  closeLogoutModal: document.getElementById("closeLogoutModal"),
  cancelLogout: document.getElementById("cancelLogout"),
  confirmLogout: document.getElementById("confirmLogout")
};

let certificateRowsCache = [];
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
    : await response.blob();

  if (!response.ok) {
    if (contentType.includes("application/json")) {
      throw new Error(data.message || data.error || "Request failed");
    }
    throw new Error("Request failed");
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

function getStatusValue(item) {
  const raw = String(item.status || "").toLowerCase();
  if (raw === "issued") return "issued";
  return "issued";
}

function getVolunteerName(item) {
  return (
    item.user?.fullName ||
    item.user?.name ||
    item.volunteer?.fullName ||
    item.volunteer?.name ||
    item.volunteerName ||
    "Volunteer"
  );
}

function getEventName(item) {
  return item.event?.name || item.eventName || "Event";
}

function getOrganizerName(item) {
  return (
    item.organizer?.fullName ||
    item.organizer?.name ||
    item.event?.organizer?.fullName ||
    item.event?.organizer?.name ||
    item.organizerName ||
    "Organizer"
  );
}

function getCertificateId(item) {
  return item._id || item.id || item.certificateId || "";
}

function openLogoutModal() {
  els.logoutModal.classList.remove("hidden");
}

function closeLogoutModal() {
  els.logoutModal.classList.add("hidden");
  els.confirmLogout.disabled = false;
  els.confirmLogout.textContent = "Yes, Log out";
}

async function handleLogout() {
  try {
    els.confirmLogout.disabled = true;
    els.confirmLogout.textContent = "Logging out...";

    await apiRequest("/auth/logout", {
      method: "POST"
    });
  } catch (error) {
    console.warn("Logout failed:", error.message);
  } finally {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "../../index.html";
  }
}

function renderCertificates() {
  const query = els.searchInput.value.trim().toLowerCase();

  let filtered = [...certificateRowsCache];

  if (currentFilter !== "all") {
    filtered = filtered.filter((item) => {
      const status = getStatusValue(item);
      return currentFilter === "issued"
        ? status === "issued"
        : status !== "issued";
    });
  }

  if (query) {
    filtered = filtered.filter((item) => {
      const searchableText = `
        ${getVolunteerName(item)}
        ${getEventName(item)}
        ${getOrganizerName(item)}
        ${formatDate(item.issuedAt || item.createdAt || item.date)}
      `.toLowerCase();

      return searchableText.includes(query);
    });
  }

  if (!filtered.length) {
    els.certificatesTableWrap.style.display = "none";
    els.emptyState.style.display = "block";
    return;
  }

  els.certificatesTableWrap.style.display = "table";
  els.emptyState.style.display = "none";

  els.certificatesTable.innerHTML = filtered.map((item) => {
    const certificateId = getCertificateId(item);

    return `
      <tr>
        <td>${getVolunteerName(item)}</td>
        <td>${getEventName(item)}</td>
        <td>${getOrganizerName(item)}</td>
        <td>${formatDate(item.issuedAt || item.createdAt || item.date)}</td>
        <td>
          <a class="action-link" href="certificate-preview.html?id=${encodeURIComponent(certificateId)}">
            View Certificate
          </a>
        </td>
      </tr>
    `;
  }).join("");
}

async function loadAdminProfile() {
  try {
    let profile;
    try {
      profile = await apiRequest("/users/me");
    } catch {
      profile = await apiRequest("/user/me");
    }

    els.adminName.textContent =
      profile.fullName ||
      profile.name ||
      "Admin User";

    els.adminRole.textContent =
      profile.role
        ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
        : "Admin";

    if (profile.profileImage) {
      els.adminAvatar.src = profile.profileImage;
    }
  } catch (error) {
    console.error("Failed to load admin profile:", error.message);
    window.location.href = "../profile/admin-profile.html";
  }
}

async function loadCertificates() {
  try {
    const payload = await apiRequest("/certificates/my-certificates");
    certificateRowsCache = normalizeCertificates(payload);
    renderCertificates();
  } catch (error) {
    console.error("Failed to load certificates:", error.message);
    certificateRowsCache = [];
    renderCertificates();
  }
}

function bindFilters() {
  els.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      els.filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.filter;
      renderCertificates();
    });
  });
}

function bindUI() {
  els.searchInput.addEventListener("input", renderCertificates);

  bindFilters();

  els.logoutBtn.addEventListener("click", openLogoutModal);
  els.closeLogoutModal.addEventListener("click", closeLogoutModal);
  els.cancelLogout.addEventListener("click", closeLogoutModal);
  els.confirmLogout.addEventListener("click", handleLogout);

  els.logoutModal.addEventListener("click", (event) => {
    if (event.target === els.logoutModal) {
      closeLogoutModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.logoutModal.classList.contains("hidden")) {
      closeLogoutModal();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  bindUI();
  await loadAdminProfile();
  await loadCertificates();
});