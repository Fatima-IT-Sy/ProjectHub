// Admin dashboard: view and delete students and teams

function setupAdminPage() {
  const admin = requireAdmin();
  if (!admin) {
    return;
  }

  showAdminData();

  // admin.html?tab=teams opens the Teams tab
  if (getUrlParam("tab") === "teams") {
    bootstrap.Tab.getOrCreateInstance(document.getElementById("teamsTab")).show();
  }

  showSavedMessage();
}

function showAdminData() {
  const pending = getRequests().filter(function (request) {
    return request.status === "pending";
  });

  document.getElementById("studentsCount").textContent = getUsers().length;
  document.getElementById("teamsCount").textContent = getTeams().length;
  document.getElementById("requestsCount").textContent = pending.length;

  showStudentsTable();
  showTeamsTable();
}

// ---------- Students ----------

function showStudentsTable() {
  const box = document.getElementById("studentsList");
  const students = getUsers();

  if (students.length === 0) {
    box.innerHTML = '<div class="ph-card">' + emptyStateHtml("bi-person-x", "No students yet", "Registered students will appear here.") + "</div>";
    return;
  }

  let rows = "";
  students.forEach(function (student) {
    rows +=
      "<tr>" +
      '<td><div class="d-flex align-items-center gap-2">' +
      '<span class="avatar avatar-sm">' + escapeHtml(getInitials(student.fullName)) + "</span>" +
      '<a href="profile.html?id=' + student.id + '">' + escapeHtml(student.fullName) + "</a></div></td>" +
      "<td>" + escapeHtml(student.email) + "</td>" +
      "<td>" + getTeamsOfMember(student.id).length + "</td>" +
      '<td class="text-end"><button class="btn btn-sm btn-outline-danger" onclick="confirmDeleteStudent(\'' + student.id + '\')">' +
      '<i class="bi bi-trash me-1"></i>Delete</button></td>' +
      "</tr>";
  });

  box.innerHTML =
    '<div class="ph-card p-0"><div class="table-responsive"><table class="table ph-table mb-0">' +
    "<thead><tr><th>Name</th><th>Email</th><th>Teams</th><th></th></tr></thead>" +
    "<tbody>" + rows + "</tbody></table></div></div>";
}

function confirmDeleteStudent(studentId) {
  const student = findUserById(studentId);
  if (!student) {
    return;
  }

  showConfirmDialog({
    topHtml: '<i class="bi bi-exclamation-triangle danger-icon"></i>',
    title: "Delete this account?",
    text: escapeHtml(student.fullName) + "'s account, the teams they created, and their join requests will be removed. This cannot be undone.",
    buttonText: "Delete account",
    buttonClass: "btn-danger",
    onConfirm: function () {
      // The delete code is in data.js
      removeStudent(studentId);
      showAdminData();
      showToast(student.fullName + "'s account has been deleted.", "success");
    }
  });
}

// ---------- Teams ----------

function showTeamsTable() {
  const box = document.getElementById("teamsList");
  const teams = getTeams();

  if (teams.length === 0) {
    box.innerHTML = '<div class="ph-card">' + emptyStateHtml("bi-people", "No teams yet", "Teams created by students will appear here.") + "</div>";
    return;
  }

  let rows = "";
  teams.forEach(function (team) {
    const creator = findUserById(team.creatorId);
    rows +=
      "<tr>" +
      '<td><a href="view-team.html?id=' + team.id + '">' + escapeHtml(team.title) + "</a></td>" +
      "<td>" + typeBadgeHtml(team.type) + "</td>" +
      "<td>" + (creator ? escapeHtml(creator.fullName) : "Unknown") + "</td>" +
      "<td>" + team.members.length + "</td>" +
      '<td class="text-end"><button class="btn btn-sm btn-outline-danger" onclick="confirmDeleteTeam(\'' + team.id + '\')">' +
      '<i class="bi bi-trash me-1"></i>Delete</button></td>' +
      "</tr>";
  });

  box.innerHTML =
    '<div class="ph-card p-0"><div class="table-responsive"><table class="table ph-table mb-0">' +
    "<thead><tr><th>Team</th><th>Type</th><th>Creator</th><th>Members</th><th></th></tr></thead>" +
    "<tbody>" + rows + "</tbody></table></div></div>";
}

function confirmDeleteTeam(teamId) {
  const team = findTeamById(teamId);
  if (!team) {
    return;
  }

  showConfirmDialog({
    topHtml: '<i class="bi bi-exclamation-triangle danger-icon"></i>',
    title: "Delete this team?",
    text: '"' + escapeHtml(team.title) + '" and all of its join requests will be removed. This cannot be undone.',
    buttonText: "Delete team",
    buttonClass: "btn-danger",
    onConfirm: function () {
      // The delete code is in data.js
      removeTeam(teamId);
      showAdminData();
      showToast('"' + team.title + '" has been deleted.', "success");
    }
  });
}
