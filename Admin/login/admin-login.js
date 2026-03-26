const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const els = {
  loginForm: document.getElementById("loginForm"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  rememberMe: document.getElementById("rememberMe"),
  loginBtn: document.getElementById("loginBtn"),
  forgotPasswordBtn: document.getElementById("forgotPasswordBtn"),
  togglePassword: document.getElementById("togglePassword"),
  emailError: document.getElementById("emailError"),
  passwordError: document.getElementById("passwordError"),
  formError: document.getElementById("formError"),
  formSuccess: document.getElementById("formSuccess")
};

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      (data && data.message) ||
      (data && data.error) ||
      "Request failed"
    );
  }

  return data;
}

function clearErrors() {
  els.emailError.textContent = "";
  els.passwordError.textContent = "";
  els.formError.textContent = "";
  els.formSuccess.textContent = "";
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateForm() {
  clearErrors();

  const email = els.email.value.trim();
  const password = els.password.value.trim();
  let isValid = true;

  if (!email) {
    els.emailError.textContent = "Email address is required.";
    isValid = false;
  } else if (!validateEmail(email)) {
    els.emailError.textContent = "Enter a valid email address.";
    isValid = false;
  }

  if (!password) {
    els.passwordError.textContent = "Password is required.";
    isValid = false;
  }

  return isValid;
}

function restoreRememberedEmail() {
  const rememberedEmail = localStorage.getItem("aidloop_admin_email");
  if (rememberedEmail) {
    els.email.value = rememberedEmail;
    els.rememberMe.checked = true;
  }
}

function togglePasswordVisibility() {
  const isPassword = els.password.type === "password";
  els.password.type = isPassword ? "text" : "password";

  els.togglePassword.innerHTML = isPassword
    ? '<i class="fa-regular fa-eye"></i>'
    : '<i class="fa-regular fa-eye-slash"></i>';
}

async function handleLogin(event) {
  event.preventDefault();

  if (!validateForm()) return;

  try {
    clearErrors();
    els.loginBtn.disabled = true;
    els.loginBtn.textContent = "Logging in...";

    const payload = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: els.email.value.trim(),
        password: els.password.value.trim()
      })
    });

    const role = String(payload?.user?.role || payload?.role || "").toLowerCase();

    if (role && role !== "admin") {
      throw new Error("This account is not an admin account.");
    }

    if (els.rememberMe.checked) {
      localStorage.setItem("aidloop_admin_email", els.email.value.trim());
    } else {
      localStorage.removeItem("aidloop_admin_email");
    }

    els.formSuccess.textContent = payload.message || "Login successful.";

    setTimeout(() => {
      window.location.href = "../dashboard/admin-dashboard.html";
    }, 800);
  } catch (error) {
    els.formError.textContent = error.message || "Login failed.";
  } finally {
    els.loginBtn.disabled = false;
    els.loginBtn.textContent = "Log in";
  }
}

function handleForgotPassword() {
  clearErrors();
  els.formError.textContent =
    "No admin forgot-password endpoint has been provided yet.";
}

els.loginForm.addEventListener("submit", handleLogin);
els.togglePassword.addEventListener("click", togglePasswordVisibility);
els.forgotPasswordBtn.addEventListener("click", handleForgotPassword);

document.addEventListener("DOMContentLoaded", restoreRememberedEmail);