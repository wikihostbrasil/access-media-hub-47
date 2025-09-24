import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function SignupSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Cadastro Realizado!</CardTitle>
          <CardDescription>
            Sua conta foi criada com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Confirme seu email</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Enviamos um link de confirmação para seu email. 
                  Clique no link para ativar sua conta e fazer login.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Próximos passos:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Verifique sua caixa de entrada</li>
              <li>Clique no link de confirmação no email</li>
              <li>Retorne para fazer login</li>
            </ol>
          </div>

          <div className="pt-4">
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Login
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Não recebeu o email? Verifique sua pasta de spam ou 
            tente fazer o cadastro novamente.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}