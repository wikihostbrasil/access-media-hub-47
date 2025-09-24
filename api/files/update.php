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

// Only non-users can update files
if ($userRole === 'user') {
    http_response_code(403);
    echo json_encode(array("error" => "Acesso negado"));
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['id']) || !isset($data['title'])) {
            http_response_code(400);
            echo json_encode(array("error" => "ID e título são obrigatórios"));
            exit();
        }

        $fileId = $data['id'];
        $title = trim($data['title']);
        $description = isset($data['description']) ? trim($data['description']) : null;
        $startDate = !empty($data['start_date']) ? $data['start_date'] : null;
        $endDate = !empty($data['end_date']) ? $data['end_date'] : null;
        $isPermanent = isset($data['is_permanent']) && $data['is_permanent'];
        $status = isset($data['status']) ? $data['status'] : 'active';
        $permissions = isset($data['permissions']) ? $data['permissions'] : [];

        // If permanent, clear dates
        if ($isPermanent) {
            $startDate = null;
            $endDate = null;
        }

        // Validate dates if provided
        if ($startDate && $endDate && strtotime($startDate) > strtotime($endDate)) {
            http_response_code(400);
            echo json_encode(array("error" => "Data de início deve ser anterior à data de fim"));
            exit();
        }

        // Check if file exists and user has permission to edit
        $checkQuery = "SELECT id FROM files WHERE id = ? AND deleted_at IS NULL";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([$fileId]);
        
        if ($checkStmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(array("error" => "Arquivo não encontrado"));
            exit();
        }

        // Update file
        $updateQuery = "UPDATE files SET 
                        title = ?, 
                        description = ?, 
                        start_date = ?, 
                        end_date = ?, 
                        is_permanent = ?, 
                        status = ?, 
                        updated_at = NOW() 
                        WHERE id = ?";
        
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->execute([
            $title,
            $description,
            $startDate,
            $endDate,
            $isPermanent ? 1 : 0,
            $status,
            $fileId
        ]);

        // Update permissions if provided
        if (!empty($permissions)) {
            // Delete existing permissions
            $deletePermQuery = "DELETE FROM file_permissions WHERE file_id = ?";
            $deletePermStmt = $db->prepare($deletePermQuery);
            $deletePermStmt->execute([$fileId]);
            
            // Insert new permissions
            $insertPermQuery = "INSERT INTO file_permissions (id, file_id, user_id, group_id, category_id, created_at) 
                               VALUES (:id, :file_id, :user_id, :group_id, :category_id, NOW())";
            $insertPermStmt = $db->prepare($insertPermQuery);
            
            foreach ($permissions as $permission) {
                $permId = bin2hex(random_bytes(16));
                $insertPermStmt->bindParam(":id", $permId);
                $insertPermStmt->bindParam(":file_id", $fileId);
                $insertPermStmt->bindValue(":user_id", $permission['user_id'] ?? null);
                $insertPermStmt->bindValue(":group_id", $permission['group_id'] ?? null);
                $insertPermStmt->bindValue(":category_id", $permission['category_id'] ?? null);
                $insertPermStmt->execute();
            }
        }

        if ($updateStmt->rowCount() > 0 || !empty($permissions)) {
            http_response_code(200);
            echo json_encode(array(
                "message" => "Arquivo atualizado com sucesso",
                "file_id" => $fileId
            ));
        } else {
            http_response_code(400);
            echo json_encode(array("error" => "Nenhuma alteração foi feita"));
        }

    } catch (Exception $e) {
        error_log("Error updating file: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(array("error" => "Erro interno do servidor"));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>