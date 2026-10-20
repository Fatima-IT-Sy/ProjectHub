// Request to Join button and the Requests page (received and sent)

function findRequest(teamId, studentId) {
  return getRequests().find(function (request) {
    return request.teamId === teamId && request.studentId === studentId;
  });
}

function statusHtml(status) {
  const names = { pending: "Pending", accepted: "Accepted", rejected: "Rejected" };
  const icons = { pending: "bi-hourglass-split", accepted: "bi-check-circle", rejected: "bi-x-circle" };
  return '<span class="status-badge status-' + status + '"><i class="bi ' + icons[status] + ' me-1"></i>' + names[status] + "</span>";
}

// ---------- Request to Join button (on the View Team page) ----------

function showJoinButton(team, user) {
  const actions = document.getElementById("teamActions");
  const oldRequest = findRequest(team.id, user.id);

  // Only one request for the same team
  if (oldRequest) {
    actions.innerHTML =
      '<div class="small-label">Your join request</div>' +
      "<div>" + statusHtml(oldRequest.status) + "</div>" +
      '<p class="meta mt-2 mb-0">Sent on ' + formatDate(oldRequest.date) + "</p>";
    return;
  }

  actions.innerHTML =
    '<p class="meta mb-3">Want to work with this team? Send a request and the team creator will review it.</p>' +
    '<div class="d-grid"><button class="btn btn-primary" id="joinButton"><i class="bi bi-send me-1"></i>Request to Join</button></div>';

  document.getElementById("joinButton").addEventListener("click", function () {
    const requests = getRequests();
    requests.push({
      id: makeId(),
      teamId: team.id,
      studentId: user.id,
      status: "pending",
      date: todayText()
    });
    saveRequests(requests);

    showToast("Your request has been sent to the team creator.", "success");
    showJoinButton(team, user);
  });
}

// ---------- Requests page ----------

function setupRequestsPage() {
  const user = requireLogin();
  if (!user) {
    return;
  }

  showReceivedRequests(user);
  showSentRequests(user);

  // requests.html?tab=sent opens the Sent tab
  if (getUrlParam("tab") === "sent") {
    bootstrap.Tab.getOrCreateInstance(document.getElementById("sentTab")).show();
  }
}

function showReceivedRequests(user) {
  const box = document.getElementById("receivedList");
  const myTeams = getTeamsCreatedBy(user.id);
  const pending = getReceivedPendingRequests(user.id);

  document.getElementById("receivedCount").textContent = pending.length;

  if (myTeams.length === 0) {
    box.innerHTML =
      '<div class="ph-card">' +
      emptyStateHtml("bi-people", "You have not created a team yet", "When you create a team, the requests from students who want to join it will appear here.", "Create a team", "create-team.html") +
      "</div>";
    return;
  }

  if (pending.length === 0) {
    box.innerHTML =
      '<div class="ph-card">' +
      emptyStateHtml("bi-inbox", "No new requests", "Nobody has asked to join your teams yet. We will show new requests here.") +
      "</div>";
    return;
  }

  let html = "";
  pending.forEach(function (request) {
    const team = findTeamById(request.teamId);
    const student = findUserById(request.studentId);
    if (!team || !student) {
      return;
    }
    html +=
      '<div class="ph-card mb-3"><div class="request-item">' +
      '<span class="avatar">' + escapeHtml(getInitials(student.fullName)) + "</span>" +
      '<div class="details">' +
      '<a class="fw-semibold" href="profile.html?id=' + student.id + '">' + escapeHtml(student.fullName) + "</a>" +
      '<div class="meta mb-2">Wants to join <a href="view-team.html?id=' + team.id + '">' + escapeHtml(team.title) + "</a> &nbsp;|&nbsp; " + formatDate(request.date) + "</div>" +
      "<div>" + listToTags(student.skills, team.skills) + "</div>" +
      "</div>" +
      '<div class="d-flex gap-2">' +
      '<button class="btn btn-primary" onclick="answerRequest(\'' + request.id + '\', \'accepted\')"><i class="bi bi-check-lg me-1"></i>Accept</button>' +
      '<button class="btn btn-soft" onclick="answerRequest(\'' + request.id + '\', \'rejected\')"><i class="bi bi-x-lg me-1"></i>Reject</button>' +
      "</div></div></div>";
  });
  box.innerHTML = html;
}

function showSentRequests(user) {
  const box = document.getElementById("sentList");
  const sent = getRequests().filter(function (request) {
    return request.studentId === user.id;
  });

  document.getElementById("sentCount").textContent = sent.length;

  if (sent.length === 0) {
    box.innerHTML =
      '<div class="ph-card">' +
      emptyStateHtml("bi-send", "You have not sent any requests yet", "Find a team that needs your skills and ask to join it.", "Search teams", "search-teams.html") +
      "</div>";
    return;
  }

  let html = "";
  // Newest first
  sent.slice().reverse().forEach(function (request) {
    const team = findTeamById(request.teamId);
    if (!team) {
      return;
    }
    html +=
      '<div class="ph-card mb-3"><div class="request-item">' +
      '<span class="icon-box"><i class="bi bi-people"></i></span>' +
      '<div class="details">' +
      '<a class="fw-semibold" href="view-team.html?id=' + team.id + '">' + escapeHtml(team.title) + "</a>" +
      '<div class="meta">' + escapeHtml(team.type) + " &nbsp;|&nbsp; Sent on " + formatDate(request.date) + "</div>" +
      "</div>" +
      statusHtml(request.status) +
      "</div></div>";
  });
  box.innerHTML = html;
}

function answerRequest(requestId, answer) {
  const user = getCurrentUser();
  const requests = getRequests();
  const request = requests.find(function (item) {
    return item.id === requestId;
  });

  // Only the team creator can answer the request
  const team = findTeamById(request.teamId);
  if (!team || team.creatorId !== user.id) {
    showToast("You can only manage requests for your own teams.", "error");
    return;
  }

  request.status = answer;
  saveRequests(requests);

  const student = findUserById(request.studentId);

  // Add the student to the team when the request is accepted
  if (answer === "accepted") {
    const teams = getTeams();
    teams.forEach(function (savedTeam) {
      if (savedTeam.id === team.id && !savedTeam.members.includes(request.studentId)) {
        savedTeam.members.push(request.studentId);
      }
    });
    saveTeams(teams);
    showToast(student.fullName + " has been added to " + team.title + ".", "success");
  } else {
    showToast("You rejected the request from " + student.fullName + ".", "success");
  }

  showReceivedRequests(user);
  buildNavbar();
}
