<?php

class Environment {
    public static function load() {
        // Configurações de ambiente
        $config = [
            'JWT_SECRET' => $_ENV['JWT_SECRET'] ?? 'arquivo_manager_jwt_secret_key_default',
            'API_BASE_URL' => $_ENV['API_BASE_URL'] ?? 'http://localhost/api',
            'UPLOAD_PATH' => $_ENV['UPLOAD_PATH'] ?? '../uploads/',
            'MAX_FILE_SIZE' => $_ENV['MAX_FILE_SIZE'] ?? 50 * 1024 * 1024, // 50MB
            'ENVIRONMENT' => $_ENV['ENVIRONMENT'] ?? 'development',
            'DB_HOST' => $_ENV['DB_HOST'] ?? 'localhost',
            'DB_NAME' => $_ENV['DB_NAME'] ?? 'arquivo_manager',
            'DB_USER' => $_ENV['DB_USER'] ?? 'root',
            'DB_PASS' => $_ENV['DB_PASS'] ?? '',
        ];
        
        // Definir variáveis de ambiente se não existirem
        foreach ($config as $key => $value) {
            if (!isset($_ENV[$key])) {
                $_ENV[$key] = $value;
            }
        }
        
        return $config;
    }
    
    public static function isProduction() {
        return ($_ENV['ENVIRONMENT'] ?? 'development') === 'production';
    }
    
    public static function isDevelopment() {
        return ($_ENV['ENVIRONMENT'] ?? 'development') === 'development';
    }
}

// Carregar configurações
Environment::load();

?>