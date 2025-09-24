<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/jwt.php';
include_once '../config/security.php';

SecurityHeaders::setHeaders();

$database = new Database();
$db = $database->getConnection();
$jwt = new JWTHandler();

// Validate JWT token
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

if (!$jwt->validateToken($token)) {
    http_response_code(401);
    echo json_encode(array("error" => "Token inválido"));
    exit();
}

$decoded = $jwt->validateToken($token);
$userId = $decoded['id'];

// Get user role
$roleQuery = "SELECT role FROM profiles WHERE user_id = ?";
$roleStmt = $db->prepare($roleQuery);
$roleStmt->execute([$userId]);
$userRole = $roleStmt->fetchColumn();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $fileId = $_GET['file_id'] ?? '';
        
        if (empty($fileId)) {
            http_response_code(400);
            echo json_encode(array("error" => "ID do arquivo é obrigatório"));
            exit();
        }

        // Check if file exists and user has permission to view
        $checkQuery = "SELECT id, uploaded_by FROM files WHERE id = ? AND deleted_at IS NULL";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([$fileId]);
        $file = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$file) {
            http_response_code(404);
            echo json_encode(array("error" => "Arquivo não encontrado"));
            exit();
        }

        // Only admin or file uploader can view permissions
        if ($userRole !== 'admin' && $file['uploaded_by'] !== $userId) {
            http_response_code(403);
            echo json_encode(array("error" => "Acesso negado"));
            exit();
        }

        // Get file permissions
        $permQuery = "SELECT user_id, group_id, category_id FROM file_permissions WHERE file_id = ?";
        $permStmt = $db->prepare($permQuery);
        $permStmt->execute([$fileId]);
        $permissions = $permStmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(array("data" => $permissions));

    } catch (Exception $e) {
        error_log("Error getting file permissions: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(array("error" => "Erro interno do servidor"));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>