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
    
    // Ler refresh token do cookie
    if (!isset($_COOKIE['refresh_token'])) {
        http_response_code(401);
        echo json_encode(array("error" => "Refresh token não encontrado"));
        exit();
    }
    
    $refresh_token = $_COOKIE['refresh_token'];
    $token_hash = hash('sha256', $refresh_token);
    
    try {
        // Validar refresh token no banco
        $query = "SELECT rt.*, p.email, p.role, p.full_name 
                  FROM refresh_tokens rt
                  JOIN profiles p ON rt.user_id = p.user_id
                  WHERE rt.token_hash = :token_hash 
                  AND rt.revoked = 0 
                  AND rt.expires_at > NOW()";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":token_hash", $token_hash);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            $securityLogger->logSecurityEvent('invalid_refresh_token', $ip, null, 'Token not found or expired');
            http_response_code(401);
            echo json_encode(array("error" => "Refresh token inválido ou expirado"));
            exit();
        }
        
        $token_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Verificar se o token foi potencialmente reutilizado (segurança extra)
        // Se quiser implementar Refresh Token Rotation, revogar o token atual aqui
        
        // Gerar novo access token
        $new_access_token = $jwt->createAccessToken(
            $token_data['user_id'], 
            $token_data['email'], 
            $token_data['role']
        );
        
        $securityLogger->logSecurityEvent('token_refreshed', $ip, $token_data['user_id'], $token_data['email']);
        
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
        http_response_code(500);
        echo json_encode(array("error" => "Erro ao renovar token"));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>
