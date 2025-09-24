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

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['id']) || !isset($data['name'])) {
    http_response_code(400);
    echo json_encode(array("error" => "ID e nome são obrigatórios"));
    exit();
}

$group_id = $data['id'];
$name = trim($data['name']);
$description = trim($data['description'] ?? '');

if (empty($name)) {
    http_response_code(400);
    echo json_encode(array("error" => "Nome não pode estar vazio"));
    exit();
}

try {
    // Check if user can modify this group
    $check_query = "SELECT created_by FROM groups WHERE id = :id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":id", $group_id);
    $check_stmt->execute();
    $group = $check_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$group) {
        http_response_code(404);
        echo json_encode(array("error" => "Grupo não encontrado"));
        exit();
    }
    
    // Only admin or group creator can edit
    $auth_security->canModifyResource($user_data['id'], $group['created_by'], 'update_group');
    
    // Check rate limiting
    $auth_security->checkCriticalRateLimit($user_data['id'], 'update_group', 5, 60);
    
    $query = "UPDATE groups SET name = :name, description = :description, updated_at = NOW() 
              WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":name", $name);
    $stmt->bindParam(":description", $description);
    $stmt->bindParam(":id", $group_id);
    $stmt->execute();
    
    // Log the action
    $security_logger = new SecurityLogger($db);
    $security_logger->logSecurityEvent('group_updated', $_SERVER['REMOTE_ADDR'], $user_data['id'], "Updated group: $group_id");
    
    http_response_code(200);
    echo json_encode(array("message" => "Grupo atualizado com sucesso"));
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => "Erro ao atualizar grupo"));
}
?>