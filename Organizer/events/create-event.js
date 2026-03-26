// import { apiRequest } from "../../assets/js/api.js";
// import { ROUTES } from "../../assets/js/config.js";
// import { logout } from "../../assets/js/logout.js";

// const roles = [];
// let imageUrl = "";

// const els = {
//   form: document.getElementById("eventForm"),
//   roleInput: document.getElementById("roleInput"),
//   addRole: document.getElementById("addRole"),
//   rolesList: document.getElementById("rolesList"),
//   imageInput: document.getElementById("imageInput"),
//   imageBox: document.getElementById("imageBox"),
//   formMsg: document.getElementById("formMsg"),
//   saveDraft: document.getElementById("saveDraft"),
//   logoutBtn: document.getElementById("logoutBtn")
// };

// /* IMAGE */
// els.imageBox.addEventListener("click", () => els.imageInput.click());

// els.imageInput.addEventListener("change", async (e) => {
//   const file = e.target.files[0];
//   if (!file) return;

//   // TEMP: Replace with Cloudinary later
//   imageUrl = URL.createObjectURL(file);
//   els.imageBox.innerHTML = `<img src="${imageUrl}" style="max-width:100%">`;
// });

// /* ROLES */
// els.addRole.addEventListener("click", () => {
//   const val = els.roleInput.value.trim();
//   if (!val) return;

//   roles.push(val);
//   els.roleInput.value = "";
//   renderRoles();
// });

// function renderRoles() {
//   els.rolesList.innerHTML = roles.map(r => `<span>${r}</span>`).join("");
// }

// /* CREATE EVENT */
// async function createEvent(status = "draft") {
//   const payload = {
//     name: document.getElementById("name").value,
//     category: document.getElementById("category").value,
//     description: document.getElementById("description").value,
//     location: {
//       venue: document.getElementById("venue").value,
//       city: document.getElementById("city").value
//     },
//     image: imageUrl,
//     date: document.getElementById("date").value,
//     startTime: document.getElementById("startTime").value,
//     endTime: document.getElementById("endTime").value,
//     volunteerSlots: Number(document.getElementById("slots").value),
//     roles,
//     certificateEnabled: document.getElementById("certificateEnabled").checked,
//     requirements: document
//       .getElementById("requirements")
//       .value.split("\n")
//   };

//   try {
//     const res = await apiRequest("/events", {
//       method: "POST",
//       body: JSON.stringify(payload)
//     });

//     const eventId = res._id || res.id;

//     if (status === "published") {
//       await apiRequest(`/events/${eventId}/status`, {
//         method: "PATCH",
//         body: JSON.stringify({ status: "published" })
//       });
//     }

//     els.formMsg.textContent = "Event created successfully!";
//     window.location.href = ROUTES.organizerDashboard;

//   } catch (err) {
//     els.formMsg.textContent = err.message;
//   }
// }

// /* ACTIONS */
// els.form.addEventListener("submit", (e) => {
//   e.preventDefault();
//   createEvent("published");
// });

// els.saveDraft.addEventListener("click", () => createEvent("draft"));

// /* LOGOUT */
// els.logoutBtn.addEventListener("click", () => {
//   logout(ROUTES.organizerLogin);
// });











import { apiRequest } from "../../assets/js/api.js";
import { ROUTES } from "../../assets/js/config.js";
import { logout } from "../../assets/js/logout.js";

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
els.imageBox?.addEventListener("click", () => els.imageInput?.click());

els.imageInput?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Temporary local preview
  imageUrl = URL.createObjectURL(file);
  els.imageBox.innerHTML = `<img src="${imageUrl}" alt="Event image preview" style="max-width:100%; border-radius:12px;">`;
});

/* ROLES */
els.addRole?.addEventListener("click", () => {
  const val = els.roleInput.value.trim();
  if (!val) return;

  if (!roles.includes(val)) {
    roles.push(val);
  }

  els.roleInput.value = "";
  renderRoles();
});

function renderRoles() {
  els.rolesList.innerHTML = roles
    .map((role, index) => `
      <span class="role-chip">
        ${role}
        <button type="button" data-index="${index}" class="remove-role-btn">&times;</button>
      </span>
    `)
    .join("");

  document.querySelectorAll(".remove-role-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      roles.splice(index, 1);
      renderRoles();
    });
  });
}

function setMessage(message, type = "") {
  if (!els.formMsg) return;
  els.formMsg.textContent = message;
  els.formMsg.className = "form-message";
  if (type) {
    els.formMsg.classList.add(type);
  }
}

function getEventPayload() {
  return {
    name: document.getElementById("name")?.value.trim(),
    category: document.getElementById("category")?.value.trim(),
    description: document.getElementById("description")?.value.trim(),
    location: {
      venue: document.getElementById("venue")?.value.trim(),
      city: document.getElementById("city")?.value.trim()
    },
    image: imageUrl,
    date: document.getElementById("date")?.value,
    startTime: document.getElementById("startTime")?.value.trim(),
    endTime: document.getElementById("endTime")?.value.trim(),
    volunteerSlots: Number(document.getElementById("slots")?.value || 0),
    roles,
    certificateEnabled: document.getElementById("certificateEnabled")?.checked || false,
    requirements: document
      .getElementById("requirements")
      ?.value.split("\n")
      .map((item) => item.trim())
      .filter(Boolean) || []
  };
}

function extractEventId(res) {
  return (
    res?._id ||
    res?.id ||
    res?.event?._id ||
    res?.event?.id ||
    res?.data?._id ||
    res?.data?.id ||
    ""
  );
}

/* CREATE EVENT */
async function createEvent(status = "draft") {
  const payload = getEventPayload();

  try {
    setMessage(status === "published" ? "Creating and publishing event..." : "Saving draft...");

    const res = await apiRequest("/events", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    console.log("Create event response:", res);

    const eventId = extractEventId(res);

    if (!eventId) {
      throw new Error("Event created but no event ID was returned by the backend.");
    }

    if (status === "published") {
      await apiRequest(`/events/${eventId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "published" })
      });
    }

    setMessage(
      status === "published"
        ? "Event published successfully!"
        : "Draft saved successfully!",
      "success"
    );

    setTimeout(() => {
      window.location.href = ROUTES.organizerDashboard;
    }, 800);
  } catch (err) {
    console.error("Create/publish event error:", err);
    setMessage(err.message || "Something went wrong.", "error");
  }
}

/* ACTIONS */
els.form?.addEventListener("submit", (e) => {
  e.preventDefault();
  createEvent("published");
});

els.saveDraft?.addEventListener("click", (e) => {
  e.preventDefault();
  createEvent("draft");
});

/* LOGOUT */
els.logoutBtn?.addEventListener("click", () => {
  logout(ROUTES.organizerLogin);
});