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

// Different stats for different user roles
$user_id = $user_data['id'];

try {
    $currentDate = date('Y-m-d');
    
    if ($user_role === 'user') {
        // User-specific stats - only files they can access
        $files_query = "SELECT COUNT(DISTINCT f.id) as total 
                        FROM files f 
                        LEFT JOIN file_permissions fp ON f.id = fp.file_id 
                        LEFT JOIN user_groups ug ON fp.group_id = ug.group_id AND ug.user_id = :user_id
                        LEFT JOIN user_categories uc ON fp.category_id = uc.category_id AND uc.user_id = :user_id
                        WHERE f.deleted_at IS NULL 
                        AND f.status = 'active'
                        AND (f.uploaded_by = :user_id OR fp.user_id = :user_id OR ug.user_id IS NOT NULL OR uc.user_id IS NOT NULL)
                        AND (f.is_permanent = 1 OR 
                             (f.start_date IS NULL OR f.start_date <= :current_date) AND 
                             (f.end_date IS NULL OR f.end_date >= :current_date))";
        $files_stmt = $db->prepare($files_query);
        $files_stmt->bindParam(":user_id", $user_id);
        $files_stmt->bindParam(":current_date", $currentDate);
        $files_stmt->execute();
        $total_files = $files_stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // User's downloads only
        $downloads_query = "SELECT COUNT(*) as total FROM downloads WHERE user_id = :user_id";
        $downloads_stmt = $db->prepare($downloads_query);
        $downloads_stmt->bindParam(":user_id", $user_id);
        $downloads_stmt->execute();
        $total_downloads = $downloads_stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Get recent files for this user (last 3 new files available to them)
        $recent_files_query = "SELECT DISTINCT f.id, f.title, f.created_at
                               FROM files f 
                               LEFT JOIN file_permissions fp ON f.id = fp.file_id 
                               LEFT JOIN user_groups ug ON fp.group_id = ug.group_id AND ug.user_id = :user_id
                               LEFT JOIN user_categories uc ON fp.category_id = uc.category_id AND uc.user_id = :user_id
                               WHERE f.deleted_at IS NULL 
                               AND f.status = 'active'
                               AND (f.uploaded_by = :user_id OR fp.user_id = :user_id OR ug.user_id IS NOT NULL OR uc.user_id IS NOT NULL)
                               AND (f.is_permanent = 1 OR 
                                    (f.start_date IS NULL OR f.start_date <= :current_date) AND 
                                    (f.end_date IS NULL OR f.end_date >= :current_date))
                               ORDER BY f.created_at DESC 
                               LIMIT 3";
        $recent_files_stmt = $db->prepare($recent_files_query);
        $recent_files_stmt->bindParam(":user_id", $user_id);
        $recent_files_stmt->bindParam(":current_date", $currentDate);
        $recent_files_stmt->execute();
        $recent_files = $recent_files_stmt->fetchAll(PDO::FETCH_ASSOC);

        $stats = array(
            "total_files" => (int)$total_files,
            "total_downloads" => (int)$total_downloads,
            "recent_files" => $recent_files
        );
    } else {
        // Admin/Operator stats - full system stats
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
    }

    http_response_code(200);
    echo json_encode($stats);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => "Erro ao buscar estatísticas"));
}
?>