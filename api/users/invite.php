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
$auth_security->requireAdmin($user_data['id'], 'invite_user');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['email']) || !isset($data['full_name']) || !isset($data['role'])) {
        http_response_code(400);
        echo json_encode(array("error" => "Email, nome completo e role são obrigatórios"));
        exit();
    }

    $email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
    $full_name = trim($data['full_name']);
    $role = $data['role'];
    $whatsapp = isset($data['whatsapp']) ? trim($data['whatsapp']) : null;

    if (!$email) {
        http_response_code(400);
        echo json_encode(array("error" => "Email inválido"));
        exit();
    }

    if (!in_array($role, ['admin', 'operator', 'user'])) {
        http_response_code(400);
        echo json_encode(array("error" => "Role inválido"));
        exit();
    }

    try {
        // Check if user already exists
        $query = "SELECT id FROM users WHERE email = :email";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(array("error" => "Usuário já existe com este email"));
            exit();
        }

        // Generate temporary password
        $temp_password = bin2hex(random_bytes(8));
        $password_hash = password_hash($temp_password, PASSWORD_DEFAULT);
        
        // Create user
        $user_id = bin2hex(random_bytes(16));
        $query = "INSERT INTO users (id, email, password, created_at) VALUES (:id, :email, :password, NOW())";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $user_id);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":password", $password_hash);
        $stmt->execute();

        // Create profile
        $profile_id = bin2hex(random_bytes(16));
        $query = "INSERT INTO profiles (id, user_id, full_name, role, whatsapp, active, created_at, updated_at) 
                  VALUES (:id, :user_id, :full_name, :role, :whatsapp, 1, NOW(), NOW())";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $profile_id);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":full_name", $full_name);
        $stmt->bindParam(":role", $role);
        $stmt->bindParam(":whatsapp", $whatsapp);
        $stmt->execute();

        http_response_code(201);
        echo json_encode(array(
            "message" => "Usuário convidado com sucesso",
            "temp_password" => $temp_password,
            "email" => $email
        ));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => "Erro ao convidar usuário"));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>