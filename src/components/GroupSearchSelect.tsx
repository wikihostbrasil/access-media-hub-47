import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGroups } from "@/hooks/useApiGroups";
import { Search, FolderOpen } from "lucide-react";

interface GroupSearchSelectProps {
  selectedGroups: string[];
  onSelectionChange: (groups: string[]) => void;
}

export const GroupSearchSelect = ({ selectedGroups, onSelectionChange }: GroupSearchSelectProps) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { data: groups } = useGroups();

  const filteredGroups = groups?.filter(group =>
    group.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10) || []; // Limit to 10 results

  const handleToggleGroup = (groupId: string) => {
    if (selectedGroups.includes(groupId)) {
      onSelectionChange(selectedGroups.filter(id => id !== groupId));
    } else {
      onSelectionChange([...selectedGroups, groupId]);
    }
  };

  const selectedGroupNames = groups?.filter(group => 
    selectedGroups.includes(group.id)
  ).map(group => group.name).join(", ") || "";

  return (
    <div className="grid gap-2">
      <Label>Grupos com Acesso</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start h-auto min-h-10 p-3">
            <FolderOpen className="h-4 w-4 mr-2" />
            <span className="text-left flex-1 truncate">
              {selectedGroups.length > 0 
                ? `${selectedGroups.length} grupo(s) selecionado(s)`
                : "Selecionar grupos..."
              }
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar grupos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <div key={group.id} className="flex items-center space-x-2 p-3 hover:bg-muted/50">
                  <Checkbox
                    id={`group-${group.id}`}
                    checked={selectedGroups.includes(group.id)}
                    onCheckedChange={() => handleToggleGroup(group.id)}
                  />
                  <Label 
                    htmlFor={`group-${group.id}`} 
                    className="text-sm flex-1 cursor-pointer"
                  >
                    {group.name}
                  </Label>
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-muted-foreground">
                {search ? "Nenhum grupo encontrado" : "Digite para buscar..."}
              </div>
            )}
          </div>
          {selectedGroups.length > 0 && (
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
      {selectedGroupNames && (
        <p className="text-xs text-muted-foreground">
          Selecionados: {selectedGroupNames}
        </p>
      )}
    </div>
  );
};