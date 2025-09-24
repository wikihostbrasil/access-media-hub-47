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
        // Admin can see all groups
        $query = "SELECT g.*, p.full_name as created_by_name,
                  (SELECT COUNT(*) FROM user_groups ug WHERE ug.group_id = g.id) as user_count
                  FROM groups g 
                  LEFT JOIN profiles p ON g.created_by = p.user_id 
                  ORDER BY g.created_at DESC";
        $stmt = $db->prepare($query);
    } else {
        // Users can only see groups they created or are part of
        $query = "SELECT DISTINCT g.*, p.full_name as created_by_name,
                  (SELECT COUNT(*) FROM user_groups ug WHERE ug.group_id = g.id) as user_count
                  FROM groups g 
                  LEFT JOIN profiles p ON g.created_by = p.user_id 
                  LEFT JOIN user_groups ug ON g.id = ug.group_id 
                  WHERE g.created_by = :user_id OR ug.user_id = :user_id
                  ORDER BY g.created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
    }
    
    $stmt->execute();
    $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($groups);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => "Erro ao buscar grupos"));
}
?>