
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useProducts } from '@/contexts/ProductContext';
import { useCategories } from '@/contexts/CategoryContext';
import { Product, ProductVariationGroup, ProductVariationOption } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff, 
  Filter, 
  Image,
  X,
  ArrowUp,
  ArrowDown,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import ProductForm from '@/components/admin/ProductForm';

export default function Products() {
  const { products, isLoading, deleteProduct, toggleProductStatus } = useProducts();
  const { categories } = useCategories();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Apply filters and search when products or filter criteria change
  useEffect(() => {
    if (isLoading) return;

    let result = [...products];

    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(product => product.categoryId === categoryFilter);
    }

    // Apply status filter
    if (statusFilter === 'active') {
      result = result.filter(product => product.active);
    } else if (statusFilter === 'inactive') {
      result = result.filter(product => !product.active);
    }

    // Apply search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.description.toLowerCase().includes(term)
      );
    }

    setFilteredProducts(result);
  }, [products, searchTerm, categoryFilter, statusFilter, isLoading]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowAddDialog(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gerenciamento de Produtos</h1>
            <p className="text-muted-foreground">
              Adicione, edite e gerencie os produtos da sua loja
            </p>
          </div>
          <Button onClick={() => {
            setEditingProduct(null);
            setShowAddDialog(true);
          }}>
            <Plus size={18} className="mr-2" /> Adicionar Produto
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div>
                <Label htmlFor="category-filter" className="sr-only">Filtrar por Categoria</Label>
                <Select 
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger id="category-filter">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status-filter" className="sr-only">Filtrar por Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
              >
                <Filter size={16} className="mr-2" /> Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <p>Carregando produtos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <p className="text-muted-foreground mb-4">Nenhum produto encontrado</p>
              {products.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Imagem</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Estoque</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const category = categories.find(c => c.id === product.categoryId);
                      const mainImage = product.images.find(img => img.isMain) || product.images[0];
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="h-12 w-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                              {mainImage ? (
                                <img
                                  src={mainImage.url}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                    e.currentTarget.src = "https://via.placeholder.com/80?text=Erro";
                                  }}
                                />
                              ) : (
                                <Image size={24} className="text-gray-400" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{product.name}</div>
                          </TableCell>
                          <TableCell>
                            {category ? category.name : 'Sem categoria'}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.price.toLocaleString('pt-BR', {
                              style: 'currency', 
                              currency: 'BRL'
                            })}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleProductStatus(product.id)}
                              className={`${
                                product.active ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {product.active ? (
                                <>
                                  <Eye size={16} className="mr-2" /> Ativo
                                </>
                              ) : (
                                <>
                                  <EyeOff size={16} className="mr-2" /> Inativo
                                </>
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">
                            {product.stockControl ? (
                              <span>{product.stockQuantity || 0}</span>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                              >
                                <Edit size={16} />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 size={16} className="text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remover Produto</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja remover permanentemente o produto "{product.name}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteProduct(product.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Remover
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Product Form Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'Altere as informações do produto conforme necessário.' 
                : 'Preencha todas as informações para adicionar um novo produto.'}
            </DialogDescription>
          </DialogHeader>
          
          <ProductForm 
            existingProduct={editingProduct} 
            onSave={() => setShowAddDialog(false)}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
