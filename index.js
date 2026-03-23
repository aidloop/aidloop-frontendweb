import { apiRequest } from "./assets/js/api.js";
import { ROUTES } from "./assets/js/config.js";

const els = {
  loginMenuBtn: document.getElementById("loginMenuBtn"),
  loginDropdown: document.getElementById("loginDropdown"),
  organizerLoginLink: document.getElementById("organizerLoginLink"),
  adminLoginLink: document.getElementById("adminLoginLink"),
  signupBtnTop: document.getElementById("signupBtnTop"),
  signupBtnHero: document.getElementById("signupBtnHero"),
  signupBtnBottom: document.getElementById("signupBtnBottom")
};

function updateCTAForOrganizer() {
  els.loginMenuBtn.innerHTML = `Dashboard`;
  els.loginMenuBtn.dataset.mode = "direct";
  els.loginMenuBtn.onclick = () => {
    window.location.href = ROUTES.organizerDashboard;
  };

  els.signupBtnTop.textContent = "Dashboard";
  els.signupBtnTop.href = ROUTES.organizerDashboard;

  els.signupBtnHero.textContent = "Go to Dashboard";
  els.signupBtnHero.href = ROUTES.organizerDashboard;

  els.signupBtnBottom.textContent = "Go to Dashboard";
  els.signupBtnBottom.href = ROUTES.organizerDashboard;
}

function updateCTAForAdmin() {
  els.loginMenuBtn.innerHTML = `Admin Dashboard`;
  els.loginMenuBtn.dataset.mode = "direct";
  els.loginMenuBtn.onclick = () => {
    window.location.href = ROUTES.dashboard;
  };

  els.signupBtnTop.textContent = "Admin Dashboard";
  els.signupBtnTop.href = ROUTES.dashboard;

  els.signupBtnHero.textContent = "Go to Admin Dashboard";
  els.signupBtnHero.href = ROUTES.dashboard;

  els.signupBtnBottom.textContent = "Go to Admin Dashboard";
  els.signupBtnBottom.href = ROUTES.dashboard;
}

function bindDropdown() {
  els.loginMenuBtn?.addEventListener("click", (event) => {
    if (els.loginMenuBtn.dataset.mode === "direct") return;

    event.stopPropagation();
    els.loginDropdown.classList.toggle("show");
  });

  document.addEventListener("click", () => {
    els.loginDropdown.classList.remove("show");
  });

  els.loginDropdown?.addEventListener("click", (event) => {
    event.stopPropagation();
  });
}

async function detectExistingSession() {
  try {
    let user;

    try {
      user = await apiRequest("/user/me");
    } catch {
      user = await apiRequest("/users/me");
    }

    const role = String(user.role || "").toLowerCase();

    if (role === "organizer") {
      updateCTAForOrganizer();
    } else if (role === "admin") {
      updateCTAForAdmin();
    }
  } catch {
    // guest user
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  bindDropdown();
  await detectExistingSession();
});









// import { apiRequest } from "./assets/js/api.js";
// import { ROUTES } from "./assets/js/config.js";

// const els = {
//   loginMenuBtn: document.getElementById("loginMenuBtn"),
//   loginDropdown: document.getElementById("loginDropdown"),
//   signupBtnTop: document.getElementById("signupBtnTop"),
//   signupBtnHero: document.getElementById("signupBtnHero")
// };

// function bindDropdown() {
//   els.loginMenuBtn.addEventListener("click", (e) => {
//     e.stopPropagation();
//     els.loginDropdown.classList.toggle("show");
//   });
//   document.addEventListener("click", () => els.loginDropdown.classList.remove("show"));
// }

// function organizerMode() {
//   els.loginMenuBtn.textContent = "Dashboard";
//   els.loginMenuBtn.onclick = () => (window.location.href = ROUTES.organizerDashboard);
//   els.signupBtnTop.textContent = "Dashboard";
//   els.signupBtnTop.href = ROUTES.organizerDashboard;
//   els.signupBtnHero.textContent = "Go to Dashboard";
//   els.signupBtnHero.href = ROUTES.organizerDashboard;
// }

// function adminMode() {
//   els.loginMenuBtn.textContent = "Admin Dashboard";
//   els.loginMenuBtn.onclick = () => (window.location.href = ROUTES.adminDashboard);
//   els.signupBtnTop.textContent = "Admin Dashboard";
//   els.signupBtnTop.href = ROUTES.adminDashboard;
//   els.signupBtnHero.textContent = "Go to Admin Dashboard";
//   els.signupBtnHero.href = ROUTES.adminDashboard;
// }

// document.addEventListener("DOMContentLoaded", async () => {
//   bindDropdown();
//   try {
//     let user;
//     try { user = await apiRequest("/user/me"); } catch { user = await apiRequest("/users/me"); }
//     const role = String(user.role || "").toLowerCase();
//     if (role === "organizer") organizerMode();
//     if (role === "admin") adminMode();
//   } catch {
//     // guest
//   }
// });

