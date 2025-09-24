import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, CheckCircle, XCircle, LogOut } from "lucide-react";
import { useApiAuth } from "@/hooks/useApiAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AccessLog {
  id: string;
  event_type: string;
  ip_address: string;
  user_id?: string;
  user_name?: string;
  details?: string;
  created_at: string;
}

export default function AccessLogs() {
  const { user } = useApiAuth();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = async (page = 1) => {
    try {
      const response = await fetch(`/api/logs/access.php?page=${page}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalLogs(data.total);
        setCurrentPage(data.page);
      }
    } catch (error) {
      console.error("Error fetching access logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchLogs();
    }
  }, [user]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login_success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'login_failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-blue-500" />;
      case 'unauthorized_access':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'login_success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Login Sucesso</Badge>;
      case 'login_failed':
        return <Badge variant="destructive">Login Falhou</Badge>;
      case 'logout':
        return <Badge variant="secondary">Logout</Badge>;
      case 'unauthorized_access':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Acesso Negado</Badge>;
      default:
        return <Badge variant="outline">{eventType}</Badge>;
    }
  };

  const filteredLogs = logs.filter(log =>
    log.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.event_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso negado. Apenas administradores podem ver os logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Logs de Acesso</h1>
        <p className="text-muted-foreground">
          Monitore tentativas de login e atividades de segurança
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico de Acessos</CardTitle>
              <CardDescription>
                Total de {totalLogs} registros encontrados
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por IP, usuário ou evento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando logs...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(log.event_type)}
                          {getEventBadge(log.event_type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.user_name || log.user_id || "Usuário não identificado"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ip_address}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.details || "-"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "Nenhum log encontrado para a busca." : "Nenhum log de acesso encontrado."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {totalLogs > 50 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => fetchLogs(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4">
                Página {currentPage} de {Math.ceil(totalLogs / 50)}
              </span>
              <Button 
                variant="outline" 
                onClick={() => fetchLogs(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalLogs / 50)}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}