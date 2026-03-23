import { apiRequest } from "../assets/js/api.js";
import { ROUTES } from "../assets/js/config.js";
import { logout } from "../assets/js/logout.js";

const roles = [];
let imageUrl = "";

const els = {
  form: document.getElementById("eventForm"),
  roleInput: document.getElementById("roleInput"),
  addRole: document.getElementById("addRole"),
  rolesList: document.getElementById("rolesList"),
  imageInput: document.getElementById("imageInput"),
  imageBox: document.getElementById("imageBox"),
  formMsg: document.getElementById("formMsg"),
  saveDraft: document.getElementById("saveDraft"),
  logoutBtn: document.getElementById("logoutBtn")
};

/* IMAGE */
els.imageBox.addEventListener("click", () => els.imageInput.click());

els.imageInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // TEMP: Replace with Cloudinary later
  imageUrl = URL.createObjectURL(file);
  els.imageBox.innerHTML = `<img src="${imageUrl}" style="max-width:100%">`;
});

/* ROLES */
els.addRole.addEventListener("click", () => {
  const val = els.roleInput.value.trim();
  if (!val) return;

  roles.push(val);
  els.roleInput.value = "";
  renderRoles();
});

function renderRoles() {
  els.rolesList.innerHTML = roles.map(r => `<span>${r}</span>`).join("");
}

/* CREATE EVENT */
async function createEvent(status = "draft") {
  const payload = {
    name: document.getElementById("name").value,
    category: document.getElementById("category").value,
    description: document.getElementById("description").value,
    location: {
      venue: document.getElementById("venue").value,
      city: document.getElementById("city").value
    },
    image: imageUrl,
    date: document.getElementById("date").value,
    startTime: document.getElementById("startTime").value,
    endTime: document.getElementById("endTime").value,
    volunteerSlots: Number(document.getElementById("slots").value),
    roles,
    certificateEnabled: document.getElementById("certificateEnabled").checked,
    requirements: document
      .getElementById("requirements")
      .value.split("\n")
  };

  try {
    const res = await apiRequest("/events", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const eventId = res._id || res.id;

    if (status === "published") {
      await apiRequest(`/events/${eventId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "published" })
      });
    }

    els.formMsg.textContent = "Event created successfully!";
    window.location.href = ROUTES.organizerDashboard;

  } catch (err) {
    els.formMsg.textContent = err.message;
  }
}

/* ACTIONS */
els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  createEvent("published");
});

els.saveDraft.addEventListener("click", () => createEvent("draft"));

/* LOGOUT */
els.logoutBtn.addEventListener("click", () => {
  logout(ROUTES.organizerLogin);
});










// import { apiRequest } from "../../assets/js/api.js";
// import { requireOrganizer } from "../../assets/js/auth.js";
// import { logout } from "../../assets/js/logout.js";
// import { ROUTES } from "../../assets/js/config.js";

// const form = document.getElementById("eventForm");
// const formError = document.getElementById("formError");
// const formSuccess = document.getElementById("formSuccess");
// document.getElementById("logoutBtn").addEventListener("click", () => logout(ROUTES.home));
// document.getElementById("saveDraft").addEventListener("click", () => submitEvent("draft"));
// form.addEventListener("submit", (e) => { e.preventDefault(); submitEvent("published"); });

// async function submitEvent(status) {
//   formError.textContent = "";
//   formSuccess.textContent = "";
//   try {
//     const result = await apiRequest("/events", {
//       method: "POST",
//       body: JSON.stringify({
//         name: document.getElementById("name").value,
//         category: document.getElementById("category").value,
//         description: document.getElementById("description").value,
//         location: { venue: document.getElementById("venue").value, city: document.getElementById("city").value },
//         image: "",
//         date: document.getElementById("date").value,
//         startTime: document.getElementById("startTime").value,
//         endTime: document.getElementById("endTime").value,
//         volunteerSlots: Number(document.getElementById("slots").value),
//         roles: document.getElementById("roles").value.split(",").map((v) => v.trim()).filter(Boolean),
//         certificateEnabled: document.getElementById("certificateEnabled").checked,
//         requirements: document.getElementById("requirements").value.split(",").map((v) => v.trim()).filter(Boolean)
//       })
//     });

//     const eventId = result._id || result.id;
//     if (status === "published") {
//       await apiRequest(`/events/${eventId}/status`, {
//         method: "PATCH",
//         body: JSON.stringify({ status: "published" })
//       });
//     }

//     formSuccess.textContent = "Event created successfully.";
//     setTimeout(() => { window.location.href = ROUTES.organizerEventListing; }, 700);
//   } catch (err) {
//     formError.textContent = err.message || "Failed to create event.";
//   }
// }

// document.addEventListener("DOMContentLoaded", requireOrganizer);
