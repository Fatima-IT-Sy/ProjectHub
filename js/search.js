// Search Teams and Search Students pages, including Team Matching

// ---------- Team Matching ----------

// Returns the words from listA that are also in listB (not case sensitive)
function commonItems(listA, listB) {
  const lowerB = listB.map(function (item) {
    return item.toLowerCase();
  });
  return listA.filter(function (item) {
    return lowerB.includes(item.toLowerCase());
  });
}

// Teams that need the skills and roles of this student, best match first.
// Each matched skill or role gives the team one point.
function getTeamMatches(user) {
  const matches = [];

  getTeams().forEach(function (team) {
    if (team.members.includes(user.id)) {
      return;
    }
    const matchedSkills = commonItems(team.skills, user.skills);
    const matchedRoles = commonItems(team.positions, user.roles);
    const score = matchedSkills.length + matchedRoles.length;

    if (score > 0) {
      matches.push({ team: team, score: score, skills: matchedSkills, roles: matchedRoles });
    }
  });

  matches.sort(function (a, b) {
    return b.score - a.score;
  });
  return matches;
}

// Students whose skills and roles match what this team needs
function getStudentMatches(team) {
  const matches = [];

  getUsers().forEach(function (student) {
    if (team.members.includes(student.id)) {
      return;
    }
    const matchedSkills = commonItems(student.skills, team.skills);
    const matchedRoles = commonItems(student.roles, team.positions);
    const score = matchedSkills.length + matchedRoles.length;

    if (score > 0) {
      matches.push({ student: student, score: score, skills: matchedSkills, roles: matchedRoles });
    }
  });

  matches.sort(function (a, b) {
    return b.score - a.score;
  });
  return matches;
}

function whyMatchHtml(match) {
  return (
    '<div class="why-match">' +
    '<div class="d-flex justify-content-between align-items-center mb-2">' +
    '<span class="small-label mb-0">Why it matches you</span>' +
    '<span class="match-badge"><i class="bi bi-stars"></i>' + match.score + " match" + (match.score > 1 ? "es" : "") + "</span>" +
    "</div>" +
    listToTags(match.skills.concat(match.roles), match.skills.concat(match.roles)) +
    "</div>"
  );
}

// ---------- Search Teams page ----------

function setupSearchTeamsPage() {
  const user = requireLogin();
  if (!user) {
    return;
  }

  const matchButton = document.getElementById("matchButton");
  const skillSelect = document.getElementById("searchSkill");

  // Fill the skills list, grouped like in the forms
  SKILL_GROUPS.forEach(function (group) {
    const optionGroup = document.createElement("optgroup");
    optionGroup.label = group.title;
    group.items.forEach(function (item) {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      optionGroup.appendChild(option);
    });
    skillSelect.appendChild(optionGroup);
  });

  document.getElementById("searchForm").addEventListener("submit", function (event) {
    event.preventDefault();
    matchButton.classList.remove("active");

    const searchText = document.getElementById("searchText").value.trim().toLowerCase();
    const searchSkill = skillSelect.value;
    const searchType = document.getElementById("searchType").value;

    const results = getTeams().filter(function (team) {
      const matchesText = searchText === "" || team.title.toLowerCase().includes(searchText);
      const matchesSkill = searchSkill === "" || team.skills.includes(searchSkill);
      const matchesType = searchType === "" || team.type === searchType;
      return matchesText && matchesSkill && matchesType;
    });

    let title = "All teams";
    if (searchText !== "" || searchSkill !== "" || searchType !== "") {
      title = "Search results";
    }
    showTeamResults(results, title);
  });

  matchButton.addEventListener("click", function () {
    showBestMatches(user);
  });

  // The home page links here with ?match=yes
  if (getUrlParam("match") === "yes") {
    showBestMatches(user);
  } else {
    showTeamResults(getTeams(), "All teams");
  }
}

function showTeamResults(teams, title) {
  document.getElementById("resultsTitle").textContent = title;
  document.getElementById("resultsCount").textContent = teams.length + " team(s)";

  const box = document.getElementById("results");
  if (teams.length === 0) {
    box.innerHTML =
      '<div class="col-12"><div class="ph-card">' +
      emptyStateHtml("bi-search", "No results found", "Try a different team name, skill, or type.") +
      "</div></div>";
    return;
  }
  box.innerHTML = teams
    .map(function (team) {
      return teamCardHtml(team);
    })
    .join("");
}

function showBestMatches(user) {
  document.getElementById("matchButton").classList.add("active");
  document.getElementById("searchText").value = "";
  document.getElementById("searchSkill").value = "";
  document.getElementById("searchType").value = "";

  const matches = getTeamMatches(user);
  document.getElementById("resultsTitle").textContent = "Best matches for you";
  document.getElementById("resultsCount").textContent = matches.length + " team(s)";

  const box = document.getElementById("results");
  if (matches.length === 0) {
    box.innerHTML =
      '<div class="col-12"><div class="ph-card">' +
      emptyStateHtml("bi-stars", "No matches right now", "No team needs your skills at the moment. Add more skills or roles to your profile to see more teams.", "Edit my profile", "profile.html?edit=yes") +
      "</div></div>";
    return;
  }
  box.innerHTML = matches
    .map(function (match) {
      return teamCardHtml(match.team, whyMatchHtml(match));
    })
    .join("");
}

// ---------- Search Students page ----------

function setupSearchStudentsPage() {
  const user = requireLogin();
  if (!user) {
    return;
  }

  const myTeams = getTeamsCreatedBy(user.id);
  const teamSelect = document.getElementById("teamSelect");

  setupMultiSelect("searchText", skillAndInterestGroups(), "Choose skills or interests");

  // Fill the team list for "Best matches for my team"
  myTeams.forEach(function (team) {
    const option = document.createElement("option");
    option.value = team.id;
    option.textContent = team.title;
    teamSelect.appendChild(option);
  });
  if (myTeams.length <= 1) {
    teamSelect.classList.add("d-none");
  }

  document.getElementById("searchForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const form = event.target;
    clearFormErrors(form);
    document.getElementById("matchButton").classList.remove("active");

    const words = textToList(document.getElementById("searchText").value).map(function (word) {
      return word.toLowerCase();
    });

    if (words.length === 0) {
      setFieldError("searchText", "Please choose at least one skill or interest.");
      return;
    }

    const results = getUsers().filter(function (student) {
      if (student.id === user.id) {
        return false;
      }
      const studentText = student.skills.concat(student.interests).join(" ").toLowerCase();
      return words.some(function (word) {
        return studentText.includes(word);
      });
    });

    showStudentResults(results, "Search results");
  });

  document.getElementById("matchButton").addEventListener("click", function () {
    showStudentMatches(user, myTeams);
  });

  teamSelect.addEventListener("change", function () {
    showStudentMatches(user, myTeams);
  });

  // Show all students at first
  const others = getUsers().filter(function (student) {
    return student.id !== user.id;
  });
  showStudentResults(others, "All students");
}

function studentCardHtml(student, extraHtml) {
  return (
    '<div class="col-md-6 col-lg-4">' +
    '<div class="ph-card ph-card-hover team-card">' +
    '<div class="d-flex align-items-center gap-3 mb-3">' +
    '<span class="avatar">' + escapeHtml(getInitials(student.fullName)) + "</span>" +
    "<div><h3 class=\"m-0\">" + escapeHtml(student.fullName) + "</h3>" +
    '<div class="meta">' + escapeHtml(student.roles.join(", ")) + "</div></div></div>" +
    (extraHtml || "") +
    '<div class="small-label">Skills</div>' +
    "<div>" + listToTags(student.skills) + "</div>" +
    '<div class="card-bottom">' +
    '<span class="meta"><i class="bi bi-heart me-1"></i>' + (student.interests.length > 0 ? escapeHtml(student.interests[0]) : "No interests yet") + "</span>" +
    '<a class="btn btn-sm btn-soft" href="profile.html?id=' + student.id + '">View profile</a>' +
    "</div></div></div>"
  );
}

function showStudentResults(students, title) {
  document.getElementById("resultsTitle").textContent = title;
  document.getElementById("resultsCount").textContent = students.length + " student(s)";

  const box = document.getElementById("results");
  if (students.length === 0) {
    box.innerHTML =
      '<div class="col-12"><div class="ph-card">' +
      emptyStateHtml("bi-person-x", "No results found", "No students have these skills or interests. Try choosing others.") +
      "</div></div>";
    return;
  }
  box.innerHTML = students
    .map(function (student) {
      return studentCardHtml(student);
    })
    .join("");
}

function showStudentMatches(user, myTeams) {
  document.getElementById("matchButton").classList.add("active");
  const box = document.getElementById("results");

  if (myTeams.length === 0) {
    document.getElementById("resultsTitle").textContent = "Best matches for your team";
    document.getElementById("resultsCount").textContent = "";
    box.innerHTML =
      '<div class="col-12"><div class="ph-card">' +
      emptyStateHtml("bi-people", "You have not created a team yet", "Create a team first, and we will suggest students whose skills fit it.", "Create a team", "create-team.html") +
      "</div></div>";
    return;
  }

  const teamSelect = document.getElementById("teamSelect");
  const team = findTeamById(teamSelect.value) || myTeams[0];
  const matches = getStudentMatches(team);

  document.getElementById("resultsTitle").textContent = "Best matches for " + team.title;
  document.getElementById("resultsCount").textContent = matches.length + " student(s)";

  if (matches.length === 0) {
    box.innerHTML =
      '<div class="col-12"><div class="ph-card">' +
      emptyStateHtml("bi-stars", "No matches yet", "No students have the skills this team needs right now. Check again later.") +
      "</div></div>";
    return;
  }

  box.innerHTML = matches
    .map(function (match) {
      const extra =
        '<div class="why-match"><div class="d-flex justify-content-between align-items-center mb-2">' +
        '<span class="small-label mb-0">Fits your team</span>' +
        '<span class="match-badge"><i class="bi bi-stars"></i>' + match.score + " match" + (match.score > 1 ? "es" : "") + "</span></div>" +
        listToTags(match.skills.concat(match.roles), match.skills.concat(match.roles)) +
        "</div>";
      return studentCardHtml(match.student, extra);
    })
    .join("");
}
