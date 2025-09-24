# Migração para Backend PHP

## Instruções de Instalação

### 1. Configuração do Banco de Dados MySQL

Execute o script SQL no seu servidor MySQL:

```sql
-- Execute o conteúdo do arquivo database.sql
```

### 2. Configuração do Backend PHP

1. Copie a pasta `api/` para o seu servidor web
2. Instale as dependências PHP:

```bash
cd api
composer install
```

3. Configure o banco de dados editando `api/config/database.php`:
   - Altere `$host`, `$database_name`, `$username`, `$password`

4. Configure a chave JWT editando `api/config/jwt.php`:
   - Altere `$secret_key` para uma chave segura

### 3. Configuração do Frontend

1. Edite `src/lib/api.ts` e altere `API_BASE_URL` para o endereço do seu servidor:
```typescript
const API_BASE_URL = 'http://seu-servidor.com/api';
```

### 4. Estrutura de Arquivos PHP

```
api/
├── config/
│   ├── database.php    # Configuração do banco
│   ├── cors.php        # Headers CORS
│   └── jwt.php         # Autenticação JWT
├── auth/
│   ├── login.php       # Login de usuários
│   └── register.php    # Registro de usuários
├── files/
│   ├── list.php        # Listar arquivos
│   └── upload.php      # Upload de arquivos
├── users/
│   └── list.php        # Listar usuários
├── groups/
│   └── list.php        # Listar grupos
├── categories/
│   └── list.php        # Listar categorias
├── downloads/
│   └── record.php      # Registrar downloads
├── plays/
│   └── record.php      # Registrar plays
├── uploads/            # Diretório para arquivos
└── composer.json       # Dependências PHP
```

### 5. Usuário Padrão

- **Email:** admin@admin.com
- **Senha:** admin123
- **Tipo:** Administrador

### 6. APIs Disponíveis

#### Autenticação
- `POST /auth/login.php` - Login
- `POST /auth/register.php` - Registro

#### Arquivos
- `GET /files/list.php` - Listar arquivos
- `POST /files/upload.php` - Upload de arquivos

#### Usuários
- `GET /users/list.php` - Listar usuários

#### Grupos
- `GET /groups/list.php` - Listar grupos

#### Categorias
- `GET /categories/list.php` - Listar categorias

#### Logs
- `POST /downloads/record.php` - Registrar download
- `POST /plays/record.php` - Registrar play

### 7. Dependências

- PHP 7.4+
- MySQL 5.7+
- Composer
- firebase/php-jwt para autenticação JWT

### 8. Permissões de Diretório

Certifique-se de que o diretório `api/uploads/` tenha permissões de escrita:

```bash
chmod 755 api/uploads/
```