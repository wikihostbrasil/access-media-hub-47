<?php
require_once __DIR__ . '/../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTHandler {
    private $secret_key;
    private $issuer = "arquivo-manager";
    private $audience = "arquivo-manager-users";
    private $issued_at;
    private $expiration_time;

    public function __construct() {
        $this->secret_key = $_ENV['JWT_SECRET'] ?? 'arquivo_manager_jwt_secret_key_default';
        $this->issued_at = time();
        $this->expiration_time = $this->issued_at + (15 * 60); // 15 minutes for access token
    }

    // Access token (curta duração - 15 minutos)
    public function createAccessToken($user_id, $email, $role) {
        $payload = array(
            "iss" => $this->issuer,
            "aud" => $this->audience,
            "iat" => $this->issued_at,
            "exp" => $this->expiration_time,
            "data" => array(
                "id" => $user_id,
                "email" => $email,
                "role" => $role
            )
        );

        return JWT::encode($payload, $this->secret_key, 'HS256');
    }

    // Refresh token (longa duração - 7 dias)
    public function createRefreshToken() {
        return bin2hex(random_bytes(32));
    }

    // Legacy method - mantido para compatibilidade
    public function createToken($user_id, $email, $role) {
        return $this->createAccessToken($user_id, $email, $role);
    }

    public function validateToken($token) {
        try {
            $decoded = JWT::decode($token, new Key($this->secret_key, 'HS256'));
            return (array) $decoded->data;
        } catch (Exception $e) {
            return false;
        }
    }

    public function getBearerToken() {
        $headers = $this->getAuthorizationHeader();
        if (!empty($headers)) {
            if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }

    private function getAuthorizationHeader() {
        $headers = null;
        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER["Authorization"]);
        } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }
        return $headers;
    }
}
?>