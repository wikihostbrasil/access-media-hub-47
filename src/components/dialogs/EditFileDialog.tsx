import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { CategorySearchSelect } from "@/components/CategorySearchSelect";
import { GroupSearchSelect } from "@/components/GroupSearchSelect";
import { UserSearchSelect } from "@/components/UserSearchSelect";

interface EditFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file?: {
    id: string;
    title: string;
    description?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    status?: string | null;
    is_permanent?: boolean | null;
  } | null;
}

export const EditFileDialog = ({ open, onOpenChange, file }: EditFileDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPermanent, setIsPermanent] = useState(false);
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (file) {
      setTitle(file.title || "");
      setDescription(file.description || "");
      setStartDate(file.start_date ? file.start_date.split('T')[0] : "");
      setEndDate(file.end_date ? file.end_date.split('T')[0] : "");
      setIsPermanent(file.is_permanent || false);
      setStatus(file.status || "active");
      
      // Load file permissions
      loadFilePermissions(file.id);
    }
  }, [file]);

  const loadFilePermissions = async (fileId: string) => {
    setPermissionsLoading(true);
    try {
      const response: any = await apiClient.request(`/files/permissions.php?file_id=${fileId}`);
      if (response.data) {
        const permissions = response.data;
        setSelectedUsers(permissions.filter((p: any) => p.user_id).map((p: any) => p.user_id));
        setSelectedGroups(permissions.filter((p: any) => p.group_id).map((p: any) => p.group_id));
        setSelectedCategories(permissions.filter((p: any) => p.category_id).map((p: any) => p.category_id));
      }
    } catch (error) {
      console.error('Error loading file permissions:', error);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      await apiClient.request(`/files/update.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: file.id,
          title: title.trim(),
          description: description.trim(),
          start_date: isPermanent ? null : (startDate || null),
          end_date: isPermanent ? null : (endDate || null),
          is_permanent: isPermanent,
          status: status,
          permissions: [
            ...selectedUsers.map(id => ({ user_id: id })),
            ...selectedGroups.map(id => ({ group_id: id })),
            ...selectedCategories.map(id => ({ category_id: id }))
          ]
        })
      });

      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast({
        title: "Sucesso",
        description: "Arquivo atualizado com sucesso!",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar arquivo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Arquivo</DialogTitle>
          <DialogDescription>
            Atualize as informações e configurações do arquivo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título *</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite o título do arquivo"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o conteúdo do arquivo (opcional)"
                  rows={3}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {/* Validity Period */}
              <div className="space-y-4">
                <div>
                  <Label>Período de Vigência</Label>
                  <p className="text-sm text-muted-foreground">
                    Defina quando o arquivo deve estar disponível
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-permanent"
                    checked={isPermanent}
                    onCheckedChange={(checked) => {
                      setIsPermanent(checked as boolean);
                      if (checked) {
                        setStartDate("");
                        setEndDate("");
                      }
                    }}
                  />
                  <Label htmlFor="edit-permanent" className="text-sm">
                    Arquivo permanente (sempre disponível)
                  </Label>
                </div>

                {!isPermanent && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-start-date">Data de Início</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="edit-start-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-end-date">Data de Vencimento</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="edit-end-date"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <div>
                  <Label>Permissões de Acesso</Label>
                  <p className="text-sm text-muted-foreground">
                    Selecione usuários, grupos ou categorias que podem acessar este arquivo
                  </p>
                </div>

                {permissionsLoading ? (
                  <div className="text-sm text-muted-foreground">Carregando permissões...</div>
                ) : (
                  <div className="space-y-4">
                    <UserSearchSelect
                      selectedUsers={selectedUsers}
                      onSelectionChange={setSelectedUsers}
                    />
                    <GroupSearchSelect
                      selectedGroups={selectedGroups}
                      onSelectionChange={setSelectedGroups}
                    />
                    <CategorySearchSelect
                      selectedCategories={selectedCategories}
                      onSelectionChange={setSelectedCategories}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || loading}
            >
              {loading ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};