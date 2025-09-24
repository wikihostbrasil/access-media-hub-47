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

$user_role = $user_data['role'];

// Check permissions
if ($user_role === 'user') {
    http_response_code(403);
    echo json_encode(array("error" => "Acesso negado"));
    exit();
}

try {
    // Total files
    $files_query = "SELECT COUNT(*) as total FROM files WHERE deleted_at IS NULL";
    $files_stmt = $db->prepare($files_query);
    $files_stmt->execute();
    $total_files = $files_stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Total downloads
    $downloads_query = "SELECT COUNT(*) as total FROM downloads";
    $downloads_stmt = $db->prepare($downloads_query);
    $downloads_stmt->execute();
    $total_downloads = $downloads_stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Downloads today
    $downloads_today_query = "SELECT COUNT(*) as total FROM downloads WHERE DATE(downloaded_at) = CURDATE()";
    $downloads_today_stmt = $db->prepare($downloads_today_query);
    $downloads_today_stmt->execute();
    $downloads_today = $downloads_today_stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Unique users this month
    $users_month_query = "SELECT COUNT(DISTINCT user_id) as total FROM downloads WHERE MONTH(downloaded_at) = MONTH(CURDATE()) AND YEAR(downloaded_at) = YEAR(CURDATE())";
    $users_month_stmt = $db->prepare($users_month_query);
    $users_month_stmt->execute();
    $unique_users_month = $users_month_stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Total active users
    $active_users_query = "SELECT COUNT(*) as total FROM profiles WHERE active = 1";
    $active_users_stmt = $db->prepare($active_users_query);
    $active_users_stmt->execute();
    $active_users = $active_users_stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Recent downloads for chart
    $recent_downloads_query = "SELECT DATE(downloaded_at) as date, COUNT(*) as count 
                               FROM downloads 
                               WHERE downloaded_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                               GROUP BY DATE(downloaded_at) 
                               ORDER BY date ASC";
    $recent_downloads_stmt = $db->prepare($recent_downloads_query);
    $recent_downloads_stmt->execute();
    $recent_downloads = $recent_downloads_stmt->fetchAll(PDO::FETCH_ASSOC);

    $stats = array(
        "total_files" => (int)$total_files,
        "total_downloads" => (int)$total_downloads,
        "downloads_today" => (int)$downloads_today,
        "unique_users_month" => (int)$unique_users_month,
        "active_users" => (int)$active_users,
        "recent_downloads" => $recent_downloads
    );

    http_response_code(200);
    echo json_encode($stats);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => "Erro ao buscar estatísticas"));
}
?>