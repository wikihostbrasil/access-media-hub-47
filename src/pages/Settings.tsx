import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Save } from "lucide-react";

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">
            Configurações disponíveis no backend PHP
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
          <CardDescription>
            Informações sobre o estado atual do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <span>Banco de Dados MySQL</span>
              <Badge className="bg-green-100 text-green-800">Online</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>API PHP</span>
              <Badge className="bg-green-100 text-green-800">Online</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Autenticação JWT</span>
              <Badge className="bg-green-100 text-green-800">Ativo</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Upload de Arquivos</span>
              <Badge className="bg-green-100 text-green-800">Funcionando</Badge>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> As configurações detalhadas do sistema são gerenciadas 
              através do backend PHP. Para configurações avançadas, consulte o arquivo 
              <code className="mx-1 px-1 bg-background rounded">api/config/</code> no servidor.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;