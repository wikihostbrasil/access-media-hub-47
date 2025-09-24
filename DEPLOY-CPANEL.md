# Deploy do Build para cPanel

## 📋 Opções de Deploy

### 1. **Deploy Manual via File Manager do cPanel**

1. Execute o build localmente:
   ```bash
   npm run build
   ```

2. Acesse o **File Manager** do cPanel

3. Navegue até a pasta `public_html/` (ou subpasta do projeto)

4. **Limpe** os arquivos antigos (se houver)

5. **Envie** todos os arquivos da pasta `dist/`:
   - `index.html`
   - pasta `assets/`
   - outros arquivos estáticos

### 2. **Deploy Manual via FTP**

1. Execute o build:
   ```bash
   npm run build
   ```

2. Use um cliente FTP (FileZilla, WinSCP, etc.):
   - **Host**: Seu domínio ou IP do cPanel
   - **Usuário**: Usuário do cPanel
   - **Senha**: Senha do cPanel
   - **Porta**: 21 (FTP) ou 22 (SFTP)

3. Envie conteúdo da pasta `dist/` para `public_html/`

### 3. **Deploy Automático via GitHub Actions**

Configure os secrets no GitHub:

- `CPANEL_FTP_HOST`: ftp.seudominio.com
- `CPANEL_FTP_USERNAME`: usuário do cPanel  
- `CPANEL_FTP_PASSWORD`: senha do cPanel
- `VITE_API_BASE_URL`: https://seudominio.com/api

A cada push na branch principal, o build será gerado e enviado automaticamente!

## ⚠️ Importante

- ✅ Envie **apenas** o conteúdo da pasta `dist/`
- ✅ **NÃO** envie `src/`, `node_modules/`, etc.
- ✅ Configure a URL da API no `.env` ou secrets
- ✅ Teste o site após o upload

## 🔧 Configuração da API

Certifique-se que a variável `VITE_API_BASE_URL` aponte para:
```
https://seudominio.com/api
```