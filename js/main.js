// Shared code used by all pages

// Pages inside the "pages" folder need "../" to reach the main folder
const inPagesFolder = window.location.pathname.includes("/pages/");
const rootPath = inPagesFolder ? "../" : "";
const pagesPath = inPagesFolder ? "" : "pages/";

// ---------- Small helpers ----------

// Stop user text from being read as HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// "HTML, CSS, JavaScript" -> ["HTML", "CSS", "JavaScript"]
function textToList(text) {
  return text
    .split(",")
    .map(function (item) {
      return item.trim();
    })
    .filter(function (item) {
      return item !== "";
    });
}

// Show a list as tags. Matched items get a darker color.
function listToTags(list, matchedList) {
  const matched = (matchedList || []).map(function (item) {
    return item.toLowerCase();
  });
  let html = "";
  list.forEach(function (item) {
    const extraClass = matched.includes(item.toLowerCase()) ? " tag-match" : "";
    html += '<span class="tag' + extraClass + '">' + escapeHtml(item) + "</span>";
  });
  return html;
}

// "Sara Alqahtani" -> "SA"
function getInitials(name) {
  const parts = name.trim().split(" ");
  let initials = parts[0].charAt(0);
  if (parts.length > 1) {
    initials += parts[parts.length - 1].charAt(0);
  }
  return initials.toUpperCase();
}

function formatDate(dateText) {
  const date = new Date(dateText);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function todayText() {
  return new Date().toISOString().slice(0, 10);
}

function typeBadgeHtml(type) {
  const types = {
    "Hackathon": { css: "type-hackathon", icon: "bi-lightning-charge" },
    "Competition": { css: "type-competition", icon: "bi-trophy" },
    "Practical Project": { css: "type-project", icon: "bi-folder2-open" }
  };
  const info = types[type] || types["Practical Project"];
  return '<span class="type-badge ' + info.css + '"><i class="bi ' + info.icon + '"></i>' + escapeHtml(type) + "</span>";
}

function emptyStateHtml(icon, title, text, buttonText, buttonLink) {
  let button = "";
  if (buttonText) {
    button = '<a class="btn btn-primary" href="' + buttonLink + '">' + buttonText + "</a>";
  }
  return (
    '<div class="empty-state">' +
    '<i class="bi ' + icon + '"></i>' +
    "<h3>" + title + "</h3>" +
    "<p>" + text + "</p>" +
    button +
    "</div>"
  );
}

// ---------- Teams and requests used by many pages ----------

function getTeamsCreatedBy(userId) {
  return getTeams().filter(function (team) {
    return team.creatorId === userId;
  });
}

function getTeamsOfMember(userId) {
  return getTeams().filter(function (team) {
    return team.members.includes(userId);
  });
}

// Pending requests sent to the teams this user created
function getReceivedPendingRequests(userId) {
  const myTeamIds = getTeamsCreatedBy(userId).map(function (team) {
    return team.id;
  });
  return getRequests().filter(function (request) {
    return myTeamIds.includes(request.teamId) && request.status === "pending";
  });
}

function teamCardHtml(team, extraHtml) {
  return (
    '<div class="col-md-6 col-lg-4">' +
    '<div class="ph-card ph-card-hover team-card">' +
    "<div>" + typeBadgeHtml(team.type) + "</div>" +
    "<h3>" + escapeHtml(team.title) + "</h3>" +
    '<p class="description">' + escapeHtml(team.description) + "</p>" +
    (extraHtml || "") +
    '<div class="small-label">Required skills</div>' +
    "<div>" + listToTags(team.skills) + "</div>" +
    '<div class="card-bottom">' +
    '<span class="meta"><i class="bi bi-people me-1"></i>' + team.members.length + " member(s)</span>" +
    '<a class="btn btn-sm btn-soft" href="' + pagesPath + "view-team.html?id=" + team.id + '">View team</a>' +
    "</div></div></div>"
  );
}

// ---------- Toast messages ----------

function showToast(text, type) {
  let area = document.getElementById("toastArea");
  if (!area) {
    area = document.createElement("div");
    area.id = "toastArea";
    area.className = "toast-area";
    document.body.appendChild(area);
  }

  const kind = type || "success";
  const icon = kind === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle-fill";
  const toast = document.createElement("div");
  toast.className = "toast ph-toast " + kind;
  toast.setAttribute("role", "status");
  toast.innerHTML =
    '<div class="toast-body"><i class="bi ' + icon + '"></i><span>' + escapeHtml(text) + "</span>" +
    '<button type="button" class="btn-close ms-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>';
  area.appendChild(toast);

  new bootstrap.Toast(toast, { delay: 3500 }).show();
}

// Save a message to show on the next page (after moving to another page)
function setNextPageMessage(text) {
  sessionStorage.setItem("nextPageMessage", text);
}

function showSavedMessage() {
  const text = sessionStorage.getItem("nextPageMessage");
  if (text) {
    sessionStorage.removeItem("nextPageMessage");
    showToast(text, "success");
  }
}

// ---------- Form errors under each field ----------

function setFieldError(fieldId, text) {
  const field = document.getElementById(fieldId);
  // For a drop-down list, the red border goes on its button
  const shownField = document.getElementById(fieldId + "Picker") || field;
  shownField.classList.add("is-invalid");
  let feedback = document.getElementById(fieldId + "Error");
  if (!feedback) {
    feedback = document.createElement("div");
    feedback.id = fieldId + "Error";
    feedback.className = "invalid-feedback";
    // In an input group or a drop-down list the message goes after the whole box
    const group = field.closest(".input-group, .multi-select");
    (group || field).insertAdjacentElement("afterend", feedback);
  }
  feedback.textContent = text;
  feedback.style.display = "block";
  // Hide the hint under the field while the error is showing
  feedback.parentElement.classList.add("has-error");

  // Remove the error as soon as the user changes the field
  field.addEventListener("input", function () {
    shownField.classList.remove("is-invalid");
    feedback.style.display = "none";
    feedback.parentElement.classList.remove("has-error");
  }, { once: true });
}

function clearFormErrors(form) {
  form.querySelectorAll(".is-invalid").forEach(function (field) {
    field.classList.remove("is-invalid");
  });
  form.querySelectorAll(".invalid-feedback").forEach(function (feedback) {
    feedback.style.display = "none";
    feedback.parentElement.classList.remove("has-error");
  });
}

// ---------- Show / hide password buttons ----------

function setupPasswordToggles() {
  document.querySelectorAll(".toggle-password").forEach(function (button) {
    button.addEventListener("click", function () {
      const input = document.getElementById(button.dataset.target);
      const icon = button.querySelector("i");
      if (input.type === "password") {
        input.type = "text";
        icon.className = "bi bi-eye-slash";
        button.setAttribute("aria-label", "Hide password");
      } else {
        input.type = "password";
        icon.className = "bi bi-eye";
        button.setAttribute("aria-label", "Show password");
      }
    });
  });
}

// ---------- Live preview of skills as tags ----------

// ---------- Drop-down list with checkboxes ----------

// Turns a hidden input into a drop-down list where the student ticks items.
// The chosen items are saved in the hidden input like "Back-end, PHP",
// so the rest of the code reads it the same way as a normal text field.
function setupMultiSelect(fieldId, groups, placeholder) {
  const field = document.getElementById(fieldId);

  // Put the hidden input inside a box that holds the whole list
  const box = document.createElement("div");
  box.className = "dropdown multi-select";
  field.parentNode.insertBefore(box, field);
  box.appendChild(field);

  let optionsHtml = "";
  groups.forEach(function (group) {
    optionsHtml += '<div class="picker-section"><div class="picker-group">' + escapeHtml(group.title) + "</div>";
    group.items.forEach(function (item) {
      optionsHtml +=
        '<label class="picker-option"><input class="form-check-input" type="checkbox" value="' + escapeHtml(item) + '">' +
        "<span>" + escapeHtml(item) + "</span></label>";
    });
    optionsHtml += "</div>";
  });

  box.insertAdjacentHTML("beforeend",
    '<button type="button" class="form-select picker-button" id="' + fieldId + 'Picker" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false"></button>' +
    '<div class="dropdown-menu picker-menu">' +
    '<input type="text" class="form-control form-control-sm picker-search" placeholder="Search the list..." aria-label="Search the list">' +
    '<div class="picker-options">' + optionsHtml + "</div>" +
    '<p class="picker-empty meta d-none">No results.</p>' +
    "</div>" +
    '<div class="picker-chips"></div>');

  const button = box.querySelector(".picker-button");
  const search = box.querySelector(".picker-search");
  const chips = box.querySelector(".picker-chips");
  const checkboxes = box.querySelectorAll(".picker-option input");

  // The label now points to the button
  const label = document.querySelector('label[for="' + fieldId + '"]');
  if (label) {
    label.htmlFor = button.id;
  }

  function getSelected() {
    return textToList(field.value);
  }

  function setSelected(list) {
    field.value = list.join(", ");
    field.dispatchEvent(new Event("input"));
  }

  // Show the chosen items on the button, the checkboxes, and the tags
  function showSelected() {
    const selected = getSelected();
    checkboxes.forEach(function (checkbox) {
      checkbox.checked = selected.includes(checkbox.value);
    });
    button.textContent = selected.length === 0 ? placeholder : selected.length + " selected";
    button.classList.toggle("has-value", selected.length > 0);
    chips.innerHTML = selected
      .map(function (item) {
        return (
          '<span class="tag picker-tag">' + escapeHtml(item) +
          '<button type="button" data-value="' + escapeHtml(item) + '" aria-label="Remove ' + escapeHtml(item) + '">&times;</button></span>'
        );
      })
      .join("");
  }

  checkboxes.forEach(function (checkbox) {
    checkbox.addEventListener("change", function () {
      const selected = getSelected().filter(function (item) {
        return item !== checkbox.value;
      });
      if (checkbox.checked) {
        selected.push(checkbox.value);
      }
      setSelected(selected);
    });
  });

  // The x on a tag removes it
  chips.addEventListener("click", function (event) {
    const removeButton = event.target.closest("button");
    if (removeButton) {
      setSelected(getSelected().filter(function (item) {
        return item !== removeButton.dataset.value;
      }));
    }
  });

  // Filter the list while typing in the search box
  search.addEventListener("input", function () {
    const word = search.value.trim().toLowerCase();
    let found = 0;
    box.querySelectorAll(".picker-section").forEach(function (section) {
      let foundInSection = 0;
      section.querySelectorAll(".picker-option").forEach(function (option) {
        const show = option.textContent.toLowerCase().includes(word);
        option.classList.toggle("d-none", !show);
        if (show) {
          foundInSection++;
        }
      });
      section.classList.toggle("d-none", foundInSection === 0);
      found += foundInSection;
    });
    box.querySelector(".picker-empty").classList.toggle("d-none", found > 0);
  });

  box.addEventListener("shown.bs.dropdown", function () {
    search.focus();
  });

  // When other code fills the field (like the edit forms), update the list
  field.addEventListener("input", showSelected);
  showSelected();
}

// All interests that are not already in the skills list (for Search Students)
function skillAndInterestGroups() {
  const allSkills = [];
  SKILL_GROUPS.forEach(function (group) {
    group.items.forEach(function (item) {
      allSkills.push(item);
    });
  });
  const otherInterests = [];
  INTEREST_GROUPS.forEach(function (group) {
    group.items.forEach(function (item) {
      if (!allSkills.includes(item)) {
        otherInterests.push(item);
      }
    });
  });
  return SKILL_GROUPS.concat([{ title: "Interests", items: otherInterests }]);
}

// ---------- Navbar ----------

function buildNavbar() {
  const navbar = document.getElementById("navbar");
  if (!navbar) {
    return;
  }

  const user = getCurrentUser();
  const logoHtml =
    '<a class="navbar-brand" href="' + rootPath + 'index.html">' +
    '<img src="' + rootPath + 'images/logo.png" alt="">ProjectHub</a>';

  navbar.className = "navbar navbar-expand-lg ph-navbar sticky-top";

  const onAboutPage = window.location.pathname.endsWith("about.html");
  const aboutClass = onAboutPage ? " active" : "";

  // Visitors see the logo and the About Us link
  if (!user) {
    navbar.innerHTML =
      '<div class="container">' + logoHtml +
      '<a class="nav-link about-link' + aboutClass + '" href="' + pagesPath + 'about.html">About Us</a></div>';
    return;
  }

  if (isAdmin(user)) {
    buildAdminNavbar(user, logoHtml);
    return;
  }

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const links = [
    { text: "Home", icon: "bi-house", href: rootPath + "index.html", page: "index.html" },
    { text: "Search Teams", icon: "bi-search", href: pagesPath + "search-teams.html", page: "search-teams.html" },
    { text: "Search Students", icon: "bi-person-lines-fill", href: pagesPath + "search-students.html", page: "search-students.html" },
    { text: "About Us", icon: "bi-info-circle", href: pagesPath + "about.html", page: "about.html" }
  ];

  let linksHtml = "";
  links.forEach(function (link) {
    const active = link.page === currentPage ? " active" : "";
    linksHtml +=
      '<li class="nav-item"><a class="nav-link' + active + '" href="' + link.href + '">' +
      '<i class="bi ' + link.icon + ' me-1"></i>' + link.text + "</a></li>";
  });

  const pendingCount = getReceivedPendingRequests(user.id).length;
  let badge = "";
  if (pendingCount > 0) {
    badge = '<span class="badge rounded-pill text-bg-danger ms-auto" id="requestsBadge">' + pendingCount + "</span>";
  }

  navbar.innerHTML =
    '<div class="container">' +
    logoHtml +
    '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainMenu" aria-label="Open menu">' +
    '<span class="navbar-toggler-icon"></span></button>' +
    '<div class="collapse navbar-collapse" id="mainMenu">' +
    '<ul class="navbar-nav mx-lg-auto gap-lg-1">' + linksHtml + "</ul>" +
    '<div class="d-flex align-items-center gap-3 mt-3 mt-lg-0">' +
    '<a class="btn btn-primary" href="' + pagesPath + 'create-team.html"><i class="bi bi-plus-lg me-1"></i>Create Team</a>' +
    '<div class="dropdown">' +
    '<button class="avatar-button" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Account menu">' +
    '<span class="avatar">' + escapeHtml(getInitials(user.fullName)) + "</span>" +
    '<i class="bi bi-chevron-down small"></i></button>' +
    '<ul class="dropdown-menu dropdown-menu-end">' +
    '<li class="menu-user"><div class="fw-semibold">' + escapeHtml(user.fullName) + "</div>" +
    '<div class="meta">' + escapeHtml(user.email) + "</div></li>" +
    '<li><hr class="dropdown-divider"></li>' +
    '<li><a class="dropdown-item" href="' + pagesPath + 'profile.html"><i class="bi bi-person"></i>My Profile</a></li>' +
    '<li><a class="dropdown-item" href="' + pagesPath + 'requests.html"><i class="bi bi-envelope"></i>Requests' + badge + "</a></li>" +
    '<li><hr class="dropdown-divider"></li>' +
    '<li><a class="dropdown-item text-danger" href="' + pagesPath + 'logout.html"><i class="bi bi-box-arrow-right"></i>Log out</a></li>' +
    "</ul></div></div></div></div>";
}

// The admin sees the dashboard link and the account menu only
function buildAdminNavbar(user, logoHtml) {
  const navbar = document.getElementById("navbar");
  const onAboutPage = window.location.pathname.endsWith("about.html");
  navbar.innerHTML =
    '<div class="container">' +
    logoHtml +
    '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainMenu" aria-label="Open menu">' +
    '<span class="navbar-toggler-icon"></span></button>' +
    '<div class="collapse navbar-collapse" id="mainMenu">' +
    '<ul class="navbar-nav mx-lg-auto gap-lg-1">' +
    '<li class="nav-item"><a class="nav-link' + (onAboutPage ? "" : " active") + '" href="' + pagesPath + 'admin.html"><i class="bi bi-speedometer2 me-1"></i>Admin Dashboard</a></li>' +
    '<li class="nav-item"><a class="nav-link' + (onAboutPage ? " active" : "") + '" href="' + pagesPath + 'about.html"><i class="bi bi-info-circle me-1"></i>About Us</a></li>' +
    "</ul>" +
    '<div class="d-flex align-items-center gap-3 mt-3 mt-lg-0">' +
    '<div class="dropdown">' +
    '<button class="avatar-button" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Account menu">' +
    '<span class="avatar"><i class="bi bi-shield-lock"></i></span>' +
    '<i class="bi bi-chevron-down small"></i></button>' +
    '<ul class="dropdown-menu dropdown-menu-end">' +
    '<li class="menu-user"><div class="fw-semibold">' + escapeHtml(user.fullName) + "</div>" +
    '<div class="meta">' + escapeHtml(user.email) + "</div></li>" +
    '<li><hr class="dropdown-divider"></li>' +
    '<li><a class="dropdown-item text-danger" href="' + pagesPath + 'logout.html"><i class="bi bi-box-arrow-right"></i>Log out</a></li>' +
    "</ul></div></div></div></div>";
}

// ---------- Confirm dialog (delete account) ----------

function showConfirmDialog(options) {
  const oldDialog = document.getElementById("confirmDialog");
  if (oldDialog) {
    oldDialog.remove();
  }

  const dialog = document.createElement("div");
  dialog.id = "confirmDialog";
  dialog.className = "modal fade confirm-modal";
  dialog.tabIndex = -1;
  dialog.setAttribute("aria-labelledby", "confirmTitle");
  dialog.innerHTML =
    '<div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">' +
    '<div class="modal-content"><div class="modal-body">' +
    options.topHtml +
    '<h2 class="h4" id="confirmTitle">' + options.title + "</h2>" +
    '<p class="text-secondary">' + options.text + "</p>" +
    '<div class="d-flex gap-2 justify-content-center mt-4">' +
    '<button type="button" class="btn ' + options.buttonClass + '" id="confirmButton">' + options.buttonText + "</button>" +
    '<button type="button" class="btn btn-soft" data-bs-dismiss="modal">Cancel</button>' +
    "</div></div></div></div>";
  document.body.appendChild(dialog);

  const modal = new bootstrap.Modal(dialog);
  document.getElementById("confirmButton").addEventListener("click", function () {
    modal.hide();
    options.onConfirm();
  });
  modal.show();
}

// ---------- Login session ----------

function logoutUser() {
  localStorage.removeItem("currentUserId");
}

// Send the user to the login page if they are not logged in.
// Student pages send the admin to the admin dashboard, unless allowAdmin is true.
function requireLogin(allowAdmin) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = pagesPath + "login.html";
    return null;
  }
  if (isAdmin(user) && !allowAdmin) {
    window.location.href = pagesPath + "admin.html";
    return null;
  }
  return user;
}

// Only the admin can open the admin pages
function requireAdmin() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = pagesPath + "login.html";
    return null;
  }
  if (!isAdmin(user)) {
    window.location.href = rootPath + "index.html";
    return null;
  }
  return user;
}

// ---------- Home page ----------

function setupHomePage() {
  const user = getCurrentUser();

  // The admin has their own home page
  if (isAdmin(user)) {
    window.location.href = "pages/admin.html";
    return;
  }

  if (!user) {
    document.getElementById("dashboardSection").style.display = "none";
    document.documentElement.classList.add("guest");
    // The visitor home page is in landing.js
    setupLanding();
    return;
  }

  document.documentElement.classList.remove("guest");
  document.getElementById("guestSection").style.display = "none";
  document.getElementById("welcomeName").textContent = user.fullName.split(" ")[0];

  const myTeams = getTeamsOfMember(user.id);
  const received = getReceivedPendingRequests(user.id);
  const sent = getRequests().filter(function (request) {
    return request.studentId === user.id;
  });

  document.getElementById("myTeamsCount").textContent = myTeams.length;
  document.getElementById("pendingCount").textContent = received.length;
  document.getElementById("sentCount").textContent = sent.length;

  // Top 3 matches (the matching code is in search.js)
  const matches = getTeamMatches(user).slice(0, 3);
  const matchesBox = document.getElementById("homeMatches");
  if (matches.length === 0) {
    matchesBox.innerHTML =
      '<div class="col-12"><div class="ph-card">' +
      emptyStateHtml("bi-stars", "No matches yet", "Add more skills or preferred roles to your profile to get team suggestions.", "Edit my profile", "pages/profile.html?edit=yes") +
      "</div></div>";
  } else {
    matchesBox.innerHTML = matches
      .map(function (match) {
        return teamCardHtml(match.team, whyMatchHtml(match));
      })
      .join("");
  }

  const myTeamsBox = document.getElementById("myTeamsList");
  if (myTeams.length === 0) {
    myTeamsBox.innerHTML =
      '<div class="col-12"><div class="ph-card">' +
      emptyStateHtml("bi-people", "You are not in a team yet", "Search for a team to join, or create your own team.", "Search teams", "pages/search-teams.html") +
      "</div></div>";
  } else {
    myTeamsBox.innerHTML = myTeams
      .map(function (team) {
        return teamCardHtml(team);
      })
      .join("");
  }

  showSavedMessage();
}

buildNavbar();
