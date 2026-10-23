// Search Teams and Search Students pages

// ---------- Search Teams page ----------

function setupSearchTeamsPage() {
  const user = requireLogin();
  if (!user) {
    return;
  }

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

  showTeamResults(getTeams(), "All teams");
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

// ---------- Search Students page ----------

function setupSearchStudentsPage() {
  const user = requireLogin();
  if (!user) {
    return;
  }


  setupMultiSelect("searchText", skillAndInterestGroups(), "Choose skills or interests");

  document.getElementById("searchForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const form = event.target;
    clearFormErrors(form);

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
