import React, { useState, useEffect } from 'react';
import { 
  Product, 
  ProductVariationGroup, 
  ProductVariationOption,
  Category
} from '@/types';
import { useProducts } from '@/contexts/ProductContext';
import { useCategories } from '@/contexts/CategoryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  CardFooter,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { 
  Trash2, 
  Plus, 
  Image as ImageIcon, 
  Star, 
  GripVertical,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/ui/image-uploader';

interface ProductFormProps {
  existingProduct?: Product | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProductForm({ existingProduct, onSave, onCancel }: ProductFormProps) {
  const { addProduct, updateProduct } = useProducts();
  const { categories } = useCategories();
  
  // Basic information state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [active, setActive] = useState(true);
  
  // Stock control state
  const [stockControl, setStockControl] = useState(false);
  const [stockQuantity, setStockQuantity] = useState('');
  const [autoStockReduction, setAutoStockReduction] = useState(false);
  
  // Images state
  const [images, setImages] = useState<{ id: string; url: string; isMain: boolean; order: number }[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  // Variations state
  const [variationGroups, setVariationGroups] = useState<ProductVariationGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupRequired, setNewGroupRequired] = useState(true);
  const [newGroupMultiple, setNewGroupMultiple] = useState(false);
  
  // Form state
  const [currentTab, setCurrentTab] = useState('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load existing product data if editing
  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name);
      setDescription(existingProduct.description);
      setPrice(existingProduct.price.toString());
      setCategoryId(existingProduct.categoryId);
      setActive(existingProduct.active);
      setStockControl(existingProduct.stockControl);
      setStockQuantity(existingProduct.stockQuantity?.toString() || '');
      setAutoStockReduction(existingProduct.autoStockReduction);
      setImages([...existingProduct.images]);
      setVariationGroups([...existingProduct.variationGroups]);
    } else {
      // Default values for new product
      setName('');
      setDescription('');
      setPrice('');
      setCategoryId(categories[0]?.id || '');
      setActive(true);
      setStockControl(false);
      setStockQuantity('');
      setAutoStockReduction(false);
      setImages([]);
      setVariationGroups([]);
    }
  }, [existingProduct, categories]);
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!price.trim()) newErrors.price = 'Preço é obrigatório';
    else if (isNaN(Number(price)) || Number(price) <= 0) newErrors.price = 'Preço deve ser um número positivo';
    if (!categoryId) newErrors.categoryId = 'Categoria é obrigatória';
    
    if (stockControl && !stockQuantity) newErrors.stockQuantity = 'Quantidade em estoque é obrigatória';
    else if (stockControl && (isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0)) 
      newErrors.stockQuantity = 'Quantidade deve ser um número não negativo';
    
    if (images.length === 0) newErrors.images = 'Adicione pelo menos uma imagem';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Determine which tab has errors and switch to it
      if (errors.name || errors.price || errors.categoryId) {
        setCurrentTab('basic');
      } else if (errors.stockQuantity) {
        setCurrentTab('stock');
      } else if (errors.images) {
        setCurrentTab('images');
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const productData = {
        name,
        description,
        price: Number(price),
        categoryId,
        images,
        variationGroups,
        stockControl,
        stockQuantity: stockControl ? Number(stockQuantity) : undefined,
        autoStockReduction,
        active,
      };
      
      if (existingProduct) {
        updateProduct(existingProduct.id, productData);
      } else {
        addProduct(productData);
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Image management functions
  const addImage = () => {
    if (!newImageUrl.trim()) {
      toast.error('URL da imagem é obrigatória');
      return;
    }
    
    const isMain = images.length === 0; // First image is main by default
    
    setImages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        url: newImageUrl.trim(),
        isMain,
        order: prev.length,
      }
    ]);
    
    setNewImageUrl('');
    setErrors(prev => ({ ...prev, images: '' }));
  };
  
  const removeImage = (id: string) => {
    const removedImage = images.find(img => img.id === id);
    const filteredImages = images.filter(img => img.id !== id);
    
    // If removed image was main, set first remaining image as main
    if (removedImage?.isMain && filteredImages.length > 0) {
      filteredImages[0].isMain = true;
    }
    
    // Update order of remaining images
    const updatedImages = filteredImages.map((img, index) => ({
      ...img,
      order: index
    }));
    
    setImages(updatedImages);
    
    if (updatedImages.length === 0) {
      setErrors(prev => ({ ...prev, images: 'Adicione pelo menos uma imagem' }));
    }
  };
  
  const setMainImage = (id: string) => {
    setImages(prev => 
      prev.map(img => ({
        ...img,
        isMain: img.id === id
      }))
    );
  };
  
  const moveImage = (id: string, direction: 'up' | 'down') => {
    const index = images.findIndex(img => img.id === id);
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === images.length - 1)) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newImages = [...images];
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    
    // Update orders
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      order: i
    }));
    
    setImages(reorderedImages);
  };
  
  // Variation group management functions
  const addVariationGroup = () => {
    if (!newGroupName.trim()) {
      toast.error('Nome do grupo é obrigatório');
      return;
    }
    
    setVariationGroups(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newGroupName.trim(),
        options: [],
        required: newGroupRequired,
        multipleSelection: newGroupMultiple,
      }
    ]);
    
    setNewGroupName('');
  };
  
  const removeVariationGroup = (id: string) => {
    setVariationGroups(prev => prev.filter(group => group.id !== id));
  };
  
  const addVariationOption = (groupId: string, name: string, priceModifier: number) => {
    if (!name.trim()) {
      toast.error('Nome da opção é obrigatório');
      return;
    }
    
    setVariationGroups(prev => 
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              options: [
                ...group.options,
                {
                  id: crypto.randomUUID(),
                  name: name.trim(),
                  priceModifier: priceModifier,
                  stock: undefined
                }
              ]
            }
          : group
      )
    );
  };
  
  const removeVariationOption = (groupId: string, optionId: string) => {
    setVariationGroups(prev => 
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.filter(option => option.id !== optionId)
            }
          : group
      )
    );
  };

  const updateVariationGroup = (id: string, updates: Partial<Omit<ProductVariationGroup, 'id'>>) => {
    setVariationGroups(prev => 
      prev.map(group =>
        group.id === id ? { ...group, ...updates } : group
      )
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="basic" className="flex-1">
            Informações Básicas
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex-1">
            Estoque
          </TabsTrigger>
          <TabsTrigger value="images" className="flex-1">
            Imagens
          </TabsTrigger>
          <TabsTrigger value="variations" className="flex-1">
            Variações
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nome do Produto *</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">Descrição</Label>
              <Textarea
                id="product-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-price">Preço Base (R$) *</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-category">Categoria *</Label>
                <Select
                  value={categoryId}
                  onValueChange={setCategoryId}
                >
                  <SelectTrigger 
                    id="product-category"
                    className={errors.categoryId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && <p className="text-red-500 text-sm">{errors.categoryId}</p>}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="product-active"
                checked={active}
                onCheckedChange={setActive}
              />
              <Label htmlFor="product-active">Produto Ativo (visível na loja)</Label>
            </div>
          </div>
        </TabsContent>

        {/* Stock Control Tab */}
        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="stock-control"
                  checked={stockControl}
                  onCheckedChange={setStockControl}
                />
                <Label htmlFor="stock-control">Habilitar Controle de Estoque</Label>
              </div>

              {stockControl && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock-quantity">Quantidade em Estoque *</Label>
                    <Input
                      id="stock-quantity"
                      type="number"
                      min="0"
                      step="1"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className={errors.stockQuantity ? "border-red-500" : ""}
                    />
                    {errors.stockQuantity && (
                      <p className="text-red-500 text-sm">{errors.stockQuantity}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-stock-reduction"
                      checked={autoStockReduction}
                      onCheckedChange={setAutoStockReduction}
                    />
                    <Label htmlFor="auto-stock-reduction">
                      Baixa Automática de Estoque (ao processar pedidos)
                    </Label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <ImageUploader 
                  label="Adicionar Nova Imagem"
                  folder="products"
                  onImageUploaded={(url) => {
                    if (url) {
                      const isMain = images.length === 0;
                      setImages(prev => [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          url,
                          isMain,
                          order: prev.length,
                        }
                      ]);
                      setErrors(prev => ({ ...prev, images: '' }));
                    }
                  }}
                />

                {errors.images && (
                  <p className="text-red-500 text-sm">{errors.images}</p>
                )}

                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-3">Imagens do Produto:</h3>
                  {images.length === 0 ? (
                    <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon size={40} className="mb-2 opacity-30" />
                      <p>Nenhuma imagem adicionada</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {images.map((image) => (
                        <div 
                          key={image.id}
                          className={`border rounded-md overflow-hidden relative ${
                            image.isMain ? 'ring-2 ring-primary' : ''
                          }`}
                        >
                          <img
                            src={image.url}
                            alt="Product"
                            className="w-full h-40 object-cover"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              e.currentTarget.src = "https://via.placeholder.com/300x300?text=Erro+na+imagem";
                            }}
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            {!image.isMain && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 bg-white bg-opacity-80"
                                onClick={() => setMainImage(image.id)}
                                title="Definir como principal"
                              >
                                <Star size={14} />
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="h-8 w-8 p-0 bg-white bg-opacity-80"
                              onClick={() => removeImage(image.id)}
                              title="Remover imagem"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                          {image.isMain && (
                            <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                              Principal
                            </div>
                          )}
                          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0 bg-white bg-opacity-80"
                              onClick={() => moveImage(image.id, 'up')}
                              disabled={image.order === 0}
                              title="Mover para cima"
                            >
                              <ArrowUp size={14} />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0 bg-white bg-opacity-80"
                              onClick={() => moveImage(image.id, 'down')}
                              disabled={image.order === images.length - 1}
                              title="Mover para baixo"
                            >
                              <ArrowDown size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variations Tab */}
        <TabsContent value="variations" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Adicionar Grupo de Variações</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="group-name">Nome do Grupo</Label>
                      <Input
                        id="group-name"
                        placeholder="Ex: Tamanho, Cor, Sabor"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="group-required"
                            checked={newGroupRequired}
                            onCheckedChange={setNewGroupRequired}
                          />
                          <Label htmlFor="group-required">Seleção Obrigatória</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="group-multiple"
                            checked={newGroupMultiple}
                            onCheckedChange={setNewGroupMultiple}
                          />
                          <Label htmlFor="group-multiple">
                            Permitir Múltipla Seleção
                          </Label>
                        </div>
                      </div>
                      <Button type="button" onClick={addVariationGroup}>
                        <Plus size={16} className="mr-2" /> Adicionar
                      </Button>
                    </div>
                  </div>
                </div>

                {variationGroups.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">Grupos de Variações:</h3>
                    <Accordion type="multiple" className="w-full">
                      {variationGroups.map((group) => (
                        <VariationGroupItem
                          key={group.id}
                          group={group}
                          onUpdate={(updates) => updateVariationGroup(group.id, updates)}
                          onRemove={() => removeVariationGroup(group.id)}
                          onAddOption={addVariationOption}
                          onRemoveOption={removeVariationOption}
                        />
                      ))}
                    </Accordion>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Salvando...'
            : existingProduct
            ? 'Atualizar Produto'
            : 'Criar Produto'}
        </Button>
      </div>
    </form>
  );
}

// Helper component for variation groups
interface VariationGroupItemProps {
  group: ProductVariationGroup;
  onUpdate: (updates: Partial<Omit<ProductVariationGroup, 'id'>>) => void;
  onRemove: () => void;
  onAddOption: (groupId: string, name: string, priceModifier: number) => void;
  onRemoveOption: (groupId: string, optionId: string) => void;
}

function VariationGroupItem({
  group,
  onUpdate,
  onRemove,
  onAddOption,
  onRemoveOption,
}: VariationGroupItemProps) {
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState('0');

  const handleAddOption = () => {
    if (!newOptionName.trim()) return;
    
    onAddOption(group.id, newOptionName, Number(newOptionPrice) || 0);
    setNewOptionName('');
    setNewOptionPrice('0');
  };

  return (
    <AccordionItem value={group.id}>
      <AccordionTrigger className="hover:no-underline">
        <span className="flex items-center gap-2">
          {group.name}
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {group.options.length} opções
          </span>
          {group.required && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Obrigatório
            </span>
          )}
          {group.multipleSelection && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Múltipla escolha
            </span>
          )}
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pb-4">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id={`${group.id}-required`}
                checked={group.required}
                onCheckedChange={(checked) => onUpdate({ required: checked })}
              />
              <Label htmlFor={`${group.id}-required`}>Seleção Obrigatória</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id={`${group.id}-multiple`}
                checked={group.multipleSelection}
                onCheckedChange={(checked) => onUpdate({ multipleSelection: checked })}
              />
              <Label htmlFor={`${group.id}-multiple`}>
                Permitir Múltipla Seleção
              </Label>
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onRemove}
          >
            <Trash2 size={16} className="mr-2" /> Remover Grupo
          </Button>
        </div>

        <div className="space-y-4 mt-4">
          <h4 className="text-sm font-medium">Adicionar Opção</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label htmlFor={`${group.id}-option-name`}>Nome da Opção</Label>
              <Input
                id={`${group.id}-option-name`}
                placeholder="Ex: Pequeno, Vermelho, Menta"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${group.id}-option-price`}>
                Diferença de Preço (R$)
              </Label>
              <div className="flex gap-2">
                <Input
                  id={`${group.id}-option-price`}
                  type="number"
                  step="0.01"
                  value={newOptionPrice}
                  onChange={(e) => setNewOptionPrice(e.target.value)}
                />
                <Button type="button" onClick={handleAddOption}>
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {group.options.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Opções:</h4>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diferença de Preço
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {group.options.map((option) => (
                    <tr key={option.id}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {option.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {option.priceModifier > 0
                          ? `+${option.priceModifier.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}`
                          : option.priceModifier < 0
                          ? option.priceModifier.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })
                          : 'Sem alteração'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveOption(group.id, option.id)}
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
