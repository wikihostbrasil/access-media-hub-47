# GitHub Actions Setup

## Configuração dos Secrets

Para configurar o workflow de build e deploy, adicione os seguintes secrets no GitHub:

1. Acesse: **Settings** → **Secrets and variables** → **Actions**
2. Adicione os seguintes secrets:

### Obrigatórios:
- `VITE_API_BASE_URL`: URL da sua API em produção (ex: `https://seudominio.com/api`)

### Opcionais (para deploy automático):
- `FTP_HOST`: Servidor FTP (ex: `ftp.seudominio.com`)
- `FTP_USERNAME`: Usuário do FTP
- `FTP_PASSWORD`: Senha do FTP

## Como funciona:

### Build automático:
- ✅ Executa a cada push/PR nas branches main/master
- ✅ Instala dependências e gera build otimizado
- ✅ Salva artifacts por 30 dias

### Deploy automático (opcional):
- ✅ Executa apenas na branch principal
- ✅ Envia arquivos via FTP para servidor
- ✅ Notifica sucesso/falha

## Comandos locais alternativos:

```bash
# Build local
npm run build

# Preview do build
npm run preview

# Deploy manual via FTP
# Use um cliente FTP para enviar a pasta dist/
```

## Estrutura do build:

```
dist/
├── index.html
├── assets/
│   ├── css/
│   └── js/
└── [outros arquivos estáticos]
```