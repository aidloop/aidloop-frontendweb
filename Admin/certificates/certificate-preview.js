const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const els = {
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

const certificateId = new URLSearchParams(window.location.search).get("id");

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
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

function setFeedback(message, type = "") {
  els.feedback.textContent = message;
  els.feedback.className = "feedback";
  if (type) {
    els.feedback.classList.add(type);
  }
}

function populateCertificate(data) {
  els.volunteerName.textContent =
    data.user?.fullName ||
    data.user?.name ||
    data.volunteer?.fullName ||
    data.volunteer?.name ||
    data.volunteerName ||
    "—";

  els.eventName.textContent =
    data.event?.name ||
    data.eventName ||
    "—";

  els.phoneNumber.textContent =
    data.user?.phoneNumber ||
    data.user?.phone ||
    data.volunteer?.phoneNumber ||
    data.volunteer?.phone ||
    data.phoneNumber ||
    "—";

  els.organizerName.textContent =
    data.organizer?.fullName ||
    data.organizer?.name ||
    data.event?.organizer?.fullName ||
    data.event?.organizer?.name ||
    data.organizerName ||
    "—";

  els.eventDate.textContent = formatDate(
    data.event?.date ||
    data.eventDate ||
    data.issuedAt ||
    data.createdAt
  );

  const status = String(data.status || "issued").toUpperCase();
  els.certificateStatus.textContent = status;
}

async function loadCertificate() {
  if (!certificateId) {
    setFeedback("No certificate ID provided.", "error");
    els.downloadBtn.disabled = true;
    return;
  }

  try {
    const data = await apiRequest(`/certificates/verify/${certificateId}`);
    populateCertificate(data);
    setFeedback("Certificate loaded successfully.", "success");
  } catch (error) {
    setFeedback(error.message || "Failed to load certificate.", "error");
    els.downloadBtn.disabled = true;
  }
}

async function downloadCertificate() {
  if (!certificateId) return;

  try {
    els.downloadBtn.disabled = true;
    els.downloadBtn.textContent = "Downloading...";

    const blob = await apiRequest(`/certificates/download/${certificateId}`);
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `certificate-${certificateId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    setFeedback("Certificate downloaded successfully.", "success");
  } catch (error) {
    setFeedback(error.message || "Failed to download certificate.", "error");
  } finally {
    els.downloadBtn.disabled = false;
    els.downloadBtn.textContent = "Download Certificate";
  }
}

function closePreview() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.href = "certificates.html";
}

els.closeBtn.addEventListener("click", closePreview);
els.downloadBtn.addEventListener("click", downloadCertificate);

document.addEventListener("DOMContentLoaded", loadCertificate);