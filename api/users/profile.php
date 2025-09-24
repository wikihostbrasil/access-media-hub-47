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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user_id = $user_data['id'];
    
    try {
        $query = "SELECT p.*, u.email FROM profiles p 
                  JOIN users u ON p.user_id = u.id 
                  WHERE p.user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$profile) {
            http_response_code(404);
            echo json_encode(array("error" => "Perfil não encontrado"));
            exit();
        }

        http_response_code(200);
        echo json_encode($profile);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => "Erro ao buscar perfil"));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>