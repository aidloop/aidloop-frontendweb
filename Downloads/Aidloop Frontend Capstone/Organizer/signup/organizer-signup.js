// import { apiRequest } from "../assets/js/api.js";
// import { ROUTES } from "../assets/js/config.js";

// const els = {
//   form: document.getElementById("signupForm"),
//   name: document.getElementById("name"),
//   email: document.getElementById("email"),
//   password: document.getElementById("password"),
//   phone: document.getElementById("phone"),
//   state: document.getElementById("state"),
//   city: document.getElementById("city"),
//   description: document.getElementById("description"),
//   social: document.getElementById("social"),
//   btn: document.getElementById("signupBtn"),
//   error: document.getElementById("formError"),
//   success: document.getElementById("formSuccess")
// };

// function setLoading(isLoading) {
//   els.btn.disabled = isLoading;
//   els.btn.textContent = isLoading ? "Creating account..." : "Sign Up";
// }

// function validateEmail(email) {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// }

// els.form.addEventListener("submit", async (e) => {
//   e.preventDefault();

//   els.error.textContent = "";
//   els.success.textContent = "";

//   const fullName = els.name.value.trim();
//   const email = els.email.value.trim();
//   const password = els.password.value.trim();

//   if (!fullName || !email || !password) {
//     els.error.textContent = "All required fields must be filled";
//     return;
//   }

//   if (!validateEmail(email)) {
//     els.error.textContent = "Invalid email address";
//     return;
//   }

//   if (password.length < 6) {
//     els.error.textContent = "Password must be at least 6 characters";
//     return;
//   }

//   try {
//     setLoading(true);

//     const response = await apiRequest("/auth/register/web", {
//       method: "POST",
//       header: {"Content-Type": "application.json"},
//       body: JSON.stringify({
//         fullName,
//         email,
//         password
//       })
//     });

//     els.success.textContent =
//       response.message || "Account created successfully. Check your email for verification.";

//     sessionStorage.setItem("aidloop_pending_verification_email", email);
//     localStorage.setItem("aidloop_organizer_email", email);

//     setTimeout(() => {
//       window.location.href = "../verify-email/verify-email.html";
//     }, 1200);
//   } catch (error) {
//     els.error.textContent = error.message || "Signup failed";
//   } finally {
//     setLoading(false);
//   }
// });









// // import { apiRequest } from "../../assets/js/api.js";
// // import { ROUTES } from "../../assets/js/config.js";

// // const form = document.getElementById("signupForm");
// // const name = document.getElementById("name");
// // const email = document.getElementById("email");
// // const password = document.getElementById("password");
// // const formError = document.getElementById("formError");
// // const formSuccess = document.getElementById("formSuccess");
// // const signupBtn = document.getElementById("signupBtn");

// // form.addEventListener("submit", async (e) => {
// //   e.preventDefault();
// //   formError.textContent = "";
// //   formSuccess.textContent = "";

// //   try {
// //     signupBtn.disabled = true;
// //     const response = await apiRequest("/auth/register/web", {
// //       method: "POST",
// //       body: JSON.stringify({
// //         fullName: name.value.trim(),
// //         email: email.value.trim(),
// //         password: password.value.trim()
// //       })
// //     });

// //     sessionStorage.setItem("aidloop_pending_verification_email", email.value.trim());
// //     localStorage.setItem("aidloop_organizer_email", email.value.trim());
// //     formSuccess.textContent = response.message || "Account created successfully";
// //     setTimeout(() => { window.location.href = ROUTES.organizerVerifyEmail; }, 1000);
// //   } catch (err) {
// //     formError.textContent = err.message || "Signup failed";
// //   } finally {
// //     signupBtn.disabled = false;
// //   }
// // });







import { apiRequest } from "../assets/js/api.js";

const form = document.getElementById("signupForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btn = document.getElementById("signupBtn");
const errorMsg = document.getElementById("formError");
const successMsg = document.getElementById("formSuccess");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";
  successMsg.textContent = "";

  const fullName = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!fullName || !email || !password) {
    errorMsg.textContent = "All required fields must be filled";
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = "Creating account...";

    const response = await apiRequest("/auth/register/web", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password })
    });

    successMsg.textContent = response.message || "Account created successfully. Check your email.";

    setTimeout(() => {
      window.location.href = "../verify-email/verify-email.html";
    }, 1200);
  } catch (err) {
    errorMsg.textContent = err.message || "Signup failed";
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign Up";
  }
});