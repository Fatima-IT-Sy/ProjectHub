// Register, Login, Reset Password, and Logout pages

function isValidEmail(email) {
  // Simple check: text@text.text
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

// Password rules: at least 8 characters, one number, and one uppercase letter
function isValidPassword(password) {
  const hasNumber = /[0-9]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  return password.length >= 8 && hasNumber && hasUppercase;
}

const passwordRulesText = "Use at least 8 characters with one number and one uppercase letter.";

// If the user is already logged in, there is no need to see these pages
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
    } else if (findUserByEmail(email) || email === ADMIN_ACCOUNT.email) {
      setFieldError("email", "This email is already registered. Try logging in instead.");
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
      // Move to the first field with an error
      form.querySelector(".is-invalid").focus();
      return;
    }

    const newUser = {
      id: makeId(),
      fullName: fullName,
      email: email,
      password: password,
      skills: skills,
      interests: interests,
      roles: roles
    };

    const users = getUsers();
    users.push(newUser);
    saveUsers(users);

    // Log the student in and go to the home page
    localStorage.setItem("currentUserId", newUser.id);
    setNextPageMessage("Welcome to ProjectHub, " + fullName.split(" ")[0] + "! Your account is ready.");
    window.location.href = "../index.html";
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

    // The admin logs in from the same page and goes to the admin dashboard
    if (email === ADMIN_ACCOUNT.email && password === ADMIN_ACCOUNT.password) {
      localStorage.setItem("currentUserId", ADMIN_ACCOUNT.id);
      setNextPageMessage("Welcome back, admin!");
      window.location.href = "admin.html";
      return;
    }

    const user = findUserByEmail(email);

    if (!user || user.password !== password) {
      setFieldError("password", "Incorrect email or password. Please try again.");
      document.getElementById("email").classList.add("is-invalid");
      return;
    }

    localStorage.setItem("currentUserId", user.id);
    setNextPageMessage("Welcome back, " + user.fullName.split(" ")[0] + "!");
    window.location.href = "../index.html";
  });
}

// ---------- Reset Password page ----------

function setupResetPage() {
  setupPasswordToggles();

  const emailForm = document.getElementById("emailForm");
  const passwordForm = document.getElementById("passwordForm");
  let resetEmail = "";

  // Step 1: the student enters their email
  emailForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearFormErrors(emailForm);

    const email = document.getElementById("resetEmail").value.trim().toLowerCase();

    if (!isValidEmail(email)) {
      setFieldError("resetEmail", "Please enter a valid email address.");
      return;
    }

    if (!findUserByEmail(email)) {
      setFieldError("resetEmail", "This email is not registered.");
      return;
    }

    // Sending a real email needs the back-end (Sprint 2),
    // so for now we open the new password step directly.
    resetEmail = email;
    document.getElementById("sentToEmail").textContent = email;
    document.getElementById("stepOne").classList.add("d-none");
    document.getElementById("stepTwo").classList.remove("d-none");
  });

  // Step 2: the student sets a new password
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

    const users = getUsers();
    users.forEach(function (user) {
      if (user.email === resetEmail) {
        user.password = newPassword;
      }
    });
    saveUsers(users);

    setNextPageMessage("Your password has been changed. You can now log in.");
    window.location.href = "login.html";
  });
}

// ---------- Logout page ----------

function setupLogoutPage() {
  // Only a logged in student or admin can log out
  const user = requireLogin(true);
  if (!user) {
    return;
  }

  document.getElementById("logoutName").textContent = user.fullName;

  // Cancel: go back to the page the user came from
  document.getElementById("cancelLogout").addEventListener("click", function () {
    const cameFromSite = document.referrer.indexOf(window.location.origin) === 0;
    if (cameFromSite && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = isAdmin(user) ? "admin.html" : "../index.html";
    }
  });

  // Log out: end the session and show the done message
  document.getElementById("confirmLogout").addEventListener("click", function () {
    logoutUser();
    buildNavbar();
    document.getElementById("logoutAsk").classList.add("d-none");
    document.getElementById("logoutDone").classList.remove("d-none");
    document.getElementById("loginAgain").focus();
  });
}
