import { apiRequest } from "../../assets/js/api.js";
import { ROUTES } from "../../assets/js/config.js";

const els = {
  resendBtn: document.getElementById("resendBtn"),
  formError: document.getElementById("formError"),
  formSuccess: document.getElementById("formSuccess"),
  emailText: document.getElementById("emailText")
};

function getStoredEmail() {
  return (
    sessionStorage.getItem("aidloop_pending_verification_email") ||
    localStorage.getItem("aidloop_organizer_email") ||
    ""
  );
}

function setLoading(isLoading) {
  els.resendBtn.disabled = isLoading;
  els.resendBtn.textContent = isLoading ? "Resending..." : "Resend Email";
}

async function resendVerification() {
  const email = getStoredEmail();

  els.formError.textContent = "";
  els.formSuccess.textContent = "";

  if (!email) {
    els.formError.textContent = "No email found. Please sign up again.";
    return;
  }

  try {
    setLoading(true);

    const result = await apiRequest("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email })
    });

    els.formSuccess.textContent =
      result.message || "Verification email sent successfully.";
  } catch (error) {
    els.formError.textContent = error.message || "Failed to resend verification email.";
  } finally {
    setLoading(false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const email = getStoredEmail();

  if (email) {
    els.emailText.textContent = `Sent to: ${email}`;
  } else {
    els.emailText.textContent = "";
  }

  els.resendBtn.addEventListener("click", resendVerification);
});








