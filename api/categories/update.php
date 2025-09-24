<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/jwt.php';
include_once '../config/security.php';
include_once '../config/auth-security.php';

$database = new Database();
$db = $database->getConnection();
$jwt = new JWTHandler();
$auth_security = new AuthSecurity($db);

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

// Check admin permissions
$auth_security->requireAdmin($user_data['id'], 'update_category');

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['id']) || !isset($data['name'])) {
        http_response_code(400);
        echo json_encode(array("error" => "ID e nome são obrigatórios"));
        exit();
    }

    $id = $data['id'];
    $name = trim($data['name']);
    $description = isset($data['description']) ? trim($data['description']) : null;

    try {
        $query = "UPDATE categories SET name = :name, description = :description, updated_at = NOW() WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":description", $description);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(array("error" => "Categoria não encontrada"));
            exit();
        }

        http_response_code(200);
        echo json_encode(array("message" => "Categoria atualizada com sucesso"));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => "Erro ao atualizar categoria"));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>