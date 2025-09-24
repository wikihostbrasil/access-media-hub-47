<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/jwt.php';
include_once '../config/security.php';
include_once '../config/environment.php';

SecurityHeaders::setHeaders();

$database = new Database();
$db = $database->getConnection();
$jwt = new JWTHandler();
$securityLogger = new SecurityLogger($db);

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

// Validate token
$token = $jwt->getBearerToken();
if (!$token) {
    http_response_code(401);
    echo json_encode(array("error" => "Token não fornecido"));
    exit();
}

$user_data = $jwt->validateToken($token);
if (!$user_data) {
    $securityLogger->logSecurityEvent('invalid_token', $ip, null, 'File upload attempt');
    http_response_code(401);
    echo json_encode(array("error" => "Token inválido"));
    exit();
}

$user_id = $user_data['id'];
$user_role = $user_data['role'];

// Check if user can upload files
if ($user_role === 'user') {
    http_response_code(403);
    echo json_encode(array("error" => "Acesso negado"));
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(array("error" => "Nenhum arquivo enviado"));
        exit();
    }
    
    // Validate file
    $validationErrors = FileValidator::validateFile($_FILES['file']);
    if (!empty($validationErrors)) {
        $securityLogger->logSecurityEvent('invalid_file_upload', $ip, $user_data['id'], implode(', ', $validationErrors));
        http_response_code(400);
        echo json_encode(array("error" => "Arquivo inválido", "details" => $validationErrors));
        exit();
    }

    $file = $_FILES['file'];
    $title = $_POST['title'] ?? '';
    $description = $_POST['description'] ?? '';
    $startDate = !empty($_POST['start_date']) ? $_POST['start_date'] : null;
    $endDate = !empty($_POST['end_date']) ? $_POST['end_date'] : null;
    $isPermanent = isset($_POST['is_permanent']) && $_POST['is_permanent'] === '1';
    $permissions = json_decode($_POST['permissions'] ?? '[]', true);

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

    if (empty($title)) {
        http_response_code(400);
        echo json_encode(array("error" => "Título é obrigatório"));
        exit();
    }

    // Upload directory
    $upload_dir = '../../uploads/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $file_name = uniqid() . '.' . $file_extension;
    $file_path = $upload_dir . $file_name;

    if (move_uploaded_file($file['tmp_name'], $file_path)) {
        try {
            $db->beginTransaction();

            // Insert file record
            $file_id = bin2hex(random_bytes(16));
            $file_url = 'uploads/' . $file_name;
            
            $query = "INSERT INTO files (id, title, description, file_url, file_type, file_size, uploaded_by, start_date, end_date, is_permanent, created_at) 
                      VALUES (:id, :title, :description, :file_url, :file_type, :file_size, :uploaded_by, :start_date, :end_date, :is_permanent, NOW())";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $file_id);
            $stmt->bindParam(":title", $title);
            $stmt->bindParam(":description", $description);
            $stmt->bindParam(":file_url", $file_url);
            $stmt->bindParam(":file_type", $file['type']);
            $stmt->bindParam(":file_size", $file['size']);
            $stmt->bindParam(":uploaded_by", $user_id);
            $stmt->bindParam(":start_date", $startDate);
            $stmt->bindParam(":end_date", $endDate);
            $stmt->bindValue(":is_permanent", $isPermanent ? 1 : 0);
            $stmt->execute();

            // Insert permissions
            if (!empty($permissions)) {
                $perm_query = "INSERT INTO file_permissions (id, file_id, user_id, group_id, category_id, created_at) 
                               VALUES (:id, :file_id, :user_id, :group_id, :category_id, NOW())";
                $perm_stmt = $db->prepare($perm_query);

                foreach ($permissions as $permission) {
                    $perm_id = bin2hex(random_bytes(16));
                    $perm_stmt->bindParam(":id", $perm_id);
                    $perm_stmt->bindParam(":file_id", $file_id);
                    $perm_stmt->bindValue(":user_id", $permission['user_id'] ?? null);
                    $perm_stmt->bindValue(":group_id", $permission['group_id'] ?? null);
                    $perm_stmt->bindValue(":category_id", $permission['category_id'] ?? null);
                    $perm_stmt->execute();
                }
            }

            $db->commit();

            // Send email notifications to users who have access to this file
            require_once '../config/email.php';
            $emailService = new EmailService();
            
            // Get uploader name
            $uploader_query = "SELECT full_name FROM profiles WHERE user_id = :user_id";
            $uploader_stmt = $db->prepare($uploader_query);
            $uploader_stmt->bindParam(":user_id", $user_id);
            $uploader_stmt->execute();
            $uploader_data = $uploader_stmt->fetch(PDO::FETCH_ASSOC);
            $uploaded_by_name = $uploader_data ? $uploader_data['full_name'] : 'Sistema';
            
            // Get users who should receive notifications
            $notification_users = [];
            
            if (!empty($permissions)) {
                foreach ($permissions as $permission) {
                    if (!empty($permission['user_id'])) {
                        // Direct user permission
                        $user_query = "SELECT u.email, p.full_name, p.receive_notifications 
                                      FROM users u 
                                      JOIN profiles p ON u.id = p.user_id 
                                      WHERE u.id = :user_id AND p.receive_notifications = 1";
                        $user_stmt = $db->prepare($user_query);
                        $user_stmt->bindParam(":user_id", $permission['user_id']);
                        $user_stmt->execute();
                        while ($user = $user_stmt->fetch(PDO::FETCH_ASSOC)) {
                            $notification_users[$user['email']] = $user['full_name'];
                        }
                    }
                    
                    if (!empty($permission['group_id'])) {
                        // Group permission
                        $group_users_query = "SELECT DISTINCT u.email, p.full_name 
                                             FROM users u 
                                             JOIN profiles p ON u.id = p.user_id 
                                             JOIN user_groups ug ON u.id = ug.user_id 
                                             WHERE ug.group_id = :group_id AND p.receive_notifications = 1";
                        $group_stmt = $db->prepare($group_users_query);
                        $group_stmt->bindParam(":group_id", $permission['group_id']);
                        $group_stmt->execute();
                        while ($user = $group_stmt->fetch(PDO::FETCH_ASSOC)) {
                            $notification_users[$user['email']] = $user['full_name'];
                        }
                    }
                    
                    if (!empty($permission['category_id'])) {
                        // Category permission - notify all users for now (you can customize this logic)
                        $cat_users_query = "SELECT u.email, p.full_name 
                                           FROM users u 
                                           JOIN profiles p ON u.id = p.user_id 
                                           WHERE p.receive_notifications = 1 AND p.role IN ('admin', 'operator', 'user')";
                        $cat_stmt = $db->prepare($cat_users_query);
                        $cat_stmt->execute();
                        while ($user = $cat_stmt->fetch(PDO::FETCH_ASSOC)) {
                            $notification_users[$user['email']] = $user['full_name'];
                        }
                    }
                }
            }
            
            // Get categories for this file (if any)
            $categories = [];
            foreach ($permissions as $permission) {
                if (!empty($permission['category_id'])) {
                    $cat_query = "SELECT name FROM categories WHERE id = :category_id";
                    $cat_stmt = $db->prepare($cat_query);
                    $cat_stmt->bindParam(":category_id", $permission['category_id']);
                    $cat_stmt->execute();
                    $cat_data = $cat_stmt->fetch(PDO::FETCH_ASSOC);
                    if ($cat_data) {
                        $categories[] = $cat_data['name'];
                    }
                }
            }
            
            // Send notifications
            foreach ($notification_users as $email => $name) {
                if ($email !== $user_data['email']) { // Don't send notification to uploader
                    $emailSent = $emailService->sendFileNotification($email, $name, $title, $uploaded_by_name, $categories);
                    if ($emailSent) {
                        error_log("File notification sent to: $email");
                    } else {
                        error_log("Failed to send file notification to: $email");
                    }
                }
            }

            http_response_code(201);
            echo json_encode(array("message" => "Arquivo enviado com sucesso", "file_id" => $file_id));
        } catch (Exception $e) {
            $db->rollback();
            unlink($file_path); // Remove uploaded file on error
            http_response_code(500);
            echo json_encode(array("error" => "Erro ao salvar arquivo"));
        }
    } else {
        http_response_code(500);
        echo json_encode(array("error" => "Erro ao fazer upload do arquivo"));
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>