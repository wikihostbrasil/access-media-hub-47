import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Download, User, Calendar, TrendingUp } from "lucide-react";
// Note: File downloads feature needs PHP implementation
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DownloadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
}

export const DownloadDetailsModal = ({ isOpen, onClose, fileId, fileName }: DownloadDetailsModalProps) => {
  // const { data: downloads, isLoading } = useFileDownloads(fileId);
  const downloads: any[] = [];
  const isLoading = false;

  const downloadCount = downloads?.length || 0;
  const uniqueUsers = new Set(downloads?.map(d => d.user_id)).size;
  
  const last24Hours = downloads?.filter(d => {
    const downloadDate = new Date(d.downloaded_at);
    const now = new Date();
    const timeDiff = now.getTime() - downloadDate.getTime();
    return timeDiff <= 24 * 60 * 60 * 1000; // 24 horas
  }).length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Detalhes de Downloads - {fileName}
          </DialogTitle>
          <DialogDescription>
            Histórico completo de downloads e estatísticas do arquivo
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cards de estatísticas */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{downloadCount}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uniqueUsers}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Últimas 24h</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{last24Hours}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de downloads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Histórico de Downloads
                </CardTitle>
                <CardDescription>
                  Lista completa de todos os downloads realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {downloads && downloads.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {downloads.map((download) => (
                        <TableRow key={download.id}>
                          <TableCell className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {download.profiles?.full_name?.split(" ")
                                  .map(n => n[0]).join("") || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {download.profiles?.full_name || "Usuário"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: {download.user_id.slice(0, 8)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {format(new Date(download.downloaded_at), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(download.downloaded_at), "HH:mm:ss", { locale: ptBR })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              Concluído
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum download registrado para este arquivo
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};