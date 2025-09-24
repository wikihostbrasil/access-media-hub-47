<?php
include_once '../config/cors.php';
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['email']) || !isset($data['password']) || !isset($data['full_name'])) {
        http_response_code(400);
        echo json_encode(array("error" => "Email, senha e nome completo são obrigatórios"));
        exit();
    }

    $email = $data['email'];
    $password = password_hash($data['password'], PASSWORD_DEFAULT);
    $full_name = $data['full_name'];

    try {
        $db->beginTransaction();

        // Check if user already exists
        $check_query = "SELECT id FROM users WHERE email = :email";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(":email", $email);
        $check_stmt->execute();

        if ($check_stmt->rowCount() > 0) {
            http_response_code(409);
            echo json_encode(array("error" => "Usuário já existe"));
            exit();
        }

        // Create user
        $user_id = bin2hex(random_bytes(16));
        $user_query = "INSERT INTO users (id, email, password_hash, created_at) VALUES (:id, :email, :password, NOW())";
        $user_stmt = $db->prepare($user_query);
        $user_stmt->bindParam(":id", $user_id);
        $user_stmt->bindParam(":email", $email);
        $user_stmt->bindParam(":password", $password);
        $user_stmt->execute();

        // Create profile
        $profile_id = bin2hex(random_bytes(16));
        $profile_query = "INSERT INTO profiles (id, user_id, full_name, role, created_at) VALUES (:id, :user_id, :full_name, 'user', NOW())";
        $profile_stmt = $db->prepare($profile_query);
        $profile_stmt->bindParam(":id", $profile_id);
        $profile_stmt->bindParam(":user_id", $user_id);
        $profile_stmt->bindParam(":full_name", $full_name);
        $profile_stmt->execute();

        $db->commit();

        http_response_code(201);
        echo json_encode(array("message" => "Usuário criado com sucesso. Verifique seu email."));
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(array("error" => "Erro ao criar usuário"));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>