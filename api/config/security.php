<?php

class SecurityHeaders {
    public static function setHeaders() {
        // Security Headers
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
        
        // Content Security Policy
        $csp = "default-src 'self'; ";
        $csp .= "script-src 'self' 'unsafe-inline'; ";
        $csp .= "style-src 'self' 'unsafe-inline'; ";
        $csp .= "img-src 'self' data: blob:; ";
        $csp .= "font-src 'self'; ";
        $csp .= "connect-src 'self'; ";
        $csp .= "media-src 'self'; ";
        $csp .= "object-src 'none'; ";
        $csp .= "base-uri 'self'; ";
        $csp .= "form-action 'self';";
        
        header("Content-Security-Policy: $csp");
        
        // HTTPS Headers (when in production)
        if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
        }
    }
}

class RateLimiter {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    public function checkLimit($ip, $endpoint, $maxAttempts = 5, $timeWindow = 300) {
        // Limpar tentativas antigas
        $stmt = $this->db->prepare("DELETE FROM rate_limits WHERE endpoint = ? AND created_at < DATE_SUB(NOW(), INTERVAL ? SECOND)");
        $stmt->execute([$endpoint, $timeWindow]);
        
        // Contar tentativas atuais
        $stmt = $this->db->prepare("SELECT COUNT(*) as attempts FROM rate_limits WHERE ip = ? AND endpoint = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)");
        $stmt->execute([$ip, $endpoint, $timeWindow]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['attempts'] >= $maxAttempts) {
            return false;
        }
        
        // Registrar tentativa
        $stmt = $this->db->prepare("INSERT INTO rate_limits (ip, endpoint, created_at) VALUES (?, ?, NOW())");
        $stmt->execute([$ip, $endpoint]);
        
        return true;
    }
}

class SecurityLogger {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    public function logSecurityEvent($event_type, $ip, $user_id = null, $details = null) {
        $stmt = $this->db->prepare("INSERT INTO security_logs (event_type, ip_address, user_id, details, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([$event_type, $ip, $user_id, $details]);
    }
}

class FileValidator {
    private static $allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-rar-compressed',
        'audio/mpeg',
        'audio/wav',
        'video/mp4',
        'video/avi'
    ];
    
    private static $allowedExtensions = [
        'jpg', 'jpeg', 'png', 'gif', 'webp',
        'pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx',
        'zip', 'rar', 'mp3', 'wav', 'mp4', 'avi'
    ];
    
    private static $maxFileSize = 50 * 1024 * 1024; // 50MB
    
    public static function validateFile($file) {
        $errors = [];
        
        // Verificar se o arquivo foi enviado
        if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
            $errors[] = 'Erro no upload do arquivo';
            return $errors;
        }
        
        // Verificar tamanho
        if ($file['size'] > self::$maxFileSize) {
            $errors[] = 'Arquivo muito grande. Máximo permitido: ' . (self::$maxFileSize / 1024 / 1024) . 'MB';
        }
        
        // Verificar tipo MIME
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($mimeType, self::$allowedTypes)) {
            $errors[] = 'Tipo de arquivo não permitido: ' . $mimeType;
        }
        
        // Verificar extensão
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, self::$allowedExtensions)) {
            $errors[] = 'Extensão de arquivo não permitida: ' . $extension;
        }
        
        // Verificar se é realmente uma imagem (para arquivos de imagem)
        if (strpos($mimeType, 'image/') === 0) {
            $imageInfo = getimagesize($file['tmp_name']);
            if (!$imageInfo) {
                $errors[] = 'Arquivo de imagem corrompido';
            }
        }
        
        return $errors;
    }
}

?>