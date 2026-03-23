import { apiRequest } from "../assets/js/api.js";
import { requireRole } from "../assets/js/auth.js";
import { logout } from "../assets/js/logout.js";
import { ROUTES } from "../assets/js/config.js";

const eventId = new URLSearchParams(window.location.search).get("id");

const els = {
  cancelBtn: document.getElementById("cancelEventBtn"),
  goBackBtn: document.getElementById("goBackBtn"),
  reasonText: document.getElementById("reasonText"),
  logoutBtn: document.getElementById("logoutBtn"),
  confirmModal: document.getElementById("confirmModal"),
  confirmCancel: document.getElementById("confirmCancel"),
  closeModal: document.getElementById("closeModal"),
  cancelModal: document.getElementById("cancelModal")
};

function getSelectedReasons() {
  return [...document.querySelectorAll("input[type='checkbox']:checked")]
    .map((cb) => cb.value);
}

function openModal() {
  els.confirmModal.classList.remove("hidden");
}

function hideModal() {
  els.confirmModal.classList.add("hidden");
}

async function cancelEvent() {
  const reasons = getSelectedReasons();
  const text = els.reasonText.value.trim();

  if (!reasons.length && !text) {
    alert("Please provide a reason");
    hideModal();
    return;
  }

  const reason = [...reasons, text].filter(Boolean).join(", ");

  try {
    els.confirmCancel.disabled = true;
    els.confirmCancel.textContent = "Cancelling...";

    await apiRequest(`/events/${eventId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason })
    });

    alert("Event cancelled successfully");
    window.location.href = ROUTES.eventListing;
  } catch (err) {
    alert(err.message || "Failed to cancel event");
  } finally {
    els.confirmCancel.disabled = false;
    els.confirmCancel.textContent = "Yes, Cancel event";
  }
}

els.cancelBtn.addEventListener("click", openModal);

els.goBackBtn.addEventListener("click", () => {
  window.history.back();
});

[els.closeModal, els.cancelModal].forEach((btn) => {
  btn.addEventListener("click", hideModal);
});

els.confirmCancel.addEventListener("click", cancelEvent);

els.logoutBtn.addEventListener("click", () => {
  logout(ROUTES.organizerLogin);
});

document.addEventListener("DOMContentLoaded", async () => {
  await requireRole("organizer", ROUTES.organizerLogin);

  if (!eventId) {
    alert("Invalid event");
    window.location.href = ROUTES.eventListing;
    return;
  }
});









// import { apiRequest } from "../../assets/js/api.js";
// import { requireOrganizer } from "../../assets/js/auth.js";
// import { logout } from "../../assets/js/logout.js";
// import { ROUTES } from "../../assets/js/config.js";
// import { getQueryParam } from "../../assets/js/utils.js";

// const eventId = getQueryParam("id");
// const reasonText = document.getElementById("reasonText");
// const cancelBtn = document.getElementById("cancelEventBtn");
// const msg = document.getElementById("msg");
// document.getElementById("logoutBtn").addEventListener("click", () => logout(ROUTES.home));

// cancelBtn.addEventListener("click", async () => {
//   try {
//     await apiRequest(`/events/${eventId}/cancel`, {
//       method: "PATCH",
//       body: JSON.stringify({ reason: reasonText.value.trim() || "Cancelled by organizer" })
//     });
//     msg.textContent = "Event cancelled successfully.";
//     setTimeout(() => { window.location.href = ROUTES.organizerEventListing; }, 600);
//   } catch (err) {
//     msg.className = "form-error";
//     msg.textContent = err.message || "Failed to cancel event.";
//   }
// });

// document.addEventListener("DOMContentLoaded", requireOrganizer);
