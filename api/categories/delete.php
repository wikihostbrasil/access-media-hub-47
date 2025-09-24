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

$user_id = $user_data['id'];
$user_role = $user_data['role'];

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $category_id = $_GET['id'] ?? null;
    
    if (!$category_id) {
        http_response_code(400);
        echo json_encode(array("error" => "ID da categoria é obrigatório"));
        exit();
    }

    try {
        // Check rate limiting for delete operations
        $auth_security->checkCriticalRateLimit($user_id, 'category_delete', 5, 300);
        
        // Get category info and check permissions
        $check_query = "SELECT created_by FROM categories WHERE id = :category_id";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(":category_id", $category_id);
        $check_stmt->execute();
        
        $category = $check_stmt->fetch(PDO::FETCH_ASSOC);
        if (!$category) {
            http_response_code(404);
            echo json_encode(array("error" => "Categoria não encontrada"));
            exit();
        }
        
        // Check if user can modify this resource (admin or owner)
        $auth_security->canModifyResource($user_id, $category['created_by'], 'delete_category');

        // Delete category
        $query = "DELETE FROM categories WHERE id = :category_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":category_id", $category_id);
        $stmt->execute();

        http_response_code(200);
        echo json_encode(array("message" => "Categoria deletada com sucesso"));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => "Erro ao deletar categoria"));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>