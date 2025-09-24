import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Search, Shield, User, Settings } from "lucide-react";
import { useUsers } from "@/hooks/useApiUsers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InviteUserDialog } from "@/components/dialogs/InviteUserDialog";
import { EditUserDialog } from "@/components/dialogs/EditUserDialog";

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openInvite, setOpenInvite] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const { data: users, isLoading } = useUsers();
  // const updateUserRole = useUpdateUserRole(); // Removed - not available in PHP backend
  // const toggleUserStatus = useToggleUserStatus(); // Removed - not available in PHP backend

  const filteredUsers = users?.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "operator":
        return <Settings className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: "default",
      operator: "secondary", 
      user: "outline",
    } as const;
    
    return (
      <Badge variant={variants[role as keyof typeof variants] || "outline"} className="flex items-center gap-1">
        {getRoleIcon(role)}
        {role === "admin" ? "Administrador" : role === "operator" ? "Operador" : "Usuário"}
      </Badge>
    );
  };

  const handleRoleChange = (userId: string, newRole: "admin" | "operator" | "user") => {
    // TODO: Implement role change in PHP backend
    console.log('Role change requested:', userId, newRole);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setOpenEdit(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Carregando usuários...</div>
      </div>
    );
  }

  const totalUsers = users?.length || 0;
  const adminCount = users?.filter(u => u.role === "admin").length || 0;
  const operatorCount = users?.filter(u => u.role === "operator").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">
            Controle de acesso e permissões dos usuários
          </p>
        </div>
        <Button onClick={() => setOpenInvite(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar Usuário
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operadores</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operatorCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Gerencie os usuários e suas permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {user.full_name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {user.user_id.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.email ? user.email.substring(0, 3) + '***' + user.email.substring(user.email.indexOf('@')) : 'Não informado'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.whatsapp || "Não informado"}
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <Badge variant={user.active ? "default" : "destructive"}>
                        {user.active ? "Ativo" : "Bloqueado"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                        >
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRoleChange(user.user_id, user.role === "admin" ? "user" : "admin")}
                          
                        >
                          {user.role === "admin" ? "Remover Admin" : "Tornar Admin"}
                        </Button>
                        <Button 
                          size="sm" 
                          variant={user.active ? "destructive" : "default"}
                          onClick={() => console.log('Toggle status:', user.user_id)}
                        >
                          {user.active ? "Bloquear" : "Ativar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InviteUserDialog open={openInvite} onOpenChange={setOpenInvite} />
      <EditUserDialog 
        open={openEdit} 
        onOpenChange={setOpenEdit} 
        user={selectedUser}
      />
    </div>
  );
};

export default Users;