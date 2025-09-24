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
    if ($user_role === 'admin') {
        // Admin can see all categories
        $query = "SELECT c.*, p.full_name as created_by_name,
                  (SELECT COUNT(*) FROM file_permissions fp WHERE fp.category_id = c.id) as file_count
                  FROM categories c 
                  LEFT JOIN profiles p ON c.created_by = p.user_id 
                  ORDER BY c.created_at DESC";
        $stmt = $db->prepare($query);
    } else {
        // Users can only see categories they created or are part of
        $query = "SELECT DISTINCT c.*, p.full_name as created_by_name,
                  (SELECT COUNT(*) FROM file_permissions fp WHERE fp.category_id = c.id) as file_count
                  FROM categories c 
                  LEFT JOIN profiles p ON c.created_by = p.user_id 
                  LEFT JOIN user_categories uc ON c.id = uc.category_id 
                  WHERE c.created_by = :user_id OR uc.user_id = :user_id
                  ORDER BY c.created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
    }
    
    $stmt->execute();
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($categories);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => "Erro ao buscar categorias"));
}
?>