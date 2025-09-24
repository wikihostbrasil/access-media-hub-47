import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Search, Plus, FileText, Trash2 } from "lucide-react";
import { useCategories, useDeleteCategory } from "@/hooks/useApiCategories";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateCategoryDialog } from "@/components/dialogs/CreateCategoryDialog";
import { EditCategoryDialog } from "@/components/dialogs/EditCategoryDialog";
import { useNavigate } from "react-router-dom";

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const { data: categories, isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();
  const [openEdit, setOpenEdit] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; description?: string | null } | null>(null);
  const navigate = useNavigate();

  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"?`)) {
      deleteCategory.mutate(categoryId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Carregando categorias...</div>
      </div>
    );
  }

  const totalFiles = categories?.reduce((acc, cat) => acc + (cat.file_count || 0), 0) || 0;
  const avgFilesPerCategory = categories?.length ? Math.round(totalFiles / categories.length) : 0;
  const mostPopularCategory = categories?.sort((a, b) => (b.file_count || 0) - (a.file_count || 0))[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Categorias</h1>
          <p className="text-muted-foreground">
            Organize arquivos em categorias para facilitar a navegação
          </p>
        </div>
        <Button onClick={() => setOpenCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categorias</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Arquivos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mais Popular</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mostPopularCategory?.name || "N/A"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média p/ Categoria</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgFilesPerCategory}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorias</CardTitle>
          <CardDescription>
            Gerencie e organize as categorias dos arquivos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription>{category.description || "Sem descrição"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary">
                      {category.file_count || 0} arquivos
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {category.created_by_name || "Usuário"}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Criado em {format(new Date(category.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditingCategory({ id: category.id, name: category.name, description: category.description }); setOpenEdit(true); }}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/files?q=${encodeURIComponent(category.name)}`)}>
                      Ver Arquivos
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredCategories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground col-span-full">
                Nenhuma categoria encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CreateCategoryDialog open={openCreate} onOpenChange={setOpenCreate} />
      <EditCategoryDialog open={openEdit} onOpenChange={setOpenEdit} category={editingCategory} />
    </div>
  );
};

export default Categories;