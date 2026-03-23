const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const elements = {
  overlay: document.getElementById("overlay"),
  closeBtn: document.getElementById("closeBtn"),
  volunteerName: document.getElementById("volunteerName"),
  eventName: document.getElementById("eventName"),
  phoneNumber: document.getElementById("phoneNumber"),
  organizerName: document.getElementById("organizerName"),
  eventDate: document.getElementById("eventDate"),
  certificateStatus: document.getElementById("certificateStatus"),
  feedback: document.getElementById("feedback"),
  downloadBtn: document.getElementById("downloadBtn")
};

let certificateId = null;
let certificateRecord = null;

function getCertificateIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.blob();

  if (!response.ok) {
    if (isJson) {
      throw new Error(data.message || data.error || "Request failed");
    }
    throw new Error("Request failed");
  }

  return { data, response };
}

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function getVolunteerName(record) {
  return (
    record.volunteerName ||
    record.user?.fullName ||
    record.user?.name ||
    record.volunteer?.fullName ||
    record.volunteer?.name ||
    "—"
  );
}

function getPhoneNumber(record) {
  return (
    record.phoneNumber ||
    record.user?.phoneNumber ||
    record.user?.phone ||
    record.volunteer?.phoneNumber ||
    record.volunteer?.phone ||
    "—"
  );
}

function getEventName(record) {
  return (
    record.eventName ||
    record.event?.name ||
    record.event?.title ||
    "—"
  );
}

function getOrganizerName(record) {
  return (
    record.organizerName ||
    record.organizer?.fullName ||
    record.organizer?.name ||
    record.organizer?.organizationName ||
    record.event?.organizer?.fullName ||
    record.event?.organizer?.name ||
    record.event?.organizer?.organizationName ||
    "—"
  );
}

function getCertificateStatus(record) {
  return String(record.status || "issued").toUpperCase();
}

function renderCertificate(record) {
  certificateRecord = record;

  elements.volunteerName.textContent = getVolunteerName(record);
  elements.eventName.textContent = getEventName(record);
  elements.phoneNumber.textContent = getPhoneNumber(record);
  elements.organizerName.textContent = getOrganizerName(record);
  elements.eventDate.textContent = formatDate(
    record.eventDate ||
    record.event?.date ||
    record.issuedAt ||
    record.createdAt
  );
  elements.certificateStatus.textContent = getCertificateStatus(record);
}

async function loadCertificatePreview() {
  certificateId = getCertificateIdFromURL();

  if (!certificateId) {
    elements.feedback.textContent = "Certificate ID not found in URL.";
    elements.feedback.className = "feedback error";
    return;
  }

  try {
    const { data } = await apiRequest(`/certificates/verify/${certificateId}`);
    renderCertificate(data);
  } catch (error) {
    elements.feedback.textContent = error.message;
    elements.feedback.className = "feedback error";
  }
}

async function downloadCertificate() {
  if (!certificateId) return;

  try {
    elements.downloadBtn.disabled = true;
    elements.downloadBtn.textContent = "Downloading...";
    elements.feedback.textContent = "";

    const { data, response } = await apiRequest(
      `/certificates/download/${certificateId}`,
      {
        method: "GET"
      }
    );

    const blobUrl = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    const disposition = response.headers.get("content-disposition") || "";
    const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
    const filename = filenameMatch ? filenameMatch[1] : `certificate-${certificateId}.pdf`;

    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);

    elements.feedback.textContent = "Certificate downloaded successfully.";
    elements.feedback.className = "feedback success";
  } catch (error) {
    elements.feedback.textContent = error.message || "Failed to download certificate.";
    elements.feedback.className = "feedback error";
  } finally {
    elements.downloadBtn.disabled = false;
    elements.downloadBtn.textContent = "Download Certificate";
  }
}

function closeModal() {
  window.location.href = "certificates.html";
}

elements.closeBtn.addEventListener("click", closeModal);
elements.downloadBtn.addEventListener("click", downloadCertificate);

elements.overlay.addEventListener("click", (event) => {
  if (event.target === elements.overlay) {
    closeModal();
  }
});

document.addEventListener("DOMContentLoaded", loadCertificatePreview);