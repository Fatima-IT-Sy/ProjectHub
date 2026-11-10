// Data from the MySQL database (through php/api.php)

const apiPath = (window.location.pathname.includes("/pages/") ? "../" : "") + "php/api.php";

let siteData = { currentUser: null, users: [], teams: [], requests: [] };

// ---------- Talking to the server ----------

function loadData() {
  return fetch(apiPath + "?action=load", { cache: "no-store", credentials: "same-origin" })
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      if (!result.ok) {
        throw new Error(result.message);
      }
      siteData = result;
    })
    .catch(function () {
      showServerDown();
    });
}

function sendToServer(action, data) {
  return fetch(apiPath + "?action=" + action, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(data || {})
  })
    .catch(function () {
      throw { message: "Could not reach the server. Please try again." };
    })
    .then(function (response) {
      return response.json().catch(function () {
        throw { message: "Something went wrong. Please try again." };
      });
    })
    .then(function (result) {
      if (!result.ok) {
        throw result;
      }
      return result;
    });
}

function showServerError(error) {
  if (error.field && document.getElementById(error.field)) {
    setFieldError(error.field, error.message);
    document.getElementById(error.field).focus();
  } else {
    showToast(error.message || "Something went wrong. Please try again.", "error");
  }
}

function showServerDown() {
  document.documentElement.classList.add("show-all");
  const box = document.createElement("div");
  box.className = "alert alert-danger m-3";
  box.setAttribute("role", "alert");
  box.textContent = "Can't connect to the database. Open the website through MAMP (http://localhost/ProjectHub/).";
  document.body.prepend(box);
}

// ---------- Reading the data ----------

function getUsers() {
  return siteData.users;
}

function getTeams() {
  return siteData.teams;
}

function getRequests() {
  return siteData.requests;
}

function findUserById(id) {
  return getUsers().find(function (user) {
    return user.id === id;
  });
}

function findTeamById(id) {
  return getTeams().find(function (team) {
    return team.id === id;
  });
}

function getCurrentUser() {
  return siteData.currentUser;
}

function isAdmin(user) {
  return user !== null && user.role === "admin";
}

// ---------- Lists for the drop-down menus ----------

const SKILL_GROUPS = [
  {
    title: "Development",
    items: ["Front-end", "Back-end", "Full-stack", "Mobile Development", "HTML", "CSS", "JavaScript", "PHP", "Python", "Java", "C++", "C#", "Databases", "SQL", "Git & GitHub"]
  },
  { title: "Design", items: ["UI/UX Design", "Figma", "Graphic Design", "Prototyping"] },
  { title: "Data & AI", items: ["Data Analysis", "Data Visualization", "Machine Learning", "AI"] },
  { title: "Networks & Security", items: ["Cybersecurity", "Networking", "Cloud Computing", "Linux"] },
  {
    title: "Other skills",
    items: ["Software Testing", "Game Development", "IoT", "Project Management", "Requirements Analysis", "UML Modeling", "Technical Writing", "Research", "Presentation Skills", "Teamwork"]
  }
];

const ROLE_GROUPS = [
  { title: "Development", items: ["Front-end Developer", "Back-end Developer", "Full-stack Developer", "Mobile Developer"] },
  { title: "Design", items: ["UI/UX Designer", "Graphic Designer"] },
  { title: "Data & AI", items: ["Data Analyst", "AI Engineer"] },
  { title: "Networks & Security", items: ["Cybersecurity Specialist", "Network Engineer"] },
  { title: "Team support", items: ["Software Tester", "Project Manager", "Business Analyst", "Technical Writer", "Presenter"] }
];

const INTEREST_GROUPS = [
  { title: "Team types", items: ["Hackathons", "Competitions", "Practical Projects"] },
  {
    title: "Topics",
    items: ["Web Development", "Mobile Apps", "AI", "Data Science", "Cybersecurity", "Game Development", "Design", "Cloud Computing", "IoT", "Robotics", "Startups", "Open Source", "Research"]
  }
];

const dataReady = loadData();
