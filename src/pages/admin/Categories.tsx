
import { useState, useRef } from 'react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { GripVertical, Pencil, Trash2, Plus } from 'lucide-react';
import { useCategories } from '@/contexts/CategoryContext';
import { Category } from '@/types';

// Import sortable library
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// Sortable Item Component
const SortableItem = ({ category }: { category: Category }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: category.id 
  });
  
  const { updateCategory, deleteCategory } = useCategories();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState(category.name);
  
  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
  };

  const handleSave = () => {
    if (editName.trim()) {
      updateCategory(category.id, editName.trim());
      setIsEditDialogOpen(false);
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`bg-white rounded-lg border p-4 mb-2 flex items-center justify-between ${
        isDragging ? 'sortable-ghost' : ''
      }`}
    >
      <div className="flex items-center">
        <div 
          className="mr-3 drag-handle" 
          {...attributes} 
          {...listeners}
        >
          <GripVertical size={20} className="text-gray-400" />
        </div>
        <span>{category.name}</span>
      </div>
      
      <div className="flex gap-2">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Pencil size={16} />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Categoria</DialogTitle>
              <DialogDescription>
                Atualize o nome da categoria abaixo
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="categoryName">Nome da categoria</Label>
              <Input 
                id="categoryName" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Trash2 size={16} className="text-red-500" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja excluir a categoria "{category.name}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCategory(category.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default function Categories() {
  const { categories, createCategory, reorderCategories } = useCategories();
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat.id === active.id);
      const newIndex = categories.findIndex((cat) => cat.id === over.id);
      
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      reorderCategories(newOrder);
    }
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      createCategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsDialogOpen(false);
    }
  };

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categorias</CardTitle>
              <CardDescription>
                Gerencie as categorias da sua loja
              </CardDescription>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={16} className="mr-2" /> Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Categoria</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova categoria à sua loja
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="newCategoryName">Nome da categoria</Label>
                  <Input 
                    id="newCategoryName" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateCategory}>
                    Criar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 border rounded-md border-dashed">
              <p className="text-muted-foreground">
                Nenhuma categoria encontrada
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus size={16} className="mr-2" /> Criar primeira categoria
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm mb-2 text-muted-foreground">
                Arraste as categorias para reordenar
              </p>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext
                  items={categories.map(cat => cat.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {categories
                    .sort((a, b) => a.order - b.order)
                    .map((category) => (
                      <SortableItem key={category.id} category={category} />
                    ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="text-sm text-muted-foreground">
          Total de categorias: {categories.length}
        </CardFooter>
      </Card>
    </AdminLayout>
  );
}
