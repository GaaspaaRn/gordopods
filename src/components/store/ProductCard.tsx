import React, { useState } from 'react';
import { Product, SelectedVariation } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import ProductVariations from './ProductVariations';
import ProductImageGallery from './ProductImageGallery';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariations, setSelectedVariations] = useState<SelectedVariation[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState(product.price);
  
  const mainImage = product.images.find(img => img.isMain) || product.images[0];

  const handleVariationsChange = (variations: SelectedVariation[]) => {
    setSelectedVariations(variations);
    const totalModifier = variations.reduce((sum, variation) => sum + variation.priceModifier, 0);
    setCalculatedPrice(product.price + totalModifier);
  };
  
  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);
  
  const handleAddToCart = () => {
    const missingRequired = product.variationGroups
      .filter(group => group.required)
      .some(group => !selectedVariations.some(selected => selected.groupId === group.id));
      
    if (missingRequired) {
      alert("Por favor selecione todas as opções obrigatórias.");
      return;
    }
    
    if (product.stockControl && typeof product.stockQuantity === 'number' && product.stockQuantity < quantity) {
      alert(`Desculpe, apenas ${product.stockQuantity} unidades disponíveis.`);
      return;
    }
    
    addToCart(product, quantity, selectedVariations);
    setIsDialogOpen(false);
    // resetForm será chamado pelo onOpenChange
  };
  
  const resetForm = () => {
    setQuantity(1);
    setSelectedVariations([]);
    setCalculatedPrice(product.price);
  };
  
  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const isOutOfStock = product.stockControl && typeof product.stockQuantity === 'number' && product.stockQuantity <= 0;

  return (
    <>
      <Card className="h-full overflow-hidden hover:shadow-md transition">
        <div className="h-48 bg-gray-100 overflow-hidden cursor-pointer" onClick={handleOpenDialog}>
          {mainImage ? (
            <img
              src={mainImage.url}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.src = "https://via.placeholder.com/300?text=Imagem"; }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400">Sem imagem</span>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-medium cursor-pointer hover:text-primary" onClick={handleOpenDialog}>
            {product.name}
          </h3>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">
            {product.description.substring(0, 100)}{product.description.length > 100 ? '...' : ''}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-bold" style={{ color: 'var(--secondary-color)' }}>
              {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <Button size="sm" variant="outline" onClick={handleOpenDialog} disabled={isOutOfStock}>
              {isOutOfStock ? "Esgotado" : <>Ver detalhes</>}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          resetForm();
        }
      }}>
        <DialogContent className="w-[90vw] max-w-sm sm:max-w-md md:max-w-[500px] max-h-[90vh] flex flex-col rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* O DialogContent do shadcn/ui geralmente tem padding p-6. Se precisar de p-0, adicione aqui. */}
          {/* Se p-0, o DialogHeader precisará de padding próprio e o X pode precisar de posicionamento manual. */}
          {/* Por simplicidade, vou assumir o padding padrão do DialogContent. */}
          
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
            {/* Botão X do shadcn/ui é renderizado aqui pelo DialogContent */}
          </DialogHeader>
          
          {/* Esta div será a área principal de conteúdo rolável */}
          <div className="flex-grow overflow-y-auto space-y-3 md:space-y-4 pr-3 sm:pr-4 pl-3 sm:pl-4 pb-3 sm:pb-4"> {/* Adicionado padding aqui, pois DialogContent pode ter p-0 para o X */}
            <ProductImageGallery images={product.images} productName={product.name} />
            
            {product.description && (
                <div className="pt-2">
                    <h4 className="font-medium mb-0.5 text-sm">Descrição</h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-snug whitespace-pre-wrap">{product.description}</p>
                </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <div>
                <h4 className="font-medium text-sm">Preço</h4>
                <p className="text-lg font-bold" style={{ color: 'var(--secondary-color)' }}>
                  {calculatedPrice.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
              </div>
              {product.stockControl && typeof product.stockQuantity === 'number' && (
                <div className="text-right">
                  <span className={`text-xs sm:text-sm font-medium ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stockQuantity > 0 
                      ? `${product.stockQuantity} disponíveis` 
                      : "Fora de estoque"}
                  </span>
                </div>
              )}
            </div>
            
            {product.variationGroups.length > 0 && (
              <div className="border-t pt-3 mt-2">
                <ProductVariations 
                  variationGroups={product.variationGroups}
                  onVariationsChange={handleVariationsChange}
                />
              </div>
            )}
            
            {!isOutOfStock && (
              <div className="border-t pt-3 mt-2 space-y-3 md:space-y-4">
                <div>
                    <Label htmlFor={`quantity-${product.id}-modal`} className="text-xs sm:text-sm mb-1 block">Quantidade</Label>
                    <div className="flex items-center">
                        <Button type="button" variant="outline" size="icon" onClick={decrementQuantity} disabled={quantity <= 1} className="h-8 w-8 sm:h-9 sm:w-9">
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Input
                            id={`quantity-${product.id}-modal`}
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setQuantity(isNaN(value) || value < 1 ? 1 : value);
                            }}
                            className="w-12 sm:w-16 h-8 sm:h-9 mx-2 text-center"
                            tabIndex={-1} 
                        />
                        <Button type="button" variant="outline" size="icon" onClick={incrementQuantity} className="h-8 w-8 sm:h-9 sm:w-9">
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    </div>
                </div>

                <Button 
                  className="w-full py-2.5 sm:py-3 text-sm sm:text-base text-white" // Adicionado text-white
                  onClick={handleAddToCart}
                  // Aplicando a cor #0974f1 ao botão "Adicionar ao Carrinho"
                  style={{ backgroundColor: '#0974f1' }} 
                >
                  <ShoppingCart className="mr-2" size={16} />
                  Adicionar ao Carrinho
                </Button>
              </div>
            )}

            {isOutOfStock && (
               <div className="border-t pt-3 mt-2">
                 <Button 
                   className="w-full py-2.5 sm:py-3 text-sm sm:text-base"
                   disabled={true}
                 >
                   Produto Esgotado
                 </Button>
               </div>
            )}
          </div> {/* Fim do conteúdo rolável */}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCard;