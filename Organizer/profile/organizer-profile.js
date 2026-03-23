import { apiRequest, normalizeArray } from "../assets/js/api.js";
import { requireRole } from "../assets/js/auth.js";
import { logout } from "../assets/js/logout.js";
import { ROUTES } from "../assets/js/config.js";

const els = {
  orgName: document.getElementById("orgName"),
  orgType: document.getElementById("orgType"),
  orgCategory: document.getElementById("orgCategory"),
  verificationText: document.getElementById("verificationText"),
  profileAvatarBox: document.getElementById("profileAvatarBox"),

  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  website: document.getElementById("website"),
  location: document.getElementById("location"),
  description: document.getElementById("description"),

  totalEvents: document.getElementById("totalEvents"),
  totalVolunteers: document.getElementById("totalVolunteers"),
  certificatesIssued: document.getElementById("certificatesIssued"),

  eventsMonthText: document.getElementById("eventsMonthText"),
  volunteersMonthText: document.getElementById("volunteersMonthText"),
  certificatesMonthText: document.getElementById("certificatesMonthText"),

  editProfileBtn: document.getElementById("editProfileBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  profileMessage: document.getElementById("profileMessage")
};

let organizer = null;
let isEditing = false;

function getInitials(name) {
  return String(name || "AL")
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getVerificationLabel(user) {
  const status = String(user.status || "").toLowerCase();
  const approvalStatus = String(user.approvalStatus || "").toLowerCase();
  const isVerified = Boolean(user.isVerified);

  if (
    status === "verified" ||
    status === "approved" ||
    approvalStatus === "verified" ||
    approvalStatus === "approved" ||
    isVerified
  ) {
    return "Verified Org";
  }

  return "Pending Verification";
}

function getLocationText(user) {
  if (typeof user.location === "string" && user.location.trim()) {
    return user.location;
  }

  if (user.location && typeof user.location === "object") {
    return [
      user.location.venue,
      user.location.city || user.location.state
    ].filter(Boolean).join(", ");
  }

  return user.city || user.state || "—";
}

function populateProfile(user) {
  const name = user.fullName || user.name || user.organizationName || "Organization";

  els.orgName.textContent = name;
  els.orgType.textContent = user.organizationType || "Non-profit";
  els.orgCategory.textContent = user.category || "Volunteer Management";
  els.verificationText.textContent = getVerificationLabel(user);
  els.profileAvatarBox.textContent = getInitials(name);

  els.email.value = user.email || "";
  els.phoneNumber.value = user.phoneNumber || user.phone || "";
  els.website.value =
    user.website ||
    user.socialLink ||
    user.socialLinks?.[0] ||
    "—";
  els.location.value = getLocationText(user) || "—";
  els.description.value =
    user.description ||
    user.bio ||
    "No organization description available.";
}

function setEditable(editable) {
  els.phoneNumber.readOnly = !editable;
  els.website.readOnly = !editable;
  els.location.readOnly = !editable;
  els.description.readOnly = !editable;
}

async function loadStats() {
  try {
    const eventsPayload = await apiRequest("/events");
    const events = normalizeArray(eventsPayload, ["events"]);

    const organizerId = String(organizer._id || organizer.id || "");

    const ownEvents = events.filter((event) => {
      if (typeof event.organizer === "object" && event.organizer) {
        return String(event.organizer._id || event.organizer.id || "") === organizerId;
      }
      return String(event.organizerId || "") === organizerId;
    });

    const totalEvents = ownEvents.length;

    const totalVolunteers = ownEvents.reduce((sum, event) => {
      return sum + (
        event.filledSlots ??
        event.registrationsCount ??
        event.registeredCount ??
        event.attendeesCount ??
        0
      );
    }, 0);

    els.totalEvents.textContent = totalEvents;
    els.totalVolunteers.textContent = totalVolunteers;
    els.certificatesIssued.textContent = "0";

    els.eventsMonthText.textContent = "This month";
    els.volunteersMonthText.textContent = "This month";
    els.certificatesMonthText.textContent = "This month";
  } catch {
    els.totalEvents.textContent = "0";
    els.totalVolunteers.textContent = "0";
    els.certificatesIssued.textContent = "0";
  }
}

async function saveProfile() {
  const payload = {
    phoneNumber: els.phoneNumber.value.trim(),
    website: els.website.value.trim(),
    location: els.location.value.trim(),
    description: els.description.value.trim()
  };

  await apiRequest("/user/me", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

els.editProfileBtn.addEventListener("click", async () => {
  els.profileMessage.textContent = "";
  els.profileMessage.className = "profile-message";

  if (!isEditing) {
    isEditing = true;
    setEditable(true);
    els.editProfileBtn.textContent = "Save Profile";
    return;
  }

  try {
    await saveProfile();
    isEditing = false;
    setEditable(false);
    els.editProfileBtn.textContent = "Edit Profile";
    els.profileMessage.textContent = "Profile updated successfully.";
    els.profileMessage.classList.add("success");
  } catch (error) {
    els.profileMessage.textContent = error.message || "Failed to update profile.";
    els.profileMessage.classList.add("error");
  }
});

els.logoutBtn.addEventListener("click", () => {
  logout(ROUTES.organizerLogin);
});

document.addEventListener("DOMContentLoaded", async () => {
  organizer = await requireRole("organizer", ROUTES.organizerLogin);
  if (!organizer) return;

  populateProfile(organizer);
  setEditable(false);
  await loadStats();
});











// import { apiRequest } from "../../assets/js/api.js";
// import { requireOrganizer } from "../../assets/js/auth.js";
// import { logout } from "../../assets/js/logout.js";
// import { ROUTES } from "../../assets/js/config.js";
// import { getLocationText } from "../../assets/js/utils.js";

// const els = {
//   orgName: document.getElementById("orgName"),
//   email: document.getElementById("email"),
//   phoneNumber: document.getElementById("phoneNumber"),
//   website: document.getElementById("website"),
//   location: document.getElementById("location"),
//   description: document.getElementById("description"),
//   editProfileBtn: document.getElementById("editProfileBtn"),
//   logoutBtn: document.getElementById("logoutBtn"),
//   profileMessage: document.getElementById("profileMessage")
// };

// let isEditing = false;

// function setEditable(editable) {
//   els.phoneNumber.readOnly = !editable;
//   els.website.readOnly = !editable;
//   els.location.readOnly = !editable;
//   els.description.readOnly = !editable;
// }

// document.addEventListener("DOMContentLoaded", async () => {
//   const organizer = await requireOrganizer();
//   if (!organizer) return;

//   els.logoutBtn.addEventListener("click", () => logout(ROUTES.home));

//   function fill(user) {
//     els.orgName.textContent = user.fullName || user.name || user.organizationName || "Organization";
//     els.email.value = user.email || "";
//     els.phoneNumber.value = user.phoneNumber || user.phone || "";
//     els.website.value = user.website || user.socialLink || user.socialLinks?.[0] || "";
//     els.location.value = getLocationText(user);
//     els.description.value = user.description || user.bio || "";
//   }

//   fill(organizer);
//   setEditable(false);

//   els.editProfileBtn.addEventListener("click", async () => {
//     els.profileMessage.textContent = "";
//     if (!isEditing) {
//       isEditing = true;
//       setEditable(true);
//       els.editProfileBtn.textContent = "Save Profile";
//       return;
//     }
//     try {
//       await apiRequest("/user/me", {
//         method: "PUT",
//         body: JSON.stringify({
//           phoneNumber: els.phoneNumber.value.trim(),
//           website: els.website.value.trim(),
//           location: els.location.value.trim(),
//           description: els.description.value.trim()
//         })
//       });
//       isEditing = false;
//       setEditable(false);
//       els.editProfileBtn.textContent = "Edit Profile";
//       els.profileMessage.textContent = "Profile updated successfully.";
//       els.profileMessage.className = "success-message";
//     } catch (err) {
//       els.profileMessage.textContent = err.message || "Failed to update profile.";
//       els.profileMessage.className = "form-error";
//     }
//   });
// });
