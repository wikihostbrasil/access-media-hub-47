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
    $user_id = null;
    $user_email = null;
    
    if ($token) {
        $user_data = $jwt->validateToken($token);
        if ($user_data) {
            $user_id = $user_data['id'];
            $user_email = $user_data['email'];
            $securityLogger->logSecurityEvent('logout', $ip, $user_id, $user_email);
        }
    }
    
    // Revogar refresh token do cookie
    if (isset($_COOKIE['refresh_token'])) {
        $refresh_token = $_COOKIE['refresh_token'];
        $token_hash = hash('sha256', $refresh_token);
        
        try {
            // Marcar token como revogado no banco
            $revoke_query = "UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = :token_hash";
            $revoke_stmt = $db->prepare($revoke_query);
            $revoke_stmt->bindParam(":token_hash", $token_hash);
            $revoke_stmt->execute();
        } catch (Exception $e) {
            error_log("Failed to revoke refresh token: " . $e->getMessage());
        }
        
        // Limpar cookie
        $is_secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443;
        setcookie(
            'refresh_token',
            '',
            [
                'expires' => time() - 3600,
                'path' => '/',
                'domain' => '',
                'secure' => $is_secure,
                'httponly' => true,
                'samesite' => 'Lax'
            ]
        );
    }
    
    http_response_code(200);
    echo json_encode(array("message" => "Logout realizado com sucesso"));
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>