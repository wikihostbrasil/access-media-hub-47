import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Plus, FolderOpen, Trash2 } from "lucide-react";
import { useGroups, useDeleteGroup } from "@/hooks/useApiGroups";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateGroupDialog } from "@/components/dialogs/CreateGroupDialog";
import { ManageGroupMembersDialog } from "@/components/dialogs/ManageGroupMembersDialog";
import { EditGroupDialog } from "@/components/dialogs/EditGroupDialog";

const Groups = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [openMembers, setOpenMembers] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const { data: groups, isLoading } = useGroups();
  const deleteGroup = useDeleteGroup();

  const filteredGroups = groups?.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (confirm(`Tem certeza que deseja excluir o grupo "${groupName}"?`)) {
      deleteGroup.mutate(groupId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Carregando grupos...</div>
      </div>
    );
  }

  const totalUsers = groups?.reduce((acc, group) => acc + (group.user_count || 0), 0) || 0;
  const avgUsersPerGroup = groups?.length ? Math.round(totalUsers / groups.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Grupos</h1>
          <p className="text-muted-foreground">
            Organize usuários em grupos e gerencie permissões
          </p>
        </div>
        <Button onClick={() => setOpenCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Grupo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grupos</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Grupo</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUsersPerGroup}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Grupos</CardTitle>
          <CardDescription>
            Gerencie grupos e suas permissões no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar grupos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Grupo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Criado por</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {group.description || "Sem descrição"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {group.user_count || 0} usuários
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {group.created_by_name || "Usuário"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(group.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedGroup(group); setOpenEdit(true); }}>
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedGroup(group);
                          setOpenMembers(true);
                        }}
                      >
                        Membros
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredGroups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum grupo encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateGroupDialog open={openCreate} onOpenChange={setOpenCreate} />
      <ManageGroupMembersDialog 
        open={openMembers} 
        onOpenChange={setOpenMembers}
        group={selectedGroup}
      />
      <EditGroupDialog open={openEdit} onOpenChange={setOpenEdit} group={selectedGroup} />
      
    </div>
  );
};

export default Groups;