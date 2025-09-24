<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/jwt.php';

$database = new Database();
$db = $database->getConnection();
$jwt = new JWTHandler();

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

$user_role = $user_data['role'];

// Check permissions - only admin and operator can view downloads
if ($user_role === 'user') {
    http_response_code(403);
    echo json_encode(array("error" => "Acesso negado"));
    exit();
}

try {
    $query = "SELECT d.*, f.title as file_title, f.file_url, f.file_size, f.file_type, p.full_name as user_name
              FROM downloads d 
              LEFT JOIN files f ON d.file_id = f.id 
              LEFT JOIN profiles p ON d.user_id = p.user_id 
              ORDER BY d.downloaded_at DESC 
              LIMIT 100";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $downloads = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($downloads);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => "Erro ao buscar downloads"));
}
?>