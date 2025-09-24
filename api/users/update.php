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

// Check rate limiting for profile updates
$auth_security->checkCriticalRateLimit($user_data['id'], 'update_profile', 5, 60);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = $user_data['id'];
    
    if (!isset($data['full_name'])) {
        http_response_code(400);
        echo json_encode(array("error" => "Nome completo é obrigatório"));
        exit();
    }

    $full_name = trim($data['full_name']);
    $whatsapp = isset($data['whatsapp']) ? trim($data['whatsapp']) : null;
    $receive_notifications = isset($data['receive_notifications']) ? (bool)$data['receive_notifications'] : true;

    try {
        $db->beginTransaction();
        
        // Check if profile exists
        $check_query = "SELECT id FROM profiles WHERE user_id = :user_id";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(":user_id", $user_id);
        $check_stmt->execute();
        $profile_exists = $check_stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($profile_exists) {
            // Update existing profile
            $query = "UPDATE profiles SET 
                        full_name = :full_name, 
                        whatsapp = :whatsapp, 
                        receive_notifications = :receive_notifications,
                        updated_at = NOW()
                      WHERE user_id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":full_name", $full_name);
            $stmt->bindParam(":whatsapp", $whatsapp);
            $stmt->bindParam(":receive_notifications", $receive_notifications, PDO::PARAM_BOOL);
            $stmt->bindParam(":user_id", $user_id);
            $stmt->execute();
        } else {
            // Create new profile
            $insert_query = "INSERT INTO profiles (user_id, full_name, whatsapp, receive_notifications, role, active, created_at, updated_at) 
                           VALUES (:user_id, :full_name, :whatsapp, :receive_notifications, 'user', 1, NOW(), NOW())";
            $insert_stmt = $db->prepare($insert_query);
            $insert_stmt->bindParam(":user_id", $user_id);
            $insert_stmt->bindParam(":full_name", $full_name);
            $insert_stmt->bindParam(":whatsapp", $whatsapp);
            $insert_stmt->bindParam(":receive_notifications", $receive_notifications, PDO::PARAM_BOOL);
            $insert_stmt->execute();
        }
        
        $db->commit();
        
        // Log the action
        $security_logger = new SecurityLogger($db);
        $security_logger->logSecurityEvent('profile_updated', $_SERVER['REMOTE_ADDR'], $user_id, "Profile updated successfully");

        http_response_code(200);
        echo json_encode(array("message" => "Perfil atualizado com sucesso"));
        
    } catch (Exception $e) {
        $db->rollback();
        error_log("Profile update error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(array("error" => "Erro ao atualizar perfil: " . $e->getMessage()));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>