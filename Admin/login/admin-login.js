const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const elements = {
  loginForm: document.getElementById("loginForm"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  rememberMe: document.getElementById("rememberMe"),
  togglePassword: document.getElementById("togglePassword"),
  forgotPasswordBtn: document.getElementById("forgotPasswordBtn"),
  loginBtn: document.getElementById("loginBtn"),
  emailError: document.getElementById("emailError"),
  passwordError: document.getElementById("passwordError"),
  formError: document.getElementById("formError"),
  formSuccess: document.getElementById("formSuccess")
};

function clearMessages() {
  elements.emailError.textContent = "";
  elements.passwordError.textContent = "";
  elements.formError.textContent = "";
  elements.formSuccess.textContent = "";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setLoading(isLoading) {
  elements.loginBtn.disabled = isLoading;
  elements.loginBtn.textContent = isLoading ? "Logging in..." : "Log in";
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body || null
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

function loadRememberedEmail() {
  const savedEmail = localStorage.getItem("aidloop_admin_email");
  if (savedEmail) {
    elements.email.value = savedEmail;
    elements.rememberMe.checked = true;
  }
}

function saveRememberedEmail() {
  if (elements.rememberMe.checked) {
    localStorage.setItem("aidloop_admin_email", elements.email.value.trim());
  } else {
    localStorage.removeItem("aidloop_admin_email");
  }
}

async function checkExistingSession() {
  try {
    const status = await apiRequest("/auth/status");
    if (status) {
      window.location.href = "../dashboard/admin-dashboard.html";
    }
  } catch {
    // stay on page
  }
}

elements.togglePassword.addEventListener("click", () => {
  const isPassword = elements.password.type === "password";
  elements.password.type = isPassword ? "text" : "password";
  elements.togglePassword.innerHTML = isPassword
    ? '<i class="fa-regular fa-eye"></i>'
    : '<i class="fa-regular fa-eye-slash"></i>';
});

elements.forgotPasswordBtn.addEventListener("click", () => {
  alert("Forgot password flow is not connected yet.");
});

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();

  const email = elements.email.value.trim();
  const password = elements.password.value.trim();

  let isValid = true;

  if (!email) {
    elements.emailError.textContent = "Email address is required.";
    isValid = false;
  } else if (!validateEmail(email)) {
    elements.emailError.textContent = "Enter a valid email address.";
    isValid = false;
  }

  if (!password) {
    elements.passwordError.textContent = "Password is required.";
    isValid = false;
  } else if (password.length < 6) {
    elements.passwordError.textContent = "Password must be at least 6 characters.";
    isValid = false;
  }

  if (!isValid) return;

  try {
    setLoading(true);

    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    saveRememberedEmail();
    elements.formSuccess.textContent = result.message || "Login successful.";

    setTimeout(() => {
      window.location.href = "../dashboard/admin-dashboard.html";
    }, 700);
  } catch (error) {
    elements.formError.textContent = error.message || "Login failed.";
  } finally {
    setLoading(false);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadRememberedEmail();
  checkExistingSession();
});
