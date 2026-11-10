// Register, Login, and Reset Password pages

function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

function isValidPassword(password) {
  const hasNumber = /[0-9]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  return password.length >= 8 && hasNumber && hasUppercase;
}

const passwordRulesText = "Use at least 8 characters with one number and one uppercase letter.";

function redirectIfLoggedIn() {
  const user = getCurrentUser();
  if (isAdmin(user)) {
    window.location.href = "admin.html";
  } else if (user) {
    window.location.href = "../index.html";
  }
}

// ---------- Register page ----------

function setupRegisterPage() {
  redirectIfLoggedIn();
  setupPasswordToggles();
  setupMultiSelect("skills", SKILL_GROUPS, "Choose your skills");
  setupMultiSelect("interests", INTEREST_GROUPS, "Choose your interests");
  setupMultiSelect("roles", ROLE_GROUPS, "Choose your preferred roles");

  const form = document.getElementById("registerForm");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearFormErrors(form);

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const skills = textToList(document.getElementById("skills").value);
    const interests = textToList(document.getElementById("interests").value);
    const roles = textToList(document.getElementById("roles").value);

    let isValid = true;

    if (fullName === "") {
      setFieldError("fullName", "Please enter your full name.");
      isValid = false;
    }

    if (email === "") {
      setFieldError("email", "Please enter your email address.");
      isValid = false;
    } else if (!isValidEmail(email)) {
      setFieldError("email", "Please enter a valid email address, like name@example.com.");
      isValid = false;
    }

    if (!isValidPassword(password)) {
      setFieldError("password", passwordRulesText);
      isValid = false;
    }

    if (confirmPassword === "" || password !== confirmPassword) {
      setFieldError("confirmPassword", "Passwords do not match.");
      isValid = false;
    }

    if (skills.length === 0) {
      setFieldError("skills", "Please choose at least one skill.");
      isValid = false;
    }

    if (roles.length === 0) {
      setFieldError("roles", "Please choose at least one preferred role.");
      isValid = false;
    }

    if (!isValid) {
      form.querySelector(".is-invalid").focus();
      return;
    }

    sendToServer("register", {
      fullName: fullName,
      email: email,
      password: password,
      skills: skills,
      interests: interests,
      roles: roles
    })
      .then(function () {
        setNextPageMessage("Welcome to ProjectHub, " + fullName.split(" ")[0] + "! Your account is ready.");
        window.location.href = "../index.html";
      })
      .catch(showServerError);
  });
}

// ---------- Login page ----------

function setupLoginPage() {
  redirectIfLoggedIn();
  setupPasswordToggles();
  showSavedMessage();

  const form = document.getElementById("loginForm");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearFormErrors(form);

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    if (email === "") {
      setFieldError("email", "Please enter your email address.");
    }
    if (password === "") {
      setFieldError("password", "Please enter your password.");
    }
    if (email === "" || password === "") {
      return;
    }

    sendToServer("login", { email: email, password: password })
      .then(function (result) {
        if (result.role === "admin") {
          setNextPageMessage("Welcome back, admin!");
          window.location.href = "admin.html";
        } else {
          setNextPageMessage("Welcome back, " + result.fullName.split(" ")[0] + "!");
          window.location.href = "../index.html";
        }
      })
      .catch(function (error) {
        showServerError(error);
        if (error.field === "password") {
          document.getElementById("email").classList.add("is-invalid");
        }
      });
  });
}

// ---------- Reset Password page ----------

function setupResetPage() {
  setupPasswordToggles();

  const emailForm = document.getElementById("emailForm");
  const passwordForm = document.getElementById("passwordForm");
  let resetEmail = "";

  emailForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearFormErrors(emailForm);

    const email = document.getElementById("resetEmail").value.trim().toLowerCase();

    if (!isValidEmail(email)) {
      setFieldError("resetEmail", "Please enter a valid email address.");
      return;
    }

    sendToServer("checkEmail", { email: email })
      .then(function () {
        resetEmail = email;
        document.getElementById("sentToEmail").textContent = email;
        document.getElementById("stepOne").classList.add("d-none");
        document.getElementById("stepTwo").classList.remove("d-none");
      })
      .catch(showServerError);
  });

  passwordForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearFormErrors(passwordForm);

    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmNewPassword").value;

    if (!isValidPassword(newPassword)) {
      setFieldError("newPassword", passwordRulesText);
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldError("confirmNewPassword", "Passwords do not match.");
      return;
    }

    sendToServer("resetPassword", { email: resetEmail, password: newPassword })
      .then(function () {
        setNextPageMessage("Your password has been changed. You can now log in.");
        window.location.href = "login.html";
      })
      .catch(showServerError);
  });
}
