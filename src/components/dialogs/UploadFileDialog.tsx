import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, FileIcon, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useUploadFile } from "@/hooks/useApiFiles";
import { CategorySearchSelect } from "@/components/CategorySearchSelect";
import { GroupSearchSelect } from "@/components/GroupSearchSelect";
import { UserSearchSelect } from "@/components/UserSearchSelect";

interface UploadFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UploadFileDialog = ({ open, onOpenChange }: UploadFileDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPermanent, setIsPermanent] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = useUploadFile();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.split('.')[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !title.trim()) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('start_date', startDate);
    formData.append('end_date', endDate);
    formData.append('is_permanent', isPermanent ? '1' : '0');
    
    // Convert permissions to the format expected by the API
    const apiPermissions = [
      ...selectedUsers.map(id => ({ user_id: id })),
      ...selectedGroups.map(id => ({ group_id: id })),
      ...selectedCategories.map(id => ({ category_id: id }))
    ];
    formData.append('permissions', JSON.stringify(apiPermissions));

    try {
      await uploadFile.mutateAsync(formData);
      // Reset form
      setTitle("");
      setDescription("");
      setFile(null);
      setStartDate("");
      setEndDate("");
      setIsPermanent(false);
      setSelectedUsers([]);
      setSelectedGroups([]);
      setSelectedCategories([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload de Arquivo</DialogTitle>
          <DialogDescription>
            Faça upload de um novo arquivo para a biblioteca
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>Arquivo *</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver
                  ? "border-primary bg-primary/10"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileIcon className="h-8 w-8 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Arraste um arquivo aqui ou clique para selecionar
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Suporte para documentos, imagens, áudio e outros formatos
                  </p>
                  <input
                    type="file"
                    id="file-input"
                    className="hidden"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) handleFileSelect(selectedFile);
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    Selecionar Arquivo
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields in responsive grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite o título do arquivo"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o conteúdo do arquivo (opcional)"
                  rows={3}
                />
              </div>

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
                    id="permanent"
                    checked={isPermanent}
                    onCheckedChange={(checked) => {
                      setIsPermanent(checked as boolean);
                      if (checked) {
                        setStartDate("");
                        setEndDate("");
                      }
                    }}
                  />
                  <Label htmlFor="permanent" className="text-sm">
                    Arquivo permanente (sempre disponível)
                  </Label>
                </div>

                {!isPermanent && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Data de Início</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="start-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">Data de Vencimento</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="end-date"
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
            </div>

            <div className="space-y-6">
              {/* Permissions */}
              <div className="space-y-4">
                <div>
                  <Label>Permissões de Acesso</Label>
                  <p className="text-sm text-muted-foreground">
                    Selecione usuários, grupos ou categorias que podem acessar este arquivo
                  </p>
                </div>

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
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploadFile.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!file || !title.trim() || uploadFile.isPending}
            >
              {uploadFile.isPending ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Fazer Upload
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};