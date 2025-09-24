<?php

class AuthSecurity {
    private $db;
    private $security_logger;
    
    public function __construct($db) {
        $this->db = $db;
        $this->security_logger = new SecurityLogger($db);
    }
    
    /**
     * Revalidate user role from database
     * Never trust JWT role for critical operations
     */
    public function revalidateUserRole($user_id) {
        $query = "SELECT p.active, p.role FROM users u 
                  LEFT JOIN profiles p ON u.id = p.user_id 
                  WHERE u.id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            $this->security_logger->logSecurityEvent('invalid_user_revalidation', $_SERVER['REMOTE_ADDR'], $user_id, "User ID not found during revalidation");
            return null;
        }
        
        if (!$user['active']) {
            $this->security_logger->logSecurityEvent('inactive_user_access', $_SERVER['REMOTE_ADDR'], $user_id, "Inactive user attempted access");
            return null;
        }
        
        return $user['role'];
    }
    
    /**
     * Check if user has admin privileges
     */
    public function requireAdmin($user_id, $action = 'admin_action') {
        $role = $this->revalidateUserRole($user_id);
        
        if ($role !== 'admin') {
            $this->security_logger->logSecurityEvent('unauthorized_admin_access', $_SERVER['REMOTE_ADDR'], $user_id, "Attempted: $action");
            
            http_response_code(403);
            echo json_encode(array("error" => "Acesso negado - privilégios de administrador necessários"));
            exit();
        }
        
        return true;
    }
    
    /**
     * Check if user can modify resource (admin or owner)
     */
    public function canModifyResource($user_id, $resource_owner, $action = 'modify_resource') {
        $role = $this->revalidateUserRole($user_id);
        
        if ($role === 'admin') {
            return true;
        }
        
        if ($user_id === $resource_owner) {
            return true;
        }
        
        $this->security_logger->logSecurityEvent('unauthorized_resource_access', $_SERVER['REMOTE_ADDR'], $user_id, "Attempted: $action, Owner: $resource_owner");
        
        http_response_code(403);
        echo json_encode(array("error" => "Sem permissão para executar esta ação"));
        exit();
    }
    
    /**
     * Enhanced rate limiting for critical operations
     */
    public function checkCriticalRateLimit($user_id, $action, $max_attempts = 3, $time_window = 300) {
        $rate_limiter = new RateLimiter($this->db);
        $ip = $_SERVER['REMOTE_ADDR'];
        
        // Check both IP and user-based rate limiting
        if (!$rate_limiter->checkLimit($ip, "critical_$action", $max_attempts, $time_window)) {
            $this->security_logger->logSecurityEvent('rate_limit_exceeded', $ip, $user_id, "Action: $action");
            
            http_response_code(429);
            echo json_encode(array("error" => "Muitas tentativas. Tente novamente em alguns minutos"));
            exit();
        }
        
        return true;
    }
}

?>