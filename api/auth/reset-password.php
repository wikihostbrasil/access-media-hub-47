<?php
include_once '../config/cors.php';
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['token']) || !isset($data['password']) || empty(trim($data['token'])) || empty(trim($data['password']))) {
        http_response_code(400);
        echo json_encode(array("error" => "Token e nova senha são obrigatórios"));
        exit();
    }

    $token = trim($data['token']);
    $new_password = trim($data['password']);

    try {
        // Check if token is valid and not expired
        $query = "SELECT id, email, reset_token_expires FROM users WHERE reset_token = :token";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":token", $token);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(400);
            echo json_encode(array("error" => "Token inválido"));
            exit();
        }
        
        // Check if token is expired
        if (strtotime($user['reset_token_expires']) < time()) {
            http_response_code(400);
            echo json_encode(array("error" => "Token expirado"));
            exit();
        }
        
        // Update password and clear reset token
        $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
        $update_query = "UPDATE users SET password_hash = :password, reset_token = NULL, reset_token_expires = NULL WHERE id = :id";
        $update_stmt = $db->prepare($update_query);
        $update_stmt->bindParam(":password", $hashed_password);
        $update_stmt->bindParam(":id", $user['id']);
        $update_stmt->execute();
        
        http_response_code(200);
        echo json_encode(array("message" => "Senha atualizada com sucesso"));
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => "Erro interno do servidor: " . $e->getMessage()));
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Show reset password form
    $token = $_GET['token'] ?? '';
    
    if (empty($token)) {
        http_response_code(400);
        echo "Token inválido";
        exit();
    }
    
    try {
        // Check if token is valid and not expired
        $query = "SELECT reset_token_expires FROM users WHERE reset_token = :token";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":token", $token);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || strtotime($user['reset_token_expires']) < time()) {
            echo "<!DOCTYPE html>
            <html>
            <head><title>Link Expirado</title></head>
            <body style='font-family: Arial, sans-serif; text-align: center; padding: 50px;'>
                <h1>Link Expirado</h1>
                <p>Este link de recuperação de senha expirou ou é inválido.</p>
                <p>Solicite uma nova recuperação de senha.</p>
            </body>
            </html>";
            exit();
        }
        
        // Show password reset form
        echo "<!DOCTYPE html>
        <html>
        <head>
            <title>Redefinir Senha</title>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
                .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .form-group { margin-bottom: 20px; }
                label { display: block; margin-bottom: 5px; font-weight: bold; }
                input[type='password'] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
                button { background: #3b82f6; color: white; padding: 12px 20px; border: none; border-radius: 4px; cursor: pointer; width: 100%; font-size: 16px; }
                button:hover { background: #2563eb; }
                .error { color: red; margin-top: 10px; }
                .success { color: green; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <h1>Redefinir Senha</h1>
                <form id='resetForm'>
                    <div class='form-group'>
                        <label for='password'>Nova Senha:</label>
                        <input type='password' id='password' required minlength='6'>
                    </div>
                    <div class='form-group'>
                        <label for='confirmPassword'>Confirmar Senha:</label>
                        <input type='password' id='confirmPassword' required minlength='6'>
                    </div>
                    <button type='submit'>Redefinir Senha</button>
                    <div id='message'></div>
                </form>
            </div>
            <script>
                document.getElementById('resetForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const password = document.getElementById('password').value;
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    const messageDiv = document.getElementById('message');
                    
                    if (password !== confirmPassword) {
                        messageDiv.innerHTML = '<div class=\"error\">As senhas não conferem</div>';
                        return;
                    }
                    
                    try {
                        const response = await fetch(window.location.pathname, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token: '" . htmlspecialchars($token) . "', password: password })
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                            messageDiv.innerHTML = '<div class=\"success\">' + data.message + '</div>';
                            document.getElementById('resetForm').style.display = 'none';
                        } else {
                            messageDiv.innerHTML = '<div class=\"error\">' + data.error + '</div>';
                        }
                    } catch (error) {
                        messageDiv.innerHTML = '<div class=\"error\">Erro ao conectar com o servidor</div>';
                    }
                });
            </script>
        </body>
        </html>";
        
    } catch (Exception $e) {
        http_response_code(500);
        echo "Erro interno do servidor";
    }
} else {
    http_response_code(405);
    echo json_encode(array("error" => "Método não permitido"));
}
?>