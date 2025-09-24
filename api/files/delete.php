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
    $file_id = $_GET['id'] ?? null;
    
    if (!$file_id) {
        http_response_code(400);
        echo json_encode(array("error" => "ID do arquivo é obrigatório"));
        exit();
    }

    try {
        // Check rate limiting for delete operations
        $auth_security->checkCriticalRateLimit($user_id, 'file_delete', 5, 300);
        
        // Get file info and check permissions
        $check_query = "SELECT uploaded_by FROM files WHERE id = :file_id AND deleted_at IS NULL";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(":file_id", $file_id);
        $check_stmt->execute();
        
        $file = $check_stmt->fetch(PDO::FETCH_ASSOC);
        if (!$file) {
            http_response_code(404);
            echo json_encode(array("error" => "Arquivo não encontrado"));
            exit();
        }
        
        // Check if user can modify this resource (admin or owner)
        $auth_security->canModifyResource($user_id, $file['uploaded_by'], 'delete_file');

        // Soft delete
        $query = "UPDATE files SET deleted_at = NOW() WHERE id = :file_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":file_id", $file_id);
        $stmt->execute();

        http_response_code(200);
        echo json_encode(array("message" => "Arquivo deletado com sucesso"));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => "Erro ao deletar arquivo"));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>