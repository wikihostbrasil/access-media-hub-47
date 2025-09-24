import { useApiAuth } from "@/hooks/useApiAuth";
import { useStats } from "@/hooks/useApiStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Files, Users, FolderOpen, Download } from "lucide-react";

const Index = () => {
  const { user } = useApiAuth();
  const { data: stats } = useStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {user?.full_name}! Perfil: {user?.role}
        </p>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${user?.role === 'user' ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-6`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user?.role === 'user' ? 'Meus Arquivos' : 'Total de Arquivos'}
            </CardTitle>
            <Files className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_files || 0}</div>
            <p className="text-xs text-muted-foreground">
              {user?.role === 'user' ? 'Arquivos disponíveis para você' : 'Arquivos no sistema'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user?.role === 'user' ? 'Meus Downloads' : 'Downloads'}
            </CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_downloads || 0}</div>
            <p className="text-xs text-muted-foreground">
              {user?.role === 'user' ? 'Downloads que você fez' : 'Downloads realizados'}
            </p>
          </CardContent>
        </Card>

        {user?.role !== 'user' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.active_users || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Usuários cadastrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Grupos</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Grupos criados
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Gerenciador de Downloads</CardTitle>
          <CardDescription>
            Sistema completo para gerenciamento de arquivos com controle de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Este sistema permite o controle completo de downloads com diferentes perfis de acesso:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              {user?.role === 'user' ? (
                <>
                  <li>Acesse arquivos autorizados para você</li>
                  <li>Faça download de documentos e mídias</li>
                  <li>Use o player de áudio integrado</li>
                  <li>Acompanhe seu histórico de downloads</li>
                </>
              ) : (
                <>
                  <li><strong>Admin:</strong> Acesso completo a todas as funcionalidades</li>
                  <li><strong>Operador:</strong> Gerencia usuários, grupos, categorias e arquivos</li>
                  <li><strong>Usuário:</strong> Acessa e baixa arquivos autorizados</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
