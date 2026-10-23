// Create, View, Edit, and Delete Team pages

// Read the team form (used by Create and Edit pages)
function readTeamForm() {
  return {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    type: document.getElementById("type").value,
    skills: textToList(document.getElementById("skills").value),
    positions: textToList(document.getElementById("positions").value)
  };
}

function checkTeamForm(form, teamData) {
  clearFormErrors(form);
  let isValid = true;

  if (teamData.title === "") {
    setFieldError("title", "Please enter a title.");
    isValid = false;
  }
  if (teamData.description === "") {
    setFieldError("description", "Please describe the team.");
    isValid = false;
  }
  if (teamData.type === "") {
    setFieldError("type", "Please choose a type.");
    isValid = false;
  }
  if (teamData.skills.length === 0) {
    setFieldError("skills", "Please choose at least one required skill.");
    isValid = false;
  }
  if (teamData.positions.length === 0) {
    setFieldError("positions", "Please choose at least one open position.");
    isValid = false;
  }

  if (!isValid) {
    form.querySelector(".is-invalid").focus();
  }
  return isValid;
}

function showTeamNotFound(text) {
  document.getElementById("pageContent").innerHTML =
    '<div class="container py-5"><div class="ph-card">' +
    emptyStateHtml("bi-exclamation-circle", "Can't open this team", text, "Back to home", "../index.html") +
    "</div></div>";
}

// Get the team from the URL and make sure the current user created it
function getMyTeamFromUrl(user) {
  const team = findTeamById(getUrlParam("id"));

  if (!team) {
    showTeamNotFound("This team does not exist or was deleted.");
    return null;
  }
  if (team.creatorId !== user.id) {
    showTeamNotFound("Only the team creator can change this team.");
    return null;
  }
  return team;
}

// ---------- Create Team page ----------

function setupCreateTeamPage() {
  const user = requireLogin();
  if (!user) {
    return;
  }

  setupMultiSelect("skills", SKILL_GROUPS, "Choose the required skills");
  setupMultiSelect("positions", ROLE_GROUPS, "Choose the open positions");

  const form = document.getElementById("teamForm");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const teamData = readTeamForm();

    if (!checkTeamForm(form, teamData)) {
      return;
    }

    const newTeam = {
      id: makeId(),
      title: teamData.title,
      description: teamData.description,
      type: teamData.type,
      skills: teamData.skills,
      positions: teamData.positions,
      creatorId: user.id,
      members: [user.id]
    };

    const teams = getTeams();
    teams.push(newTeam);
    saveTeams(teams);

    setNextPageMessage("Your team has been created and is now visible to other students.");
    window.location.href = "view-team.html?id=" + newTeam.id;
  });
}

// ---------- View Team page ----------

function setupViewTeamPage() {
  // The admin can open teams too
  const user = requireLogin(true);
  if (!user) {
    return;
  }

  const team = findTeamById(getUrlParam("id"));
  if (!team) {
    showTeamNotFound("This team does not exist or was deleted.");
    return;
  }

  document.title = team.title + " | ProjectHub";
  const creator = findUserById(team.creatorId);

  document.getElementById("teamType").innerHTML = typeBadgeHtml(team.type);
  document.getElementById("teamTitle").textContent = team.title;
  document.getElementById("teamCreator").textContent = creator ? creator.fullName : "Unknown";
  document.getElementById("teamDescription").textContent = team.description;
  document.getElementById("teamSkills").innerHTML = listToTags(team.skills, user.skills);
  document.getElementById("teamPositions").innerHTML = listToTags(team.positions, user.roles);
  document.getElementById("membersCount").textContent = team.members.length;

  let membersHtml = "";
  team.members.forEach(function (memberId) {
    const member = findUserById(memberId);
    if (!member) {
      return;
    }
    const role = member.id === team.creatorId ? "Team creator" : "Member";
    membersHtml +=
      '<a class="member-row" href="profile.html?id=' + member.id + '">' +
      '<span class="avatar avatar-sm">' + escapeHtml(getInitials(member.fullName)) + "</span>" +
      '<span><span class="name d-block">' + escapeHtml(member.fullName) + "</span>" +
      '<span class="meta">' + role + "</span></span></a>";
  });
  document.getElementById("teamMembers").innerHTML = membersHtml;

  const actions = document.getElementById("teamActions");

  if (isAdmin(user)) {
    actions.innerHTML =
      '<p class="meta mb-3"><i class="bi bi-shield-check me-1"></i>You are viewing this team as the admin.</p>' +
      '<div class="d-grid"><a class="btn btn-soft" href="admin.html?tab=teams"><i class="bi bi-arrow-left me-1"></i>Back to dashboard</a></div>';
  } else if (team.creatorId === user.id) {
    actions.innerHTML =
      '<p class="meta mb-3"><i class="bi bi-star me-1"></i>You created this team.</p>' +
      '<div class="d-grid gap-2">' +
      '<a class="btn btn-primary" href="edit-team.html?id=' + team.id + '"><i class="bi bi-pencil me-1"></i>Edit team</a>' +
      '<button class="btn btn-soft" type="button" disabled><i class="bi bi-envelope me-1"></i>View join requests</button>' +
      '<a class="btn btn-outline-danger" href="delete-team.html?id=' + team.id + '"><i class="bi bi-trash me-1"></i>Delete team</a>' +
      "</div>";
  } else if (team.members.includes(user.id)) {
    actions.innerHTML = '<p class="mb-0"><i class="bi bi-check-circle-fill text-success me-1"></i>You are a member of this team.</p>';
  } else {
    actions.innerHTML =
      '<p class="meta mb-3">Want to work with this team? Send a request and the team creator will review it.</p>' +
      '<div class="d-grid"><button class="btn btn-primary" type="button" disabled><i class="bi bi-send me-1"></i>Request to Join</button></div>';
  }

  showSavedMessage();
}

// ---------- Edit Team page ----------

function setupEditTeamPage() {
  const user = requireLogin();
  if (!user) {
    return;
  }

  const team = getMyTeamFromUrl(user);
  if (!team) {
    return;
  }

  document.getElementById("title").value = team.title;
  document.getElementById("description").value = team.description;
  document.getElementById("type").value = team.type;
  document.getElementById("skills").value = team.skills.join(", ");
  document.getElementById("positions").value = team.positions.join(", ");
  document.getElementById("cancelLink").href = "view-team.html?id=" + team.id;

  setupMultiSelect("skills", SKILL_GROUPS, "Choose the required skills");
  setupMultiSelect("positions", ROLE_GROUPS, "Choose the open positions");

  const form = document.getElementById("teamForm");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const teamData = readTeamForm();

    if (!checkTeamForm(form, teamData)) {
      return;
    }

    const teams = getTeams();
    teams.forEach(function (savedTeam) {
      if (savedTeam.id === team.id) {
        savedTeam.title = teamData.title;
        savedTeam.description = teamData.description;
        savedTeam.type = teamData.type;
        savedTeam.skills = teamData.skills;
        savedTeam.positions = teamData.positions;
      }
    });
    saveTeams(teams);

    setNextPageMessage("Your changes have been saved.");
    window.location.href = "view-team.html?id=" + team.id;
  });
}

// ---------- Delete Team page ----------

function setupDeleteTeamPage() {
  const user = requireLogin();
  if (!user) {
    return;
  }

  const team = getMyTeamFromUrl(user);
  if (!team) {
    return;
  }

  const pendingCount = getRequests().filter(function (request) {
    return request.teamId === team.id && request.status === "pending";
  }).length;

  document.getElementById("teamName").textContent = team.title;
  document.getElementById("teamInfo").textContent =
    team.members.length + " member(s) and " + pendingCount + " pending request(s)";
  document.getElementById("cancelLink").href = "view-team.html?id=" + team.id;

  document.getElementById("confirmDeleteButton").addEventListener("click", function () {
    // The delete code is in data.js (the admin uses it too)
    removeTeam(team.id);

    setNextPageMessage('"' + team.title + '" has been deleted.');
    window.location.href = "../index.html";
  });
}
