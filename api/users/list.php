<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/jwt.php';
include_once '../config/security.php';
include_once '../config/auth-security.php';

$database = new Database();
$db = $database->getConnection();
$jwt = new JWTHandler();
$auth_security = new AuthSecurity($db);

// Validate token
$token = $jwt->getBearerToken();
if (!$token) {
    http_response_code(401);
    echo json_encode(array("error" => "Token não fornecido"));
    exit();
}

$user_data = $jwt->validateToken($token);
if (!$user_data) {
    http_response_code(401);
    echo json_encode(array("error" => "Token inválido"));
    exit();
}

$user_role = $user_data['role'];

// Check admin permissions with database revalidation
$auth_security->requireAdmin($user_data['id'], 'list_users');

// Check rate limiting for admin operations
$auth_security->checkCriticalRateLimit($user_data['id'], 'list_users', 10, 60);

try {
    $query = "SELECT p.*, u.email FROM profiles p 
              JOIN users u ON p.user_id = u.id 
              WHERE p.active = true
              ORDER BY p.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($users);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => "Erro ao buscar usuários: " . $e->getMessage()));
}
?>