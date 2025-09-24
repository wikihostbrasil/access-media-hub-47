import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, Calendar, TrendingUp, FileText } from "lucide-react";
import { useDownloads } from "@/hooks/useApiDownloads";
import { useStats } from "@/hooks/useApiStats";
import { DownloadDetailsModal } from "@/components/DownloadDetailsModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Downloads = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: downloads, isLoading } = useDownloads();
  const { data: stats } = useStats();
  const [openDetails, setOpenDetails] = useState(false);
  const [detailsFileId, setDetailsFileId] = useState<string>("");
  const [detailsFileName, setDetailsFileName] = useState<string>("");

  const filteredDownloads = downloads?.filter(download =>
    (download.file_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (download.user_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileType = (filename: string) => {
    const ext = filename.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Carregando downloads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Downloads</h1>
          <p className="text-muted-foreground">
            Monitore e analise todos os downloads realizados
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.downloads_today || 0}</div>
            <p className="text-xs text-muted-foreground">
              Downloads realizados hoje
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_downloads || 0}</div>
            <p className="text-xs text-muted-foreground">
              Todos os downloads
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unique_users_month || 0}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Últimos Downloads</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{downloads?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registros recentes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro de Downloads</CardTitle>
          <CardDescription>
            Histórico completo de downloads com detalhes dos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por arquivo ou usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDownloads.map((download) => (
                <TableRow key={download.id}>
                  <TableCell className="font-medium">
                    {download.file_title || 'Arquivo removido'}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{download.user_name || 'Usuário'}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {download.user_id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getFileType(download.file_url || download.file_title || '')}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatFileSize(download.file_size)}</TableCell>
                  <TableCell>
                    <div>
                      <div>
                        {format(new Date(download.downloaded_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(download.downloaded_at), "HH:mm:ss", { locale: ptBR })}
                      </div>
                    </div>
                  </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => { setDetailsFileId(download.file_id); setDetailsFileName(download.file_title || 'Arquivo'); setOpenDetails(true); }}>
                        Detalhes
                      </Button>
                    </TableCell>
                </TableRow>
              ))}
              {filteredDownloads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum download encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <DownloadDetailsModal isOpen={openDetails} onClose={() => setOpenDetails(false)} fileId={detailsFileId} fileName={detailsFileName} />
    </div>
  );
};

export default Downloads;