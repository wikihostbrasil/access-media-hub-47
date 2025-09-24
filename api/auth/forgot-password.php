<?php
include_once '../config/cors.php';
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Add columns if they don't exist
try {
    $db->exec("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL");
} catch (Exception $e) {
    // Column already exists
}

try {
    $db->exec("ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP NULL");
} catch (Exception $e) {
    // Column already exists
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['email']) || empty(trim($data['email']))) {
        http_response_code(400);
        echo json_encode(array("error" => "Email é obrigatório"));
        exit();
    }

    $email = trim($data['email']);

    try {
        // Check if user exists
        $query = "SELECT id FROM users WHERE email = :email";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            // Generate reset token
            $reset_token = bin2hex(random_bytes(32));
            $expires_at = date('Y-m-d H:i:s', time() + 3600); // 1 hour

            // Store reset token
            $update_query = "UPDATE users SET reset_token = :reset_token, reset_token_expires = :expires_at WHERE email = :email";
            $update_stmt = $db->prepare($update_query);
            $update_stmt->bindParam(":reset_token", $reset_token);
            $update_stmt->bindParam(":expires_at", $expires_at);
            $update_stmt->bindParam(":email", $email);
            $update_stmt->execute();

            // Get user full name for email
            $name_query = "SELECT p.full_name FROM profiles p JOIN users u ON p.user_id = u.id WHERE u.email = :email";
            $name_stmt = $db->prepare($name_query);
            $name_stmt->bindParam(":email", $email);
            $name_stmt->execute();
            $profile = $name_stmt->fetch(PDO::FETCH_ASSOC);
            $full_name = $profile ? $profile['full_name'] : 'Usuário';

            // Send password reset email
            require_once '../config/email.php';
            $emailService = new EmailService();
            $emailSent = $emailService->sendPasswordReset($email, $reset_token, $full_name);
            
            if ($emailSent) {
                error_log("Password reset email sent to: $email");
            } else {
                error_log("Failed to send password reset email to: $email");
            }

            http_response_code(200);
            echo json_encode(array("message" => "Se o email existir, um link de recuperação foi enviado"));
        } else {
            // Return same message for security (don't reveal if email exists)
            http_response_code(200);
            echo json_encode(array("message" => "Se o email existir, um link de recuperação foi enviado"));
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => "Erro interno do servidor: " . $e->getMessage()));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>