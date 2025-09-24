import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCategory } from "@/hooks/useApiCategories";

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateCategoryDialog = ({ open, onOpenChange }: CreateCategoryDialogProps) => {
  const createCategory = useCreateCategory();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    createCategory.mutate({ name, description: description || undefined }, {
      onSuccess: () => {
        setName("");
        setDescription("");
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !createCategory.isPending && onOpenChange(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova categoria</DialogTitle>
          <DialogDescription>Organize os arquivos por categoria</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="cname">Nome</Label>
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Documentos" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cdesc">Descrição</Label>
            <Textarea id="cdesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createCategory.isPending}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!name || createCategory.isPending}>{createCategory.isPending ? "Criando..." : "Criar"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};