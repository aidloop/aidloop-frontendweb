import { apiRequest } from "../assets/js/api.js";
import { ROUTES } from "../assets/js/config.js";

const els = {
  continueBtn: document.getElementById("continueBtn"),
  statusText: document.getElementById("statusText")
};

function setLoading(isLoading) {
  els.continueBtn.disabled = isLoading;
  els.continueBtn.textContent = isLoading
    ? "Checking session..."
    : "Continue to Dashboard";
}

async function checkUserSession() {
  try {
    setLoading(true);

    let user;
    try {
      user = await apiRequest("/users/me");
    } catch {
      user = await apiRequest("/user/me");
    }

    if (user && String(user.role || "").toLowerCase() === "organizer") {
      els.statusText.textContent = "You are already signed in.";
      return true;
    }

    els.statusText.textContent = "";
    return false;
  } catch {
    els.statusText.textContent = "";
    return false;
  } finally {
    setLoading(false);
  }
}

els.continueBtn.addEventListener("click", async () => {
  const hasSession = await checkUserSession();

  if (hasSession) {
    window.location.href = ROUTES.organizerDashboard;
    return;
  }

  window.location.href = ROUTES.organizerLogin;
});

document.addEventListener("DOMContentLoaded", async () => {
  await checkUserSession();
});





// import { ROUTES } from "../../assets/js/config.js";
// document.getElementById("continueBtn").addEventListener("click", () => {
//   window.location.href = ROUTES.organizerLogin;
// });
