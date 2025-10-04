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
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    // Ler refresh token do cookie
    if (!isset($_COOKIE['refresh_token'])) {
        $securityLogger->logSecurityEvent('refresh_failed', $ip, null, 'Cookie not present. UA: ' . substr($user_agent, 0, 100));
        error_log("[Refresh] Cookie 'refresh_token' not found | IP: $ip | UA: $user_agent");
        http_response_code(401);
        echo json_encode(array("error" => "Refresh token não encontrado"));
        exit();
    }
    
    $refresh_token = $_COOKIE['refresh_token'];
    $token_hash = hash('sha256', $refresh_token);
    
    error_log("[Refresh] Cookie received | IP: $ip | Token hash: " . substr($token_hash, 0, 16) . "...");
    
    try {
        // Validar refresh token no banco
        $query = "SELECT rt.*, u.email, p.role, p.full_name 
                  FROM refresh_tokens rt
                  JOIN profiles p ON rt.user_id = p.user_id
                  JOIN users u ON rt.user_id = u.id
                  WHERE rt.token_hash = :token_hash 
                  AND rt.revoked = 0 
                  AND rt.expires_at > NOW()";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":token_hash", $token_hash);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            // Verificar se o token existe mas está revogado ou expirado
            $check_query = "SELECT rt.*, u.email FROM refresh_tokens rt 
                           LEFT JOIN users u ON rt.user_id = u.id 
                           WHERE rt.token_hash = :token_hash";
            $check_stmt = $db->prepare($check_query);
            $check_stmt->bindParam(":token_hash", $token_hash);
            $check_stmt->execute();
            
            if ($check_stmt->rowCount() > 0) {
                $token_info = $check_stmt->fetch(PDO::FETCH_ASSOC);
                $reason = $token_info['revoked'] ? 'revoked' : 'expired';
                $details = "Token $reason | User: " . ($token_info['email'] ?? 'unknown') . " | IP: $ip";
                $securityLogger->logSecurityEvent('invalid_refresh_token', $ip, $token_info['user_id'], $details);
                error_log("[Refresh] Token $reason | User: {$token_info['email']} | IP: $ip");
            } else {
                $securityLogger->logSecurityEvent('invalid_refresh_token', $ip, null, 'Token not found in database | IP: ' . $ip);
                error_log("[Refresh] Token not found in database | IP: $ip | Hash: " . substr($token_hash, 0, 16) . "...");
            }
            
            http_response_code(401);
            echo json_encode(array("error" => "Refresh token inválido ou expirado"));
            exit();
        }
        
        $token_data = $stmt->fetch(PDO::FETCH_ASSOC);
        error_log("[Refresh] Valid token found | User: {$token_data['email']} | IP: $ip");
        
        // Verificar se o token foi potencialmente reutilizado (segurança extra)
        // Se quiser implementar Refresh Token Rotation, revogar o token atual aqui
        
        // Gerar novo access token
        $new_access_token = $jwt->createAccessToken(
            $token_data['user_id'], 
            $token_data['email'], 
            $token_data['role']
        );
        
        $securityLogger->logSecurityEvent('token_refreshed', $ip, $token_data['user_id'], $token_data['email']);
        error_log("[Refresh] Token refreshed successfully | User: {$token_data['email']} | IP: $ip");
        
        http_response_code(200);
        echo json_encode(array(
            "access_token" => $new_access_token,
            "user" => array(
                "id" => $token_data['user_id'],
                "email" => $token_data['email'],
                "full_name" => $token_data['full_name'],
                "role" => $token_data['role']
            )
        ));
        
    } catch (Exception $e) {
        $securityLogger->logSecurityEvent('refresh_token_error', $ip, null, $e->getMessage());
        error_log("[Refresh] Exception: {$e->getMessage()} | IP: $ip");
        http_response_code(500);
        echo json_encode(array("error" => "Erro ao renovar token"));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>
