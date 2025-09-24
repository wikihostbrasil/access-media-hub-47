import { useState, useEffect, Fragment } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileIcon, Download, Search, Plus, Upload, BarChart3, Edit, Trash2 } from "lucide-react";
import { useFiles, useDeleteFile } from "@/hooks/useApiFiles";
import { DownloadDetailsModal } from "@/components/DownloadDetailsModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UploadFileDialog } from "@/components/dialogs/UploadFileDialog";
import { CreateCategoryDialog } from "@/components/dialogs/CreateCategoryDialog";
import { AudioPlayer } from "@/components/AudioPlayer";
import { EditFileDialog } from "@/components/dialogs/EditFileDialog";
import { useApiAuth } from "@/hooks/useApiAuth";
import { apiClient } from "@/lib/api";
import { useLocation, useNavigate } from "react-router-dom";

const Files = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [openEdit, setOpenEdit] = useState(false);
  const [editingFile, setEditingFile] = useState<{ id: string; title: string; description?: string | null; start_date?: string | null; end_date?: string | null; status?: string | null; is_permanent?: boolean | null } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useApiAuth();

  const [openUpload, setOpenUpload] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  
  const { data: files, isLoading } = useFiles();
  const deleteFile = useDeleteFile();

  // Read search from query param (q)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) setSearchTerm(q);
  }, [location.search]);

  const filteredFiles = files?.filter(file =>
    file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileExtension = (filename: string) => {
    const ext = filename.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
  };

  // Note: Download counts would need to be implemented in PHP backend

  const isAudioFile = (filename: string, mimeType?: string) => {
    const audioExtensions = ['MP3', 'WAV', 'OGG', 'AAC', 'M4A', 'FLAC'];
    const extension = filename.split('.').pop()?.toUpperCase();
    return audioExtensions.includes(extension || '') || mimeType?.startsWith('audio/');
  };

  const handleShowDownloads = (fileId: string, fileName: string) => {
    setSelectedFileId(fileId);
    setSelectedFileName(fileName);
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (confirm(`Tem certeza que deseja excluir o arquivo "${fileName}"?`)) {
      deleteFile.mutate(fileId);
    }
  };

  const handleDirectDownload = async (file: { id: string; file_url: string; title?: string }) => {
    try {
      // Record download in backend
      await apiClient.recordDownload(file.id);
      // Open file URL directly (assumes file_url is accessible)
      window.open(file.file_url, "_blank");
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Carregando arquivos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Arquivos</h1>
          <p className="text-muted-foreground">
            Gerencie e organize todos os arquivos disponíveis para download
          </p>
        </div>
        {user?.role !== 'user' && (
          <div className="flex gap-2">
            <Button onClick={() => setOpenUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Arquivo
            </Button>
            <Button variant="outline" onClick={() => setOpenCategory(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Biblioteca de Arquivos</CardTitle>
          <CardDescription>
            Total de {filteredFiles.length} arquivos disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar arquivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Tamanho</TableHead>
                {user?.role === 'admin' && <TableHead>Downloads</TableHead>}
                <TableHead>Enviado por</TableHead>
                {user?.role === 'admin' && <TableHead>Data Upload</TableHead>}
                <TableHead>Início</TableHead>
                <TableHead>Término</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map((file) => (
                <Fragment key={file.id}>
                  <TableRow>
                    <TableCell className="flex items-center gap-2">
                      <FileIcon className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{file.title}</div>
                        {file.description && (
                          <div className="text-sm text-muted-foreground">
                            {file.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(file.file_size)}</TableCell>
                    {user?.role === 'admin' && (
                      <TableCell>
                        <span className="font-medium">0</span>
                      </TableCell>
                    )}
                    <TableCell>Usuário</TableCell>
                    {user?.role === 'admin' && (
                      <TableCell>
                        {format(new Date(file.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="text-xs">
                        {file.start_date && (
                          <div>{format(new Date(file.start_date), "dd/MM/yyyy", { locale: ptBR })}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {file.end_date && (
                          <div>{format(new Date(file.end_date), "dd/MM/yyyy", { locale: ptBR })}</div>
                        )}
                        {file.is_permanent && <div className="text-green-600">Permanente</div>}
                      </div>
                    </TableCell>                    
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={file.status === 'active' ? 'default' : 'secondary'}>
                          {file.status === 'active' ? 'Ativo' : file.status === 'inactive' ? 'Inativo' : 'Arquivado'}
                        </Badge>
                        {file.deleted_at && <Badge variant="destructive">Excluído</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {user?.role === 'admin' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleShowDownloads(file.id, file.title)}
                          >
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleDirectDownload(file)}>
                          <Download className="h-3 w-3" />
                        </Button>
                        {(user?.role !== 'user') && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => { 
                              setEditingFile({ 
                                id: file.id, 
                                title: file.title, 
                                description: file.description,
                                start_date: file.start_date,
                                end_date: file.end_date,
                                status: file.status,
                                is_permanent: file.is_permanent
                              }); 
                              setOpenEdit(true); 
                            }}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteFile(file.id, file.title)}
                              
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {isAudioFile(file.title, file.file_type) && (
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={user?.role === 'admin' ? 8 : 6} className="pt-0">
                        <div className="mt-2">
                          <AudioPlayer fileUrl={file.file_url} fileName={file.title} fileId={file.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
              {filteredFiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={user?.role === 'admin' ? 8 : 6} className="text-center py-8 text-muted-foreground">
                    Nenhum arquivo encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DownloadDetailsModal
        isOpen={!!selectedFileId}
        onClose={() => {
          setSelectedFileId(null);
          setSelectedFileName("");
        }}
        fileId={selectedFileId || ""}
        fileName={selectedFileName}
      />

      <UploadFileDialog open={openUpload} onOpenChange={setOpenUpload} />
      <CreateCategoryDialog open={openCategory} onOpenChange={setOpenCategory} />
      <EditFileDialog open={openEdit} onOpenChange={setOpenEdit} file={editingFile} />
    </div>
  );
};

export default Files;