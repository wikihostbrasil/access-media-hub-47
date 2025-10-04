<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/jwt.php';
include_once '../config/security.php';
include_once '../config/environment.php';

SecurityHeaders::setHeaders();

$database = new Database();
$db = $database->getConnection();
$jwt = new JWTHandler();
$rateLimiter = new RateLimiter($db);
$securityLogger = new SecurityLogger($db);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['email']) || !isset($data['password'])) {
        $securityLogger->logSecurityEvent('invalid_login_attempt', $ip, null, 'Missing credentials');
        http_response_code(400);
        echo json_encode(array("error" => "Email e senha são obrigatórios"));
        exit();
    }

    $email = $data['email'];
    $password = $data['password'];

    try {
        $query = "SELECT p.*, u.email, u.password_hash FROM profiles p 
                  JOIN users u ON p.user_id = u.id 
                  WHERE u.email = :email AND p.active = 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (password_verify($password, $user['password_hash'])) {
                $securityLogger->logSecurityEvent('successful_login', $ip, $user['user_id'], $user['email']);
                
                // Criar access token (curto - 15 min)
                $access_token = $jwt->createAccessToken($user['user_id'], $user['email'], $user['role']);
                
                // Criar refresh token (longo - 7 dias)
                $refresh_token = $jwt->createRefreshToken();
                $token_hash = hash('sha256', $refresh_token);
                $expires_at = date('Y-m-d H:i:s', time() + (7 * 24 * 60 * 60));
                
                // Armazenar refresh token no banco
                try {
                    $insert_query = "INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent) 
                                   VALUES (:user_id, :token_hash, :expires_at, :ip, :user_agent)";
                    $insert_stmt = $db->prepare($insert_query);
                    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
                    $insert_stmt->bindParam(":user_id", $user['user_id']);
                    $insert_stmt->bindParam(":token_hash", $token_hash);
                    $insert_stmt->bindParam(":expires_at", $expires_at);
                    $insert_stmt->bindParam(":ip", $ip);
                    $insert_stmt->bindParam(":user_agent", $user_agent);
                    $insert_stmt->execute();
                    $insert_success = $insert_stmt->rowCount() > 0;
                    if ($insert_success) {
                        error_log("[Login] Refresh token stored | User: {$user['email']} | Hash: " . substr($token_hash, 0, 16) . "...");
                    } else {
                        error_log("[Login] Insert refresh token returned 0 rows | User: {$user['email']}");
                    }
                } catch (Exception $e) {
                    error_log("[Login] Failed to store refresh token: " . $e->getMessage());
                }
                
                // Setar refresh token em cookie HttpOnly
                // Detectar HTTPS mesmo atrás de proxy (Cloudflare)
                $is_secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') 
                          || $_SERVER['SERVER_PORT'] == 443
                          || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
                
                // Extrair domínio raiz para subdomínios (ex: .domain.net)
                $host = $_SERVER['HTTP_HOST'] ?? '';
                $domain_parts = explode('.', $host);
                $cookie_domain = (count($domain_parts) >= 2) ? '.' . implode('.', array_slice($domain_parts, -2)) : '';
                
                $cookie_set = setcookie(
                    'refresh_token',
                    $refresh_token,
                    [
                        'expires' => time() + (7 * 24 * 60 * 60),
                        'path' => '/',
                        'domain' => $cookie_domain,
                        'secure' => $is_secure,
                        'httponly' => true,
                        'samesite' => 'Lax'
                    ]
                );
                
                error_log("Cookie set: " . ($cookie_set ? 'success' : 'failed') . " | Domain: $cookie_domain | Secure: " . ($is_secure ? 'yes' : 'no'));
                
                http_response_code(200);
                echo json_encode(array(
                    "user" => array(
                        "id" => $user['user_id'],
                        "email" => $user['email'],
                        "full_name" => $user['full_name'],
                        "role" => $user['role']
                    ),
                    "access_token" => $access_token
                    // refresh_token NÃO é enviado no JSON - apenas no cookie HttpOnly
                ));
            } else {
                // Rate limiting APENAS para senhas incorretas
                if (!$rateLimiter->checkLoginLimit($ip, 5, 300)) {
                    $securityLogger->logSecurityEvent('rate_limit_exceeded', $ip, null, 'Failed login attempts');
                    http_response_code(429);
                    echo json_encode(array("error" => "Muitas tentativas de login. Tente novamente em 5 minutos."));
                    exit();
                }
                
                $securityLogger->logSecurityEvent('failed_login', $ip, $user['user_id'], 'Wrong password: ' . $user['email']);
                http_response_code(401);
                echo json_encode(array("error" => "Credenciais inválidas"));
            }
        } else {
            // Rate limiting APENAS para usuários não encontrados (proteção contra enumeração)
            if (!$rateLimiter->checkLoginLimit($ip, 5, 300)) {
                $securityLogger->logSecurityEvent('rate_limit_exceeded', $ip, null, 'Failed login attempts');
                http_response_code(429);
                echo json_encode(array("error" => "Muitas tentativas de login. Tente novamente em 5 minutos."));
                exit();
            }
            
            $securityLogger->logSecurityEvent('failed_login', $ip, null, 'User not found: ' . $email);
            http_response_code(401);
            echo json_encode(array("error" => "Usuário não encontrado ou inativo"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => "Erro interno do servidor"));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>