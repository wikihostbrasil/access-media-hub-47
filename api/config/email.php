<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once 'environment.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailService {
    private $mail;
    
    public function __construct() {
        $this->mail = new PHPMailer(true);
        
        try {
            // Server settings
            $this->mail->isSMTP();
            $this->mail->Host       = getenv('SMTP_HOST') ?: 'smtp.gmail.com';
            $this->mail->SMTPAuth   = true;
            $this->mail->Username   = getenv('SMTP_USER');
            $this->mail->Password   = getenv('SMTP_PASS');
            $this->mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $this->mail->Port       = getenv('SMTP_PORT') ?: 587;
            $this->mail->CharSet    = 'UTF-8';
            
            // Default sender
            $this->mail->setFrom(
                getenv('SMTP_FROM') ?: 'noreply@localhost', 
                'Download Manager'
            );
        } catch (Exception $e) {
            error_log("Email configuration error: " . $e->getMessage());
        }
    }
    
    public function sendPasswordReset($email, $resetToken, $fullName) {
        try {
            $this->mail->clearAddresses();
            $this->mail->addAddress($email, $fullName);
            
            $this->mail->isHTML(true);
            $this->mail->Subject = 'Recuperação de Senha - Download Manager';
            
            $resetLink = getenv('API_BASE_URL') . '/auth/reset-password?token=' . $resetToken;
            
            $this->mail->Body = $this->getPasswordResetTemplate($fullName, $resetLink);
            $this->mail->AltBody = "Olá $fullName,\n\nRecebemos uma solicitação para redefinir sua senha.\n\nClique no link abaixo para criar uma nova senha:\n$resetLink\n\nEste link expira em 1 hora.\n\nSe você não solicitou esta alteração, ignore este email.\n\nAtenciosamente,\nEquipe Download Manager";
            
            $this->mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Email send error: " . $e->getMessage());
            return false;
        }
    }
    
    public function sendWelcomeEmail($email, $fullName) {
        try {
            $this->mail->clearAddresses();
            $this->mail->addAddress($email, $fullName);
            
            $this->mail->isHTML(true);
            $this->mail->Subject = 'Bem-vindo ao Download Manager!';
            
            $loginLink = getenv('API_BASE_URL');
            
            $this->mail->Body = $this->getWelcomeTemplate($fullName, $loginLink);
            $this->mail->AltBody = "Olá $fullName,\n\nBem-vindo ao Download Manager!\n\nSua conta foi criada com sucesso. Você já pode fazer login e começar a usar o sistema.\n\nAcesse: $loginLink\n\nAtenciosamente,\nEquipe Download Manager";
            
            $this->mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Email send error: " . $e->getMessage());
            return false;
        }
    }
    
    public function sendFileNotification($email, $fullName, $fileName, $uploadedBy, $categories = []) {
        try {
            $this->mail->clearAddresses();
            $this->mail->addAddress($email, $fullName);
            
            $this->mail->isHTML(true);
            $this->mail->Subject = 'Novo arquivo disponível - Download Manager';
            
            $loginLink = getenv('API_BASE_URL');
            $categoriesText = !empty($categories) ? implode(', ', $categories) : 'Sem categoria';
            
            $this->mail->Body = $this->getFileNotificationTemplate($fullName, $fileName, $uploadedBy, $categoriesText, $loginLink);
            $this->mail->AltBody = "Olá $fullName,\n\nUm novo arquivo foi adicionado e está disponível para download:\n\nArquivo: $fileName\nAdicionado por: $uploadedBy\nCategorias: $categoriesText\n\nFaça login para acessar: $loginLink\n\nAtenciosamente,\nEquipe Download Manager";
            
            $this->mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Email send error: " . $e->getMessage());
            return false;
        }
    }
    
    private function getPasswordResetTemplate($fullName, $resetLink) {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Recuperação de Senha</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #3b82f6; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Download Manager</h1>
                </div>
                <div class='content'>
                    <h2>Olá, $fullName!</h2>
                    <p>Recebemos uma solicitação para redefinir sua senha do Download Manager.</p>
                    <p>Clique no botão abaixo para criar uma nova senha:</p>
                    <p style='text-align: center;'>
                        <a href='$resetLink' class='button'>Redefinir Senha</a>
                    </p>
                    <p><strong>Este link expira em 1 hora.</strong></p>
                    <p>Se você não solicitou esta alteração, pode ignorar este email com segurança.</p>
                </div>
                <div class='footer'>
                    <p>Atenciosamente,<br>Equipe Download Manager</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
    
    private function getWelcomeTemplate($fullName, $loginLink) {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Bem-vindo!</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #10b981; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🎉 Bem-vindo!</h1>
                </div>
                <div class='content'>
                    <h2>Olá, $fullName!</h2>
                    <p>Seja bem-vindo ao <strong>Download Manager</strong>!</p>
                    <p>Sua conta foi criada com sucesso e você já pode começar a usar o sistema para gerenciar e compartilhar arquivos.</p>
                    <p style='text-align: center;'>
                        <a href='$loginLink' class='button'>Fazer Login</a>
                    </p>
                    <p>Se tiver alguma dúvida, não hesite em entrar em contato conosco.</p>
                </div>
                <div class='footer'>
                    <p>Atenciosamente,<br>Equipe Download Manager</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
    
    private function getFileNotificationTemplate($fullName, $fileName, $uploadedBy, $categories, $loginLink) {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Novo arquivo disponível</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #8b5cf6; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
                .file-info { background: white; padding: 20px; border-left: 4px solid #8b5cf6; margin: 20px 0; border-radius: 4px; }
                .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>📁 Novo Arquivo</h1>
                </div>
                <div class='content'>
                    <h2>Olá, $fullName!</h2>
                    <p>Um novo arquivo foi adicionado ao sistema e está disponível para download:</p>
                    <div class='file-info'>
                        <p><strong>📄 Arquivo:</strong> $fileName</p>
                        <p><strong>👤 Adicionado por:</strong> $uploadedBy</p>
                        <p><strong>🏷️ Categorias:</strong> $categories</p>
                    </div>
                    <p style='text-align: center;'>
                        <a href='$loginLink' class='button'>Acessar Sistema</a>
                    </p>
                    <p>Faça login para visualizar e baixar o arquivo.</p>
                </div>
                <div class='footer'>
                    <p>Atenciosamente,<br>Equipe Download Manager</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
}
?>