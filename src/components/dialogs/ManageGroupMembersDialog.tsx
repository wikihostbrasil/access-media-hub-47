import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, UserMinus, Shield, User, Settings } from "lucide-react";
import { useGroupMembers, useUpdateGroupMembers } from "@/hooks/useApiGroups";
import { UserSearchSelect } from "@/components/UserSearchSelect";

interface ManageGroupMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: { id: string; name: string } | null;
}

export const ManageGroupMembersDialog = ({ open, onOpenChange, group }: ManageGroupMembersDialogProps) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const { data: members, isLoading } = useGroupMembers(group?.id || null);
  const updateMembers = useUpdateGroupMembers();

  useEffect(() => {
    if (members) {
      setSelectedUsers(members.map((member: any) => member.user_id));
    }
  }, [members]);

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
        {role === "admin" ? "Admin" : role === "operator" ? "Operador" : "Usuário"}
      </Badge>
    );
  };

  const handleSave = async () => {
    if (!group) return;

    await updateMembers.mutateAsync({
      groupId: group.id,
      userIds: selectedUsers,
      action: 'set'
    });

    onOpenChange(false);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!group) return;

    await updateMembers.mutateAsync({
      groupId: group.id,
      userIds: [userId],
      action: 'remove'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Membros</DialogTitle>
          <DialogDescription>
            Gerencie os membros do grupo: {group?.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Adicionar Membros</label>
            <UserSearchSelect
              selectedUsers={selectedUsers}
              onSelectionChange={setSelectedUsers}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Membros Atuais</h3>
            
            {isLoading ? (
              <div className="text-center py-4">Carregando membros...</div>
            ) : members && members.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member: any) => (
                    <TableRow key={member.user_id}>
                      <TableCell className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {member.full_name.split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {member.user_id.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(member.role)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveMember(member.user_id)}
                          disabled={updateMembers.isPending}
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum membro no grupo
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateMembers.isPending}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {updateMembers.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};