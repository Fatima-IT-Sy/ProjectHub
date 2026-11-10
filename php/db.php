<?php
// Database connection (MAMP: user root, password root. On Mac MAMP, MySQL port is usually 8889)

$host = "localhost";
$port = 8889;
$dbName = "projecthub.sql";
$dbUser = "root";
$dbPassword = "root";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPassword);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode(["ok" => false, "message" => "Could not connect to the database."]);
    exit;
}
