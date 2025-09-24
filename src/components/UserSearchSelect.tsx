import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUsers } from "@/hooks/useApiUsers";
import { Search, Users } from "lucide-react";

interface UserSearchSelectProps {
  selectedUsers: string[];
  onSelectionChange: (users: string[]) => void;
}

export const UserSearchSelect = ({ selectedUsers, onSelectionChange }: UserSearchSelectProps) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { data: users } = useUsers();

  const filteredUsers = users?.filter(user =>
    user.full_name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10) || []; // Limit to 10 results

  const handleToggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onSelectionChange(selectedUsers.filter(id => id !== userId));
    } else {
      onSelectionChange([...selectedUsers, userId]);
    }
  };

  const selectedUserNames = users?.filter(user => 
    selectedUsers.includes(user.user_id)
  ).map(user => user.full_name).join(", ") || "";

  return (
    <div className="grid gap-2">
      <Label>Usuários com Acesso</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start h-auto min-h-10 p-3">
            <Users className="h-4 w-4 mr-2" />
            <span className="text-left flex-1 truncate">
              {selectedUsers.length > 0 
                ? `${selectedUsers.length} usuário(s) selecionado(s)`
                : "Selecionar usuários..."
              }
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-2 p-3 hover:bg-muted/50">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedUsers.includes(user.user_id)}
                    onCheckedChange={() => handleToggleUser(user.user_id)}
                  />
                  <Label 
                    htmlFor={`user-${user.id}`} 
                    className="text-sm flex-1 cursor-pointer"
                  >
                    {user.full_name}
                  </Label>
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-muted-foreground">
                {search ? "Nenhum usuário encontrado" : "Digite para buscar..."}
              </div>
            )}
          </div>
          {selectedUsers.length > 0 && (
            <div className="p-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectionChange([])}
                className="w-full"
              >
                Limpar seleção
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {selectedUserNames && (
        <p className="text-xs text-muted-foreground">
          Selecionados: {selectedUserNames}
        </p>
      )}
    </div>
  );
};