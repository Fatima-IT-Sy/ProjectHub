// User Profile page

function setupProfilePage() {
  // The admin can open students' profiles too
  const currentUser = requireLogin(true);
  if (!currentUser) {
    return;
  }

  // profile.html?id=... shows another student's profile (view only)
  const profileId = getUrlParam("id");

  if (profileId && profileId !== currentUser.id) {
    showOtherProfile(profileId);
    return;
  }

  // The admin has no student profile
  if (isAdmin(currentUser)) {
    window.location.href = "admin.html";
    return;
  }

  showProfile(currentUser, true);
  setupEditForm(currentUser);

  document.getElementById("deleteAccountButton").addEventListener("click", function () {
    showConfirmDialog({
      topHtml: '<i class="bi bi-exclamation-triangle danger-icon"></i>',
      title: "Delete your account?",
      text: "Your profile, the teams you created, and your requests will be removed. This cannot be undone.",
      buttonText: "Delete account",
      buttonClass: "btn-danger",
      onConfirm: function () {
        deleteAccount(currentUser.id);
      }
    });
  });

  // Links like profile.html?edit=yes open the edit form directly
  if (getUrlParam("edit") === "yes") {
    openEditForm();
  }

  showSavedMessage();
}

function showOtherProfile(profileId) {
  const student = findUserById(profileId);
  document.getElementById("ownerActions").classList.add("d-none");
  document.getElementById("dangerZone").classList.add("d-none");

  if (!student) {
    document.getElementById("pageContent").innerHTML =
      '<div class="container py-5"><div class="ph-card">' +
      emptyStateHtml("bi-person-x", "Student not found", "This account does not exist or was deleted.", "Back to home", "../index.html") +
      "</div></div>";
    return;
  }

  document.title = student.fullName + " | ProjectHub";
  showProfile(student, false);
}

// Fill the profile view. isMine changes the empty messages and links.
function showProfile(user, isMine) {
  const myTeams = getTeamsOfMember(user.id);
  const sentCount = getRequests().filter(function (request) {
    return request.studentId === user.id;
  }).length;

  document.getElementById("profileAvatar").textContent = getInitials(user.fullName);
  document.getElementById("profileName").textContent = user.fullName;
  document.getElementById("profileEmail").textContent = user.email;
  document.getElementById("teamsCount").textContent = myTeams.length;
  document.getElementById("requestsCount").textContent = sentCount;

  document.getElementById("profileSkills").innerHTML = listOrEmpty(user.skills, "No skills added yet.", isMine);
  document.getElementById("profileInterests").innerHTML = listOrEmpty(user.interests, "No interests added yet.", isMine);
  document.getElementById("profileRoles").innerHTML = listOrEmpty(user.roles, "No preferred roles added yet.", isMine);

  const teamsBox = document.getElementById("profileTeams");
  if (myTeams.length === 0) {
    let button = "";
    if (isMine) {
      button = '<a class="btn btn-sm btn-primary" href="search-teams.html">Find a team</a>';
    }
    teamsBox.innerHTML =
      '<div class="text-center py-3"><i class="bi bi-people fs-2" style="color: var(--ph-light);"></i>' +
      '<p class="meta my-2">' + (isMine ? "You are not in a team yet." : "Not in a team yet.") + "</p>" + button + "</div>";
    return;
  }

  let html = "";
  myTeams.forEach(function (team) {
    const role = team.creatorId === user.id ? "Creator" : "Member";
    html +=
      '<a class="member-row" href="view-team.html?id=' + team.id + '">' +
      '<span class="icon-box"><i class="bi bi-people"></i></span>' +
      '<span class="flex-grow-1"><span class="name d-block">' + escapeHtml(team.title) + "</span>" +
      '<span class="meta">' + escapeHtml(team.type) + "</span></span>" +
      '<span class="tag mb-0">' + role + "</span></a>";
  });
  teamsBox.innerHTML = html;
}

function listOrEmpty(list, emptyText, isMine) {
  if (list.length > 0) {
    return listToTags(list);
  }
  let link = "";
  if (isMine) {
    link = ' <a href="#" onclick="openEditForm(); return false;">Add now</a>';
  }
  return '<span class="meta">' + emptyText + link + "</span>";
}

// ---------- Edit profile ----------

function openEditForm() {
  document.getElementById("viewSection").classList.add("d-none");
  document.getElementById("editSection").classList.remove("d-none");
  document.getElementById("fullName").focus();
}

function closeEditForm() {
  document.getElementById("editSection").classList.add("d-none");
  document.getElementById("viewSection").classList.remove("d-none");
}

function fillEditForm(user) {
  document.getElementById("fullName").value = user.fullName;
  document.getElementById("emailField").value = user.email;
  document.getElementById("skills").value = user.skills.join(", ");
  document.getElementById("interests").value = user.interests.join(", ");
  document.getElementById("roles").value = user.roles.join(", ");
  document.getElementById("skills").dispatchEvent(new Event("input"));
  document.getElementById("interests").dispatchEvent(new Event("input"));
  document.getElementById("roles").dispatchEvent(new Event("input"));
}

function setupEditForm(user) {
  const form = document.getElementById("profileForm");

  setupMultiSelect("skills", SKILL_GROUPS, "Choose your skills");
  setupMultiSelect("interests", INTEREST_GROUPS, "Choose your interests");
  setupMultiSelect("roles", ROLE_GROUPS, "Choose your preferred roles");
  fillEditForm(user);

  document.getElementById("editButton").addEventListener("click", openEditForm);

  document.getElementById("cancelEditButton").addEventListener("click", function () {
    clearFormErrors(form);
    fillEditForm(findUserById(user.id));
    closeEditForm();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearFormErrors(form);

    const fullName = document.getElementById("fullName").value.trim();
    const skills = textToList(document.getElementById("skills").value);
    const interests = textToList(document.getElementById("interests").value);
    const roles = textToList(document.getElementById("roles").value);

    let isValid = true;
    if (fullName === "") {
      setFieldError("fullName", "Please enter your full name.");
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

    const users = getUsers();
    users.forEach(function (savedUser) {
      if (savedUser.id === user.id) {
        savedUser.fullName = fullName;
        savedUser.skills = skills;
        savedUser.interests = interests;
        savedUser.roles = roles;
      }
    });
    saveUsers(users);

    // Update the page and the navbar with the new name
    showProfile(findUserById(user.id), true);
    buildNavbar();
    closeEditForm();
    showToast("Your profile has been saved.", "success");
  });
}

// ---------- Delete account ----------

// The delete code is in data.js (the admin uses it too)
function deleteAccount(userId) {
  removeStudent(userId);
  localStorage.removeItem("currentUserId");
  window.location.href = "../index.html";
}
