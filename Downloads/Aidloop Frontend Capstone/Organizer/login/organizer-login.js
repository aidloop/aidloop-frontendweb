import { apiRequest } from "../assets/js/api.js";
import { ROUTES } from "../assets/js/config.js";

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








// import { apiRequest } from "../../assets/js/api.js";
// import { ROUTES } from "../../assets/js/config.js";

// const form = document.getElementById("loginForm");
// const email = document.getElementById("email");
// const password = document.getElementById("password");
// const formError = document.getElementById("formError");
// const formSuccess = document.getElementById("formSuccess");
// const loginBtn = document.getElementById("loginBtn");

// form.addEventListener("submit", async (e) => {
//   e.preventDefault();
//   formError.textContent = "";
//   formSuccess.textContent = "";

//   try {
//     loginBtn.disabled = true;
//     const response = await apiRequest("/auth/login", {
//       method: "POST",
//       body: JSON.stringify({ email: email.value.trim(), password: password.value.trim() })
//     });
//     if (String(response?.user?.role || "organizer").toLowerCase() !== "organizer") {
//       throw new Error("Not an organizer account");
//     }
//     localStorage.setItem("aidloop_organizer_email", email.value.trim());
//     formSuccess.textContent = response.message || "Login successful";
//     setTimeout(() => { window.location.href = ROUTES.organizerDashboard; }, 800);
//   } catch (err) {
//     formError.textContent = err.message || "Login failed";
//   } finally {
//     loginBtn.disabled = false;
//   }
// });
