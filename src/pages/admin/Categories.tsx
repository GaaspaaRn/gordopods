import React, { useState } from 'react'; // Removido useRef
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // Mantido se usado para o botão de excluir
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Plus } from 'lucide-react'; // Removido GripVertical
import { useCategories } from '@/contexts/CategoryContext';
import { Category } from '@/types';
// REMOVIDAS importações do dnd-kit

// Componente Item da Categoria (Simplificado)
const CategoryItem = ({ category }: { category: Category }) => {
  // Removida a desestruturação de useSortable
  const { updateCategory, deleteCategory } = useCategories();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editDescription, setEditDescription] = useState(category.description || '');
  const [editActive, setEditActive] = useState(category.active);

  const handleSave = async () => {
    if (editName.trim()) {
      await updateCategory(category.id, { 
          name: editName.trim(),
          description: editDescription,
          active: editActive
      });
      setIsEditDialogOpen(false);
    }
  };

  return (
    // Removidas props ref, style, attributes, listeners e classes de dragging
    <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-3 sm:p-4 mb-2 flex items-center justify-between">
      <div className="flex items-center">
        {/* Removido o div do drag handle */}
        <span className="font-medium">{category.name}</span>
        {!category.active && <span className="ml-2 text-xs bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">Inativa</span>}
      </div>
      
      <div className="flex gap-1 sm:gap-2">
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (open) {
            setEditName(category.name);
            setEditDescription(category.description || '');
            setEditActive(category.active);
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 sm:h-auto sm:w-auto sm:px-3">
              <Pencil size={14} className="sm:mr-1" /> <span className="hidden sm:inline">Editar</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Categoria</DialogTitle>
              <DialogDescription>Atualize os detalhes da categoria.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div>
                <Label htmlFor={`editName-${category.id}`}>Nome da categoria*</Label>
                <Input id={`editName-${category.id}`} value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1"/>
              </div>
              <div>
                <Label htmlFor={`editDescription-${category.id}`}>Descrição</Label>
                <Input id={`editDescription-${category.id}`} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="mt-1"/>
              </div>
               <div className="flex items-center space-x-2">
                <input type="checkbox" id={`editActive-${category.id}`} checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                <Label htmlFor={`editActive-${category.id}`} className="text-sm font-medium">Ativa</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="h-8 w-8 sm:h-auto sm:w-auto sm:px-3">
              <Trash2 size={14} className="sm:mr-1" /> <span className="hidden sm:inline">Excluir</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja excluir a categoria "{category.name}"? Produtos associados não serão excluídos automaticamente. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteCategory(category.id)} className="bg-red-600 hover:bg-red-700">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default function CategoriesPage() {
  // Removido 'reorderCategories' da desestruturação
  const { categories, createCategory, isLoading, updateCategory, deleteCategory } = useCategories(); 
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState(''); // Para o formulário de criação
  const [newCategoryActive, setNewCategoryActive] = useState(true);     // Para o formulário de criação
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // REMOVIDO sensors e handleDragEnd

  const handleCreateCategory = async () => {
    if (newCategoryName.trim()) {
      // Passando todos os campos relevantes para createCategory
      await createCategory(newCategoryName.trim(), newCategoryDescription, newCategoryActive);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryActive(true);
      setIsCreateDialogOpen(false);
    }
  };

  if (isLoading && categories.length === 0) { // Mostrar loading apenas se as categorias ainda não foram carregadas
    return <AdminLayout><div className="p-4 text-center">Carregando categorias...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categorias</CardTitle>
              <CardDescription>Gerencie as categorias da sua loja</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                setIsCreateDialogOpen(open);
                if(open) {
                    setNewCategoryName('');
                    setNewCategoryDescription('');
                    setNewCategoryActive(true);
                }
            }}>
              <DialogTrigger asChild>
                <Button><Plus size={16} className="mr-2" /> Nova Categoria</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Categoria</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-3">
                  <div>
                    <Label htmlFor="newCategoryNameModal">Nome da categoria*</Label>
                    <Input id="newCategoryNameModal" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="mt-1"/>
                  </div>
                  <div>
                    <Label htmlFor="newCategoryDescriptionModal">Descrição</Label>
                    <Input id="newCategoryDescriptionModal" value={newCategoryDescription} onChange={(e) => setNewCategoryDescription(e.target.value)} className="mt-1"/>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="newCategoryActiveModal" checked={newCategoryActive} onChange={(e) => setNewCategoryActive(e.target.checked)} />
                    <Label htmlFor="newCategoryActiveModal" className="text-sm font-medium">Ativa</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateCategory}>Criar Categoria</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 border rounded-md border-dashed dark:border-slate-700">
              <p className="text-muted-foreground">Nenhuma categoria cadastrada.</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus size={16} className="mr-2" /> Criar primeira categoria
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-2"> {/* Aplicando space-y aqui para espaçamento entre os CategoryItem */}
              {/* REMOVIDO DndContext e SortableContext */}
              {/* Ordenando por nome para exibição consistente, ou pela ordem do DB se loadCategories já faz isso */}
              {categories
                .slice() // Para não mutar o array original
                .sort((a, b) => a.name.localeCompare(b.name)) // Exemplo: ordenar por nome
                .map((category) => (
                  <CategoryItem key={category.id} category={category} /> // Usando CategoryItem simplificado
                ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="text-sm text-muted-foreground border-t dark:border-slate-700 pt-4">
          Total de categorias: {categories.length}
        </CardFooter>
      </Card>
    </AdminLayout>
  );
}