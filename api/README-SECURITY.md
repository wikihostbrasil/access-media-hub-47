# Configurações de Segurança - Ambiente de Produção

## 1. Configuração do Ambiente

### Arquivo .env
Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

### Variáveis Obrigatórias:
- `JWT_SECRET`: Chave de 256 bits para JWT (gere uma segura)
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`: Configurações do banco
- `API_BASE_URL`: URL base da API em produção
- `ENVIRONMENT=production`

## 2. Gerar Chave JWT Segura

```bash
# Gerar chave de 256 bits
openssl rand -hex 32
```

## 3. Configuração do Servidor Web

### Apache (.htaccess)
```apache
# Headers de Segurança
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# HTTPS Redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Rate Limiting (se disponível mod_rewrite)
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api/auth/login
RewriteCond %{REMOTE_ADDR} ^(.*)$
RewriteRule ^(.*)$ - [E=IP:%1]
```

### Nginx
```nginx
# Headers de Segurança
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Rate Limiting
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

location /api/auth/login {
    limit_req zone=login burst=5 nodelay;
    try_files $uri $uri/ /index.php?$query_string;
}

# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
```

## 4. Configuração do Banco de Dados

### Permissões de Usuário
```sql
-- Criar usuário específico para a aplicação
CREATE USER 'arquivo_app'@'localhost' IDENTIFIED BY 'senha_super_segura';
GRANT SELECT, INSERT, UPDATE, DELETE ON arquivo_manager.* TO 'arquivo_app'@'localhost';
FLUSH PRIVILEGES;
```

### Backup Automático
```bash
# Adicionar ao crontab para backup diário
0 2 * * * mysqldump -u arquivo_app -p arquivo_manager > /backup/arquivo_manager_$(date +\%Y\%m\%d).sql
```

## 5. Verificações de Segurança

### Checklist Pré-Produção:
- [ ] JWT_SECRET configurado com chave de 256 bits
- [ ] HTTPS configurado e funcionando
- [ ] Headers de segurança ativos
- [ ] Rate limiting configurado
- [ ] Logs de segurança funcionando
- [ ] Validação de arquivos ativa
- [ ] Backup automático configurado
- [ ] Usuário do banco com permissões mínimas
- [ ] Arquivos .env protegidos (não acessíveis via web)
- [ ] Diretório de uploads protegido

### Testes de Segurança:
1. Testar rate limiting (5 tentativas de login)
2. Verificar headers de segurança com ferramentas online
3. Testar upload de arquivos maliciosos
4. Verificar logs de segurança
5. Testar acesso não autorizado aos endpoints

## 6. Monitoramento

### Logs a Monitorar:
- `security_logs`: Tentativas de acesso suspeitas
- `rate_limits`: Ataques de força bruta
- Logs do servidor web para erros 401/403
- Logs de upload de arquivos

### Alertas Recomendados:
- Mais de 10 tentativas de login falhadas em 1 hora
- Uploads de arquivos rejeitados
- Acessos com tokens inválidos
- Tentativas de acesso a endpoints protegidos

## 7. Atualizações

### Dependências PHP:
```bash
composer update --no-dev
```

### Verificar Vulnerabilidades:
```bash
composer audit
```

## 8. Contato de Emergência

Em caso de incidente de segurança:
1. Desativar a aplicação temporariamente
2. Verificar logs de segurança
3. Trocar JWT_SECRET se necessário
4. Investigar tentativas de acesso
5. Aplicar patches de segurança