<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/jwt.php';
include_once '../config/security.php';

$database = new Database();
$db = $database->getConnection();
$jwt = new JWTHandler();
$securityLogger = new SecurityLogger($db);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    // Get token for user identification
    $token = $jwt->getBearerToken();
    if ($token) {
        $user_data = $jwt->validateToken($token);
        if ($user_data) {
            $securityLogger->logSecurityEvent('logout', $ip, $user_data['sub'], $user_data['email']);
        }
    }
    
    http_response_code(200);
    echo json_encode(array("message" => "Logout realizado com sucesso"));
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>