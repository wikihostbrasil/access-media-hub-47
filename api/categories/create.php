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
$user_role = $user_data['role'];

// Check permissions
if ($user_role === 'user') {
    http_response_code(403);
    echo json_encode(array("error" => "Acesso negado"));
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['name']) || empty(trim($data['name']))) {
        http_response_code(400);
        echo json_encode(array("error" => "Nome é obrigatório"));
        exit();
    }

    $name = trim($data['name']);
    $description = isset($data['description']) ? trim($data['description']) : null;

    try {
        $id = bin2hex(random_bytes(16));
        $query = "INSERT INTO categories (id, name, description, created_by, created_at, updated_at) 
                  VALUES (:id, :name, :description, :created_by, NOW(), NOW())";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":description", $description);
        $stmt->bindParam(":created_by", $user_id);
        $stmt->execute();

        http_response_code(201);
        echo json_encode(array(
            "message" => "Categoria criada com sucesso",
            "id" => $id
        ));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => "Erro ao criar categoria"));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>