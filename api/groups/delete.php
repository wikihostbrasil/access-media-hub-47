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

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $group_id = $_GET['id'] ?? null;
    
    if (!$group_id) {
        http_response_code(400);
        echo json_encode(array("error" => "ID do grupo é obrigatório"));
        exit();
    }

    try {
        // Check if user has permission to delete
        if ($user_role !== 'admin') {
            $check_query = "SELECT created_by FROM groups WHERE id = :group_id";
            $check_stmt = $db->prepare($check_query);
            $check_stmt->bindParam(":group_id", $group_id);
            $check_stmt->execute();
            
            $group = $check_stmt->fetch(PDO::FETCH_ASSOC);
            if (!$group || $group['created_by'] !== $user_id) {
                http_response_code(403);
                echo json_encode(array("error" => "Sem permissão para deletar este grupo"));
                exit();
            }
        }

        // Delete group
        $query = "DELETE FROM groups WHERE id = :group_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":group_id", $group_id);
        $stmt->execute();

        http_response_code(200);
        echo json_encode(array("message" => "Grupo deletado com sucesso"));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => "Erro ao deletar grupo"));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>