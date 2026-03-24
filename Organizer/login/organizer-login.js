import { apiRequest } from "../../assets/js/api.js";
import { ROUTES } from "../../assets/js/config.js";

const els = {
  form: document.getElementById("loginForm"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  togglePassword: document.getElementById("togglePassword"),
  loginBtn: document.getElementById("loginBtn"),

  emailError: document.getElementById("emailError"),
  passwordError: document.getElementById("passwordError"),
  formError: document.getElementById("formError"),
  formSuccess: document.getElementById("formSuccess")
};

function clearMessages() {
  els.emailError.textContent = "";
  els.passwordError.textContent = "";
  els.formError.textContent = "";
  els.formSuccess.textContent = "";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setLoading(isLoading) {
  els.loginBtn.disabled = isLoading;
  els.loginBtn.textContent = isLoading ? "Logging in..." : "Log in";
}

/* Toggle password */
els.togglePassword.addEventListener("click", () => {
  const isPassword = els.password.type === "password";
  els.password.type = isPassword ? "text" : "password";

  els.togglePassword.innerHTML = isPassword
    ? '<i class="fa-regular fa-eye"></i>'
    : '<i class="fa-regular fa-eye-slash"></i>';
});

/* Submit */
els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessages();

  const email = els.email.value.trim();
  const password = els.password.value.trim();

  let valid = true;

  if (!email) {
    els.emailError.textContent = "Email is required";
    valid = false;
  } else if (!validateEmail(email)) {
    els.emailError.textContent = "Invalid email format";
    valid = false;
  }

  if (!password) {
    els.passwordError.textContent = "Password is required";
    valid = false;
  }

  if (!valid) return;

  try {
    setLoading(true);

    const response = await apiRequest("/auth/webLogin", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    els.formSuccess.textContent = response.message || "Login successful";

    /* Optional: role check */
    if (response?.user?.role !== "organizer") {
      throw new Error("Not an organizer account");
    }

    setTimeout(() => {
      window.location.href = ROUTES.organizerDashboard;
    }, 800);

  } catch (error) {
    els.formError.textContent = error.message || "Login failed";
  } finally {
    setLoading(false);
  }
});
