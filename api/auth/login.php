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
    
    // Rate limiting para login
    if (!$rateLimiter->checkLimit($ip, 'login', 5, 300)) {
        $securityLogger->logSecurityEvent('rate_limit_exceeded', $ip, null, 'Login attempts');
        http_response_code(429);
        echo json_encode(array("error" => "Muitas tentativas de login. Tente novamente em 5 minutos."));
        exit();
    }
    
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
                $token = $jwt->createToken($user['user_id'], $user['email'], $user['role']);
                
                http_response_code(200);
                echo json_encode(array(
                    "user" => array(
                        "id" => $user['user_id'],
                        "email" => $user['email'],
                        "full_name" => $user['full_name'],
                        "role" => $user['role']
                    ),
                    "access_token" => $token
                ));
            } else {
                $securityLogger->logSecurityEvent('failed_login', $ip, $user['user_id'], 'Wrong password: ' . $user['email']);
                http_response_code(401);
                echo json_encode(array("error" => "Credenciais inválidas"));
            }
        } else {
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