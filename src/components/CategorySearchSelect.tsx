import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCategories } from "@/hooks/useApiCategories";
import { Search, Tag } from "lucide-react";

interface CategorySearchSelectProps {
  selectedCategories: string[];
  onSelectionChange: (categories: string[]) => void;
}

export const CategorySearchSelect = ({ selectedCategories, onSelectionChange }: CategorySearchSelectProps) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { data: categories } = useCategories();

  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10) || []; // Limit to 10 results

  const handleToggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onSelectionChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onSelectionChange([...selectedCategories, categoryId]);
    }
  };

  const selectedCategoryNames = categories?.filter(category => 
    selectedCategories.includes(category.id)
  ).map(category => category.name).join(", ") || "";

  return (
    <div className="grid gap-2">
      <Label>Categorias com Acesso</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start h-auto min-h-10 p-3">
            <Tag className="h-4 w-4 mr-2" />
            <span className="text-left flex-1 truncate">
              {selectedCategories.length > 0 
                ? `${selectedCategories.length} categoria(s) selecionada(s)`
                : "Selecionar categorias..."
              }
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar categorias..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2 p-3 hover:bg-muted/50">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleToggleCategory(category.id)}
                  />
                  <Label 
                    htmlFor={`category-${category.id}`} 
                    className="text-sm flex-1 cursor-pointer"
                  >
                    {category.name}
                  </Label>
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-muted-foreground">
                {search ? "Nenhuma categoria encontrada" : "Digite para buscar..."}
              </div>
            )}
          </div>
          {selectedCategories.length > 0 && (
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
      {selectedCategoryNames && (
        <p className="text-xs text-muted-foreground">
          Selecionados: {selectedCategoryNames}
        </p>
      )}
    </div>
  );
};