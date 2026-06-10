const tabButtons = document.querySelectorAll(".tab-button");
const panels = document.querySelectorAll(".form-panel");
const demoButtons = document.querySelectorAll("[data-demo]");
const roleButtons = document.querySelectorAll(".role-button");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");

// Role selection
let selectedRole = "analyst";

roleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    roleButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    selectedRole = button.dataset.role;
  });
});

// Tab navigation
tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((item) => item.classList.remove("active"));
    panels.forEach((panel) => panel.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.target).classList.add("active");
  });
});

demoButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector('[data-target="login-form"]').click();
    document.getElementById("login-email").value = button.dataset.email;
    document.getElementById("login-password").value = button.dataset.password;
    document.getElementById("login-message").textContent = `Loaded ${button.dataset.demo} demo credentials.`;
  });
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.getElementById("login-message");
  const submitButton = loginForm.querySelector('button[type="submit"]');
  message.textContent = "Signing in...";
  message.className = "status-text";
  submitButton.disabled = true;

  try {
    const payload = {
      email: document.getElementById("login-email").value.trim().toLowerCase(),
      password: document.getElementById("login-password").value
    };

    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    localStorage.setItem("token", result.token);
    localStorage.setItem("role", result.role);
    localStorage.setItem("fullName", result.fullName);
    localStorage.setItem("email", result.email);
    window.location.href = "/dashboard";
  } catch (error) {
    message.textContent = error.message;
    message.className = "status-text status-error";
  } finally {
    submitButton.disabled = false;
  }
});

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.getElementById("register-message");
  const submitButton = registerForm.querySelector('button[type="submit"]');
  message.textContent = "Creating your account...";
  message.className = "status-text";
  submitButton.disabled = true;

  try {
    if (selectedRole === "admin") {
      throw new Error("Admin accounts are seeded by the system and cannot be self-registered.");
    }

    const payload = {
      fullName: document.getElementById("register-name").value.trim(),
      email: document.getElementById("register-email").value.trim().toLowerCase(),
      password: document.getElementById("register-password").value
    };

    await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    message.textContent = "Registration successful. Please login with your new account.";
    message.className = "status-text status-success";
    document.getElementById("login-email").value = payload.email;
    document.getElementById("login-password").value = payload.password;
    registerForm.reset();
    document.querySelector('[data-target="login-form"]').click();
  } catch (error) {
    message.textContent = error.message;
    message.className = "status-text status-error";
  } finally {
    submitButton.disabled = false;
  }
});
