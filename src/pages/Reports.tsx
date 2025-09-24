import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios e Análises</h1>
        <p className="text-muted-foreground">
          Análises e estatísticas de uso do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Status dos Relatórios
          </CardTitle>
          <CardDescription>
            Sistema de relatórios baseado em PHP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <span>Downloads por Período</span>
              <Badge className="bg-green-100 text-green-800">Disponível</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Usuários Mais Ativos</span>
              <Badge className="bg-green-100 text-green-800">Disponível</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Arquivos Mais Baixados</span>
              <Badge className="bg-green-100 text-green-800">Disponível</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Relatório de Auditoria</span>
              <Badge className="bg-yellow-100 text-yellow-800">Em Desenvolvimento</Badge>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Os relatórios detalhados são gerados pelo backend PHP. 
              Para acessar relatórios específicos, consulte os endpoints da API em 
              <code className="mx-1 px-1 bg-background rounded">api/reports/</code>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;