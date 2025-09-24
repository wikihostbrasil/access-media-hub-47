import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateGroup } from "@/hooks/useApiGroups";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateGroupDialog = ({ open, onOpenChange }: CreateGroupDialogProps) => {
  const createGroup = useCreateGroup();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    createGroup.mutate({ name, description: description || undefined }, {
      onSuccess: () => {
        setName("");
        setDescription("");
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !createGroup.isPending && onOpenChange(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo grupo</DialogTitle>
          <DialogDescription>Defina um nome e uma descrição</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="gname">Nome</Label>
            <Input id="gname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Marketing" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gdesc">Descrição</Label>
            <Textarea id="gdesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createGroup.isPending}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!name || createGroup.isPending}>{createGroup.isPending ? "Criando..." : "Criar"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};