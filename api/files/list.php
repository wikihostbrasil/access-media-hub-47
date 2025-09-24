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

try {
    $currentDate = date('Y-m-d');
    
    if ($user_role === 'admin') {
        // Admin can see all files (including expired ones)
        $query = "SELECT f.*, p.full_name as uploaded_by_name 
                  FROM files f 
                  LEFT JOIN profiles p ON f.uploaded_by = p.user_id 
                  WHERE f.deleted_at IS NULL 
                  ORDER BY f.created_at DESC";
        $stmt = $db->prepare($query);
    } else {
        // Users can only see files they have permission to access and that are within validity period
        $query = "SELECT DISTINCT f.*, p.full_name as uploaded_by_name 
                  FROM files f 
                  LEFT JOIN profiles p ON f.uploaded_by = p.user_id 
                  LEFT JOIN file_permissions fp ON f.id = fp.file_id 
                  LEFT JOIN user_groups ug ON fp.group_id = ug.group_id AND ug.user_id = :user_id
                  LEFT JOIN user_categories uc ON fp.category_id = uc.category_id AND uc.user_id = :user_id
                  WHERE f.deleted_at IS NULL 
                  AND f.status = 'active'
                  AND (f.uploaded_by = :user_id OR fp.user_id = :user_id OR ug.user_id IS NOT NULL OR uc.user_id IS NOT NULL)
                  AND (f.is_permanent = 1 OR 
                       (f.start_date IS NULL OR f.start_date <= :current_date) AND 
                       (f.end_date IS NULL OR f.end_date >= :current_date))
                  ORDER BY f.created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":current_date", $currentDate);
    }
    
    $stmt->execute();
    $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($files);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => "Erro ao buscar arquivos"));
}
?>