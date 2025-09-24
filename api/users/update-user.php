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

// Check admin permissions
$auth_security->requireAdmin($user_data['id'], 'update_user');

// Check rate limiting
$auth_security->checkCriticalRateLimit($user_data['id'], 'update_user', 5, 60);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['user_id'])) {
    http_response_code(400);
    echo json_encode(array("error" => "Dados obrigatórios não fornecidos"));
    exit();
}

$user_id = $data['user_id'];
$full_name = $data['full_name'] ?? null;
$role = $data['role'] ?? null;
$active = $data['active'] ?? null;
$whatsapp = $data['whatsapp'] ?? null;

try {
    $db->beginTransaction();
    
    // Update profile
    $update_fields = [];
    $params = [':user_id' => $user_id];
    
    if ($full_name !== null) {
        $update_fields[] = "full_name = :full_name";
        $params[':full_name'] = $full_name;
    }
    
    if ($role !== null) {
        $update_fields[] = "role = :role";
        $params[':role'] = $role;
    }
    
    if ($whatsapp !== null) {
        $update_fields[] = "whatsapp = :whatsapp";
        $params[':whatsapp'] = $whatsapp;
    }
    
    if (!empty($update_fields)) {
        $query = "UPDATE profiles SET " . implode(", ", $update_fields) . " WHERE user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
    }
    
    // Update user active status if provided
    if ($active !== null) {
        $query = "UPDATE profiles SET active = :active WHERE user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":active", $active, PDO::PARAM_BOOL);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
    }
    
    $db->commit();
    
    // Log the admin action
    $security_logger = new SecurityLogger($db);
    $security_logger->logSecurityEvent('user_updated', $_SERVER['REMOTE_ADDR'], $user_data['id'], "Updated user: $user_id");
    
    http_response_code(200);
    echo json_encode(array("message" => "Usuário atualizado com sucesso"));
    
} catch (Exception $e) {
    $db->rollback();
    http_response_code(500);
    echo json_encode(array("error" => "Erro ao atualizar usuário"));
}
?>