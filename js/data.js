// Temporary storage in the browser (localStorage).
// In Sprint 2 this file will be replaced by the database connection.

function getList(key) {
  const saved = localStorage.getItem(key);
  if (saved) {
    return JSON.parse(saved);
  }
  return [];
}

function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function getUsers() {
  return getList("users");
}

function saveUsers(users) {
  saveList("users", users);
}

function getTeams() {
  return getList("teams");
}

function saveTeams(teams) {
  saveList("teams", teams);
}

function getRequests() {
  return getList("requests");
}

function saveRequests(requests) {
  saveList("requests", requests);
}

function makeId() {
  return Date.now().toString() + Math.floor(Math.random() * 1000);
}

function findUserById(id) {
  return getUsers().find(function (user) {
    return user.id === id;
  });
}

function findUserByEmail(email) {
  return getUsers().find(function (user) {
    return user.email === email.toLowerCase();
  });
}

function findTeamById(id) {
  return getTeams().find(function (team) {
    return team.id === id;
  });
}

// The admin account is ready from the start (it is not created from the Register page)
const ADMIN_ACCOUNT = {
  id: "admin",
  fullName: "ProjectHub Admin",
  email: "admin@projecthub.com",
  password: "Admin123",
  role: "admin",
  skills: [],
  interests: [],
  roles: []
};

function getCurrentUser() {
  const userId = localStorage.getItem("currentUserId");
  if (!userId) {
    return null;
  }
  if (userId === ADMIN_ACCOUNT.id) {
    return ADMIN_ACCOUNT;
  }
  return findUserById(userId) || null;
}

function isAdmin(user) {
  return user !== null && user.role === "admin";
}

// ---------- Delete helpers (used by students and by the admin) ----------

// Remove a team and all of its join requests
function removeTeam(teamId) {
  const remainingTeams = getTeams().filter(function (team) {
    return team.id !== teamId;
  });
  saveTeams(remainingTeams);

  const remainingRequests = getRequests().filter(function (request) {
    return request.teamId !== teamId;
  });
  saveRequests(remainingRequests);
}

// Remove a student, the teams they created, and their join requests
function removeStudent(userId) {
  getTeams().forEach(function (team) {
    if (team.creatorId === userId) {
      removeTeam(team.id);
    }
  });

  // Take the student out of the teams they joined
  const teams = getTeams();
  teams.forEach(function (team) {
    team.members = team.members.filter(function (memberId) {
      return memberId !== userId;
    });
  });
  saveTeams(teams);

  const remainingRequests = getRequests().filter(function (request) {
    return request.studentId !== userId;
  });
  saveRequests(remainingRequests);

  const remainingUsers = getUsers().filter(function (user) {
    return user.id !== userId;
  });
  saveUsers(remainingUsers);
}

// ---------- Lists for the drop-down menus ----------
// Students choose from these lists, so the same skill is always written the same way
// and Team Matching can compare them correctly.

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

// Used for the student's preferred roles and the team's open positions
// (they must be the same list so they can be matched)
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

// Sample data so the pages are not empty when we demo the website.
// It is added only once, the first time the website is opened.
// (Change the version number to load fresh sample data.)
function addSampleData() {
  if (localStorage.getItem("sampleDataVersion") === "4") {
    return;
  }

  const users = [
    {
      id: "u1",
      fullName: "Sara Alqahtani",
      email: "sara@example.com",
      password: "Sample123",
      skills: ["Front-end", "JavaScript", "HTML", "CSS"],
      interests: ["Hackathons", "Web Development"],
      roles: ["Front-end Developer"]
    },
    {
      id: "u2",
      fullName: "Lama Alharbi",
      email: "lama@example.com",
      password: "Sample123",
      skills: ["UI/UX Design", "Figma"],
      interests: ["Design", "Competitions"],
      roles: ["UI/UX Designer"]
    },
    {
      id: "u3",
      fullName: "Hind Alotaibi",
      email: "hind@example.com",
      password: "Sample123",
      skills: ["Back-end", "Databases", "PHP"],
      interests: ["Practical Projects", "Web Development"],
      roles: ["Back-end Developer"]
    },
    {
      id: "u4",
      fullName: "Maha Alshehri",
      email: "maha@example.com",
      password: "Sample123",
      skills: ["Data Analysis", "Python", "AI"],
      interests: ["AI", "Hackathons"],
      roles: ["Data Analyst"]
    }
  ];

  const teams = [
    {
      id: "t1",
      title: "Smart Campus App",
      description: "A mobile-friendly app that helps students find free study rooms on campus.",
      type: "Hackathon",
      skills: ["Back-end", "UI/UX Design"],
      positions: ["Back-end Developer", "UI/UX Designer"],
      creatorId: "u1",
      members: ["u1"]
    },
    {
      id: "t2",
      title: "Health Data Dashboard",
      description: "A dashboard that shows health statistics in simple charts.",
      type: "Competition",
      skills: ["Front-end", "Data Analysis"],
      positions: ["Front-end Developer"],
      creatorId: "u4",
      members: ["u4"]
    },
    {
      id: "t3",
      title: "Library Booking System",
      description: "A course project for booking library books and rooms online.",
      type: "Practical Project",
      skills: ["Front-end", "Databases"],
      positions: ["Front-end Developer", "Software Tester"],
      creatorId: "u3",
      members: ["u3", "u1"]
    }
  ];

  const requests = [];

  saveUsers(users);
  saveTeams(teams);
  saveRequests(requests);
  localStorage.setItem("sampleDataVersion", "4");
}

addSampleData();
