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

$user_id = $user_data['id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['file_id'])) {
        http_response_code(400);
        echo json_encode(array("error" => "file_id é obrigatório"));
        exit();
    }

    $file_id = $data['file_id'];

    try {
        $id = bin2hex(random_bytes(16));
        $query = "INSERT INTO plays (id, user_id, file_id, played_at) VALUES (:id, :user_id, :file_id, NOW())";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":file_id", $file_id);
        $stmt->execute();

        http_response_code(201);
        echo json_encode(array("message" => "Play registrado com sucesso"));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => "Erro ao registrar play"));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>