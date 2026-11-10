<?php
// ProjectHub API: the pages send requests here and get JSON back from the MySQL database

session_start();
header("Content-Type: application/json");
require "db.php";

$action = $_GET["action"] ?? "";
$input = json_decode(file_get_contents("php://input"), true) ?? [];

// ---------- Helpers ----------

function sendResult($data = [])
{
    echo json_encode(array_merge(["ok" => true], $data));
    exit;
}

function sendError($message, $field = null, $code = 400)
{
    http_response_code($code);
    echo json_encode(["ok" => false, "message" => $message, "field" => $field]);
    exit;
}

function inputText($input, $name)
{
    return trim((string) ($input[$name] ?? ""));
}

function inputList($input, $name)
{
    $list = $input[$name] ?? [];
    if (!is_array($list)) {
        return [];
    }
    return array_values(array_unique(array_filter(array_map("trim", $list))));
}

function isValidPassword($password)
{
    return strlen($password) >= 8 && preg_match("/[0-9]/", $password) && preg_match("/[A-Z]/", $password);
}

function loginSession($id, $role)
{
    session_regenerate_id(true);
    $_SESSION["userId"] = $id;
    $_SESSION["role"] = $role;
    setcookie("loggedIn", "1", 0, "/");
}

function endSession()
{
    $_SESSION = [];
    session_destroy();
    setcookie("loggedIn", "", time() - 3600, "/");
}

function requireStudent()
{
    if (($_SESSION["role"] ?? "") !== "student") {
        sendError("Please log in first.", null, 401);
    }
    return (int) $_SESSION["userId"];
}

function requireAdmin()
{
    if (($_SESSION["role"] ?? "") !== "admin") {
        sendError("Only the admin can do this.", null, 403);
    }
    return (int) $_SESSION["userId"];
}

function emailExists($pdo, $email)
{
    $statement = $pdo->prepare("SELECT (SELECT COUNT(*) FROM Student WHERE email = ?) + (SELECT COUNT(*) FROM Admin WHERE email = ?)");
    $statement->execute([$email, $email]);
    return $statement->fetchColumn() > 0;
}

function firstAdminId($pdo)
{
    $id = $pdo->query("SELECT adminId FROM Admin ORDER BY adminId LIMIT 1")->fetchColumn();
    return $id === false ? null : (int) $id;
}

function saveLinks($pdo, $table, $ownerColumn, $ownerId, $listTable, $listColumn, $names)
{
    $pdo->prepare("DELETE FROM $table WHERE $ownerColumn = ?")->execute([$ownerId]);
    $insert = $pdo->prepare("INSERT IGNORE INTO $table ($ownerColumn, $listColumn) SELECT ?, $listColumn FROM $listTable WHERE name = ?");
    foreach ($names as $name) {
        $insert->execute([$ownerId, $name]);
    }
}

function getTeamCreator($pdo, $teamId)
{
    $statement = $pdo->prepare("SELECT creatorId FROM Team WHERE teamId = ?");
    $statement->execute([$teamId]);
    $creatorId = $statement->fetchColumn();
    return $creatorId === false ? null : (int) $creatorId;
}

function checkStudentForm($fullName, $skills, $roles)
{
    if ($fullName === "") {
        sendError("Please enter your full name.", "fullName");
    }
    if (count($skills) === 0) {
        sendError("Please choose at least one skill.", "skills");
    }
    if (count($roles) === 0) {
        sendError("Please choose at least one preferred role.", "roles");
    }
}

function readTeamForm($input)
{
    $team = [
        "title" => inputText($input, "title"),
        "description" => inputText($input, "description"),
        "type" => inputText($input, "type"),
        "skills" => inputList($input, "skills"),
        "positions" => inputList($input, "positions")
    ];
    if ($team["title"] === "") {
        sendError("Please enter a title.", "title");
    }
    if ($team["description"] === "") {
        sendError("Please describe the team.", "description");
    }
    if (!in_array($team["type"], ["Hackathon", "Competition", "Practical Project"])) {
        sendError("Please choose a type.", "type");
    }
    if (count($team["skills"]) === 0) {
        sendError("Please choose at least one required skill.", "skills");
    }
    if (count($team["positions"]) === 0) {
        sendError("Please choose at least one open position.", "positions");
    }
    return $team;
}

function saveTeamLinks($pdo, $teamId, $team)
{
    saveLinks($pdo, "TeamSkill", "teamId", $teamId, "Skill", "skillId", $team["skills"]);
    saveLinks($pdo, "TeamPosition", "teamId", $teamId, "Role", "roleId", $team["positions"]);
}

function namesByOwner($pdo, $sql)
{
    $result = [];
    foreach ($pdo->query($sql) as $row) {
        $result[$row["ownerId"]][] = $row["name"];
    }
    return $result;
}

// ---------- Load all data for the pages ----------

function loadData($pdo)
{
    $currentUser = null;
    $role = $_SESSION["role"] ?? "";
    $userId = (int) ($_SESSION["userId"] ?? 0);

    if ($role === "admin") {
        $statement = $pdo->prepare("SELECT adminId, fullName, email FROM Admin WHERE adminId = ?");
        $statement->execute([$userId]);
        $admin = $statement->fetch();
        if ($admin) {
            $currentUser = [
                "id" => "admin",
                "fullName" => $admin["fullName"],
                "email" => $admin["email"],
                "role" => "admin",
                "skills" => [],
                "interests" => [],
                "roles" => []
            ];
        }
    }

    if ($currentUser === null && $role !== "student") {
        endSession();
        sendResult(["currentUser" => null, "users" => [], "teams" => [], "requests" => []]);
    }

    $skills = namesByOwner($pdo, "SELECT ss.studentId AS ownerId, s.name FROM StudentSkill ss JOIN Skill s ON s.skillId = ss.skillId ORDER BY s.skillId");
    $interests = namesByOwner($pdo, "SELECT si.studentId AS ownerId, i.name FROM StudentInterest si JOIN Interest i ON i.interestId = si.interestId ORDER BY i.interestId");
    $roles = namesByOwner($pdo, "SELECT sr.studentId AS ownerId, r.name FROM StudentRole sr JOIN Role r ON r.roleId = sr.roleId ORDER BY r.roleId");

    $users = [];
    foreach ($pdo->query("SELECT studentId, fullName, email FROM Student ORDER BY studentId") as $row) {
        $id = $row["studentId"];
        $users[] = [
            "id" => (string) $id,
            "fullName" => $row["fullName"],
            "email" => $row["email"],
            "role" => "student",
            "skills" => $skills[$id] ?? [],
            "interests" => $interests[$id] ?? [],
            "roles" => $roles[$id] ?? []
        ];
        if ($role === "student" && $id == $userId) {
            $currentUser = end($users);
        }
    }

    if ($currentUser === null) {
        endSession();
        sendResult(["currentUser" => null, "users" => [], "teams" => [], "requests" => []]);
    }

    $teamSkills = namesByOwner($pdo, "SELECT ts.teamId AS ownerId, s.name FROM TeamSkill ts JOIN Skill s ON s.skillId = ts.skillId ORDER BY s.skillId");
    $teamPositions = namesByOwner($pdo, "SELECT tp.teamId AS ownerId, r.name FROM TeamPosition tp JOIN Role r ON r.roleId = tp.roleId ORDER BY r.roleId");
    $members = [];
    foreach ($pdo->query("SELECT tm.teamId, tm.studentId FROM TeamMember tm JOIN Team t ON t.teamId = tm.teamId ORDER BY (tm.studentId = t.creatorId) DESC, tm.studentId") as $row) {
        $members[$row["teamId"]][] = (string) $row["studentId"];
    }

    $teams = [];
    foreach ($pdo->query("SELECT teamId, title, description, type, creatorId FROM Team ORDER BY teamId") as $row) {
        $id = $row["teamId"];
        $teams[] = [
            "id" => (string) $id,
            "title" => $row["title"],
            "description" => $row["description"],
            "type" => $row["type"],
            "skills" => $teamSkills[$id] ?? [],
            "positions" => $teamPositions[$id] ?? [],
            "creatorId" => (string) $row["creatorId"],
            "members" => $members[$id] ?? []
        ];
    }

    $requests = [];
    foreach ($pdo->query("SELECT requestId, teamId, studentId, status, date FROM JoinRequest ORDER BY requestId") as $row) {
        $requests[] = [
            "id" => (string) $row["requestId"],
            "teamId" => (string) $row["teamId"],
            "studentId" => (string) $row["studentId"],
            "status" => $row["status"],
            "date" => $row["date"]
        ];
    }

    sendResult(["currentUser" => $currentUser, "users" => $users, "teams" => $teams, "requests" => $requests]);
}

// ---------- Actions ----------

try {
    switch ($action) {
        case "load":
            loadData($pdo);
            break;

        // ---------- Register, Login, Logout, Reset Password ----------

        case "register":
            $fullName = inputText($input, "fullName");
            $email = strtolower(inputText($input, "email"));
            $password = (string) ($input["password"] ?? "");
            $skills = inputList($input, "skills");
            $interests = inputList($input, "interests");
            $roles = inputList($input, "roles");

            checkStudentForm($fullName, $skills, $roles);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                sendError("Please enter a valid email address, like name@example.com.", "email");
            }
            if (emailExists($pdo, $email)) {
                sendError("This email is already registered. Try logging in instead.", "email");
            }
            if (!isValidPassword($password)) {
                sendError("Use at least 8 characters with one number and one uppercase letter.", "password");
            }

            $pdo->beginTransaction();
            $pdo->prepare("INSERT INTO Student (fullName, email, passwordHash, adminId) VALUES (?, ?, ?, ?)")
                ->execute([$fullName, $email, password_hash($password, PASSWORD_DEFAULT), firstAdminId($pdo)]);
            $studentId = (int) $pdo->lastInsertId();
            saveLinks($pdo, "StudentSkill", "studentId", $studentId, "Skill", "skillId", $skills);
            saveLinks($pdo, "StudentInterest", "studentId", $studentId, "Interest", "interestId", $interests);
            saveLinks($pdo, "StudentRole", "studentId", $studentId, "Role", "roleId", $roles);
            $pdo->commit();

            loginSession($studentId, "student");
            sendResult();
            break;

        case "login":
            $email = strtolower(inputText($input, "email"));
            $password = (string) ($input["password"] ?? "");

            $statement = $pdo->prepare("SELECT adminId, fullName, passwordHash FROM Admin WHERE email = ?");
            $statement->execute([$email]);
            $admin = $statement->fetch();
            if ($admin && password_verify($password, $admin["passwordHash"])) {
                loginSession((int) $admin["adminId"], "admin");
                sendResult(["role" => "admin", "fullName" => $admin["fullName"]]);
            }

            $statement = $pdo->prepare("SELECT studentId, fullName, passwordHash FROM Student WHERE email = ?");
            $statement->execute([$email]);
            $student = $statement->fetch();
            if (!$student || !password_verify($password, $student["passwordHash"])) {
                sendError("Incorrect email or password. Please try again.", "password");
            }

            loginSession((int) $student["studentId"], "student");
            sendResult(["role" => "student", "fullName" => $student["fullName"]]);
            break;

        case "logout":
            endSession();
            sendResult();
            break;

        case "checkEmail":
            $statement = $pdo->prepare("SELECT COUNT(*) FROM Student WHERE email = ?");
            $statement->execute([strtolower(inputText($input, "email"))]);
            if ($statement->fetchColumn() == 0) {
                sendError("This email is not registered.", "resetEmail");
            }
            sendResult();
            break;

        case "resetPassword":
            $email = strtolower(inputText($input, "email"));
            $password = (string) ($input["password"] ?? "");
            if (!isValidPassword($password)) {
                sendError("Use at least 8 characters with one number and one uppercase letter.", "newPassword");
            }
            $statement = $pdo->prepare("UPDATE Student SET passwordHash = ? WHERE email = ?");
            $statement->execute([password_hash($password, PASSWORD_DEFAULT), $email]);
            if ($statement->rowCount() === 0) {
                sendError("This email is not registered.", "newPassword");
            }
            sendResult();
            break;

        // ---------- Profile ----------

        case "updateProfile":
            $studentId = requireStudent();
            $fullName = inputText($input, "fullName");
            $skills = inputList($input, "skills");
            $interests = inputList($input, "interests");
            $roles = inputList($input, "roles");
            checkStudentForm($fullName, $skills, $roles);

            $pdo->beginTransaction();
            $pdo->prepare("UPDATE Student SET fullName = ? WHERE studentId = ?")->execute([$fullName, $studentId]);
            saveLinks($pdo, "StudentSkill", "studentId", $studentId, "Skill", "skillId", $skills);
            saveLinks($pdo, "StudentInterest", "studentId", $studentId, "Interest", "interestId", $interests);
            saveLinks($pdo, "StudentRole", "studentId", $studentId, "Role", "roleId", $roles);
            $pdo->commit();
            sendResult();
            break;

        case "deleteAccount":
            $studentId = requireStudent();
            $pdo->prepare("DELETE FROM Student WHERE studentId = ?")->execute([$studentId]);
            endSession();
            sendResult();
            break;

        // ---------- Teams ----------

        case "createTeam":
            $studentId = requireStudent();
            $team = readTeamForm($input);

            $pdo->beginTransaction();
            $pdo->prepare("INSERT INTO Team (title, description, type, creatorId, adminId) VALUES (?, ?, ?, ?, ?)")
                ->execute([$team["title"], $team["description"], $team["type"], $studentId, firstAdminId($pdo)]);
            $teamId = (int) $pdo->lastInsertId();
            $pdo->prepare("INSERT INTO TeamMember (teamId, studentId) VALUES (?, ?)")->execute([$teamId, $studentId]);
            saveTeamLinks($pdo, $teamId, $team);
            $pdo->commit();
            sendResult(["teamId" => (string) $teamId]);
            break;

        case "updateTeam":
            $studentId = requireStudent();
            $teamId = (int) ($input["teamId"] ?? 0);
            if (getTeamCreator($pdo, $teamId) !== $studentId) {
                sendError("Only the team creator can change this team.", null, 403);
            }
            $team = readTeamForm($input);

            $pdo->beginTransaction();
            $pdo->prepare("UPDATE Team SET title = ?, description = ?, type = ? WHERE teamId = ?")
                ->execute([$team["title"], $team["description"], $team["type"], $teamId]);
            saveTeamLinks($pdo, $teamId, $team);
            $pdo->commit();
            sendResult();
            break;

        case "deleteTeam":
            $teamId = (int) ($input["teamId"] ?? 0);
            $isAdmin = ($_SESSION["role"] ?? "") === "admin";
            if (!$isAdmin && getTeamCreator($pdo, $teamId) !== requireStudent()) {
                sendError("Only the team creator can delete this team.", null, 403);
            }
            $pdo->prepare("DELETE FROM Team WHERE teamId = ?")->execute([$teamId]);
            sendResult();
            break;

        // ---------- Join requests ----------

        case "sendRequest":
            $studentId = requireStudent();
            $teamId = (int) ($input["teamId"] ?? 0);
            if (getTeamCreator($pdo, $teamId) === null) {
                sendError("This team does not exist or was deleted.");
            }
            $statement = $pdo->prepare("SELECT COUNT(*) FROM TeamMember WHERE teamId = ? AND studentId = ?");
            $statement->execute([$teamId, $studentId]);
            if ($statement->fetchColumn() > 0) {
                sendError("You are already a member of this team.");
            }
            $statement = $pdo->prepare("INSERT IGNORE INTO JoinRequest (studentId, teamId, status, date) VALUES (?, ?, 'pending', CURDATE())");
            $statement->execute([$studentId, $teamId]);
            if ($statement->rowCount() === 0) {
                sendError("You already sent a request to this team.");
            }
            sendResult();
            break;

        case "answerRequest":
            $studentId = requireStudent();
            $requestId = (int) ($input["requestId"] ?? 0);
            $answer = inputText($input, "answer");
            if (!in_array($answer, ["accepted", "rejected"])) {
                sendError("Unknown answer.");
            }

            $statement = $pdo->prepare("SELECT teamId, studentId, status FROM JoinRequest WHERE requestId = ?");
            $statement->execute([$requestId]);
            $request = $statement->fetch();
            if (!$request || getTeamCreator($pdo, (int) $request["teamId"]) !== $studentId) {
                sendError("You can only manage requests for your own teams.", null, 403);
            }
            if ($request["status"] !== "pending") {
                sendError("This request has already been answered.");
            }

            $pdo->beginTransaction();
            $pdo->prepare("UPDATE JoinRequest SET status = ? WHERE requestId = ?")->execute([$answer, $requestId]);
            if ($answer === "accepted") {
                $pdo->prepare("INSERT IGNORE INTO TeamMember (teamId, studentId) VALUES (?, ?)")
                    ->execute([$request["teamId"], $request["studentId"]]);
            }
            $pdo->commit();
            sendResult();
            break;

        // ---------- Admin ----------

        case "deleteStudent":
            requireAdmin();
            $pdo->prepare("DELETE FROM Student WHERE studentId = ?")->execute([(int) ($input["studentId"] ?? 0)]);
            sendResult();
            break;

        default:
            sendError("Unknown action.", null, 404);
    }
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendError("Something went wrong with the database. Please try again.", null, 500);
}
