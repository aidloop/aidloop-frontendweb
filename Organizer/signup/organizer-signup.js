import { apiRequest } from "../../assets/js/api.js";
import { ROUTES } from "../../assets/js/config.js";

const els = {
  form: document.getElementById("signupForm"),
  name: document.getElementById("name"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  phone: document.getElementById("phone"),
  state: document.getElementById("state"),
  city: document.getElementById("city"),
  description: document.getElementById("description"),
  social: document.getElementById("social"),
  btn: document.getElementById("signupBtn"),
  error: document.getElementById("formError"),
  success: document.getElementById("formSuccess")
};

function setLoading(isLoading) {
  els.btn.disabled = isLoading;
  els.btn.textContent = isLoading ? "Creating account..." : "Sign Up";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();

  els.error.textContent = "";
  els.success.textContent = "";

  const fullName = els.name.value.trim();
  const email = els.email.value.trim();
  const password = els.password.value.trim();

  if (!fullName || !email || !password) {
    els.error.textContent = "All required fields must be filled";
    return;
  }

  if (!validateEmail(email)) {
    els.error.textContent = "Invalid email address";
    return;
  }

  if (password.length < 6) {
    els.error.textContent = "Password must be at least 6 characters";
    return;
  }

  try {
    setLoading(true);

    const response = await apiRequest("/auth/register/web", {
      method: "POST",
      header: {"Content-Type": "application.json"},
      body: JSON.stringify({
        fullName,
        email,
        password
      })
    });

    els.success.textContent =
      response.message || "Account created successfully. Check your email for verification.";

    sessionStorage.setItem("aidloop_pending_verification_email", email);
    localStorage.setItem("aidloop_organizer_email", email);

    setTimeout(() => {
      window.location.href = "../verify-email/verify-email.html";
    }, 1200);
  } catch (error) {
    els.error.textContent = error.message || "Signup failed";
  } finally {
    setLoading(false);
  }
});
