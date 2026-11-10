-- ProjectHub database (MySQL)

DROP DATABASE IF EXISTS projecthub;
CREATE DATABASE projecthub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE projecthub;

-- ---------- Main tables ----------

CREATE TABLE Admin (
  adminId INT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE Student (
  studentId INT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  adminId INT NULL,
  FOREIGN KEY (adminId) REFERENCES Admin(adminId) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE Team (
  teamId INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  type VARCHAR(30) NOT NULL,
  creatorId INT NOT NULL,
  adminId INT NULL,
  CHECK (type IN ('Hackathon', 'Competition', 'Practical Project')),
  FOREIGN KEY (creatorId) REFERENCES Student(studentId) ON DELETE CASCADE,
  FOREIGN KEY (adminId) REFERENCES Admin(adminId) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE JoinRequest (
  requestId INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  teamId INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  date DATE NOT NULL,
  UNIQUE (studentId, teamId),
  CHECK (status IN ('pending', 'accepted', 'rejected')),
  FOREIGN KEY (studentId) REFERENCES Student(studentId) ON DELETE CASCADE,
  FOREIGN KEY (teamId) REFERENCES Team(teamId) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Lists (drop-down menus) ----------

CREATE TABLE Skill (
  skillId INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE Interest (
  interestId INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE Role (
  roleId INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ---------- Linking tables (many-to-many) ----------

CREATE TABLE StudentSkill (
  studentId INT NOT NULL,
  skillId INT NOT NULL,
  PRIMARY KEY (studentId, skillId),
  FOREIGN KEY (studentId) REFERENCES Student(studentId) ON DELETE CASCADE,
  FOREIGN KEY (skillId) REFERENCES Skill(skillId) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE StudentInterest (
  studentId INT NOT NULL,
  interestId INT NOT NULL,
  PRIMARY KEY (studentId, interestId),
  FOREIGN KEY (studentId) REFERENCES Student(studentId) ON DELETE CASCADE,
  FOREIGN KEY (interestId) REFERENCES Interest(interestId) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE StudentRole (
  studentId INT NOT NULL,
  roleId INT NOT NULL,
  PRIMARY KEY (studentId, roleId),
  FOREIGN KEY (studentId) REFERENCES Student(studentId) ON DELETE CASCADE,
  FOREIGN KEY (roleId) REFERENCES Role(roleId) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE TeamMember (
  teamId INT NOT NULL,
  studentId INT NOT NULL,
  PRIMARY KEY (teamId, studentId),
  FOREIGN KEY (teamId) REFERENCES Team(teamId) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES Student(studentId) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE TeamSkill (
  teamId INT NOT NULL,
  skillId INT NOT NULL,
  PRIMARY KEY (teamId, skillId),
  FOREIGN KEY (teamId) REFERENCES Team(teamId) ON DELETE CASCADE,
  FOREIGN KEY (skillId) REFERENCES Skill(skillId) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE TeamPosition (
  teamId INT NOT NULL,
  roleId INT NOT NULL,
  PRIMARY KEY (teamId, roleId),
  FOREIGN KEY (teamId) REFERENCES Team(teamId) ON DELETE CASCADE,
  FOREIGN KEY (roleId) REFERENCES Role(roleId) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Data for the lists ----------

INSERT INTO Skill (name) VALUES
('Front-end'), ('Back-end'), ('Full-stack'), ('Mobile Development'), ('HTML'), ('CSS'),
('JavaScript'), ('PHP'), ('Python'), ('Java'), ('C++'), ('C#'), ('Databases'), ('SQL'),
('Git & GitHub'), ('UI/UX Design'), ('Figma'), ('Graphic Design'), ('Prototyping'),
('Data Analysis'), ('Data Visualization'), ('Machine Learning'), ('AI'), ('Cybersecurity'),
('Networking'), ('Cloud Computing'), ('Linux'), ('Software Testing'), ('Game Development'),
('IoT'), ('Project Management'), ('Requirements Analysis'), ('UML Modeling'),
('Technical Writing'), ('Research'), ('Presentation Skills'), ('Teamwork');

INSERT INTO Role (name) VALUES
('Front-end Developer'), ('Back-end Developer'), ('Full-stack Developer'), ('Mobile Developer'),
('UI/UX Designer'), ('Graphic Designer'), ('Data Analyst'), ('AI Engineer'),
('Cybersecurity Specialist'), ('Network Engineer'), ('Software Tester'), ('Project Manager'),
('Business Analyst'), ('Technical Writer'), ('Presenter');

INSERT INTO Interest (name) VALUES
('Hackathons'), ('Competitions'), ('Practical Projects'), ('Web Development'), ('Mobile Apps'),
('AI'), ('Data Science'), ('Cybersecurity'), ('Game Development'), ('Design'),
('Cloud Computing'), ('IoT'), ('Robotics'), ('Startups'), ('Open Source'), ('Research');

-- ---------- Sample data ----------
-- Admin password: Admin123   |   Students password: Sample123

INSERT INTO Admin (adminId, fullName, email, passwordHash) VALUES
(1, 'ProjectHub Admin', 'admin@projecthub.com', '$2y$10$a8l7vhG9OnWeJ4w6FEcZ/.JIl/CvLG.gnNACYPwWL7VZftRnb78gu');

INSERT INTO Student (studentId, fullName, email, passwordHash, adminId) VALUES
(1, 'Sara Alqahtani', 'sara@example.com', '$2y$10$yJEGLsNT75Q9UB7FMwjPdeGdbtxsTokaeT7uFg0outvSgGtpx/tV.', 1),
(2, 'Lama Alharbi',   'lama@example.com', '$2y$10$yJEGLsNT75Q9UB7FMwjPdeGdbtxsTokaeT7uFg0outvSgGtpx/tV.', 1),
(3, 'Hind Alotaibi',  'hind@example.com', '$2y$10$yJEGLsNT75Q9UB7FMwjPdeGdbtxsTokaeT7uFg0outvSgGtpx/tV.', 1),
(4, 'Maha Alshehri',  'maha@example.com', '$2y$10$yJEGLsNT75Q9UB7FMwjPdeGdbtxsTokaeT7uFg0outvSgGtpx/tV.', 1);

INSERT INTO StudentSkill (studentId, skillId)
SELECT 1, skillId FROM Skill WHERE name IN ('Front-end', 'JavaScript', 'HTML', 'CSS')
UNION ALL SELECT 2, skillId FROM Skill WHERE name IN ('UI/UX Design', 'Figma')
UNION ALL SELECT 3, skillId FROM Skill WHERE name IN ('Back-end', 'Databases', 'PHP')
UNION ALL SELECT 4, skillId FROM Skill WHERE name IN ('Data Analysis', 'Python', 'AI');

INSERT INTO StudentInterest (studentId, interestId)
SELECT 1, interestId FROM Interest WHERE name IN ('Hackathons', 'Web Development')
UNION ALL SELECT 2, interestId FROM Interest WHERE name IN ('Design', 'Competitions')
UNION ALL SELECT 3, interestId FROM Interest WHERE name IN ('Practical Projects', 'Web Development')
UNION ALL SELECT 4, interestId FROM Interest WHERE name IN ('AI', 'Hackathons');

INSERT INTO StudentRole (studentId, roleId)
SELECT 1, roleId FROM Role WHERE name = 'Front-end Developer'
UNION ALL SELECT 2, roleId FROM Role WHERE name = 'UI/UX Designer'
UNION ALL SELECT 3, roleId FROM Role WHERE name = 'Back-end Developer'
UNION ALL SELECT 4, roleId FROM Role WHERE name = 'Data Analyst';

INSERT INTO Team (teamId, title, description, type, creatorId, adminId) VALUES
(1, 'Smart Campus App', 'A mobile-friendly app that helps students find free study rooms on campus.', 'Hackathon', 1, 1),
(2, 'Health Data Dashboard', 'A dashboard that shows health statistics in simple charts.', 'Competition', 4, 1),
(3, 'Library Booking System', 'A course project for booking library books and rooms online.', 'Practical Project', 3, 1);

INSERT INTO TeamMember (teamId, studentId) VALUES
(1, 1), (2, 4), (3, 3), (3, 1);

INSERT INTO TeamSkill (teamId, skillId)
SELECT 1, skillId FROM Skill WHERE name IN ('Back-end', 'UI/UX Design')
UNION ALL SELECT 2, skillId FROM Skill WHERE name IN ('Front-end', 'Data Analysis')
UNION ALL SELECT 3, skillId FROM Skill WHERE name IN ('Front-end', 'Databases');

INSERT INTO TeamPosition (teamId, roleId)
SELECT 1, roleId FROM Role WHERE name IN ('Back-end Developer', 'UI/UX Designer')
UNION ALL SELECT 2, roleId FROM Role WHERE name = 'Front-end Developer'
UNION ALL SELECT 3, roleId FROM Role WHERE name IN ('Front-end Developer', 'Software Tester');
