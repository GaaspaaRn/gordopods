import React, { useState, useEffect, useRef } from 'react';
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

  // Cores de fallback para o botão desabilitado (ajuste conforme seu tema)
  const disabledBackgroundColor = '#E5E7EB'; // Ex: Tailwind bg-gray-200
  const disabledTextColor = '#6B7280';    // Ex: Tailwind text-gray-500

  return (
    <>
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300 rounded-lg bg-white">
        <div 
          className="aspect-[4/3] bg-gray-100 overflow-hidden cursor-pointer relative group" 
          onClick={handleOpenDialog}
        >
          {mainImage ? (
            <img
              src={mainImage.url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.src = "https://via.placeholder.com/300?text=Imagem"; }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
              Sem imagem
            </div>
          )}
        </div>
        
        <CardContent className="p-3 md:p-4 flex flex-col flex-grow">
          <h3 
            className="font-semibold text-sm md:text-base cursor-pointer hover:text-primary line-clamp-2 mb-1 flex-grow" 
            onClick={handleOpenDialog}
            title={product.name}
          >
            {product.name}
          </h3>
          
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-md md:text-lg" style={{ color: 'var(--secondary-color)' }}>
                {product.price.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </span>
              
              <Button 
                size="sm"
                onClick={handleOpenDialog}
                disabled={isOutOfStock}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 text-xs md:text-sm"
              >
                {isOutOfStock ? "Esgotado" : "Detalhes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          resetForm();
        }
      }}>
        {/* MODIFICAÇÃO PRINCIPAL NO DialogContent E ESTRUTURA INTERNA */}
        <DialogContent className="w-[90vw] max-w-md sm:max-w-lg md:max-w-xl max-h-[85vh] md:max-h-[90vh] flex flex-col rounded-lg p-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state-open]:slide-in-from-top-[48%]">
          <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-lg sm:text-xl font-semibold">{product.name}</DialogTitle>
            {/* Botão X do shadcn/ui é renderizado aqui */}
          </DialogHeader>
          
          {/* Esta div agora contém TODO o conteúdo rolável, incluindo quantidade e botão AddToCart */}
          <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4">
            <ProductImageGallery images={product.images} productName={product.name} />
            
            {product.description && (
              <div>
                <h4 className="font-medium mb-1 text-sm text-gray-500 dark:text-gray-400">Descrição</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400">Preço</h4>
                <p className="text-xl font-bold" style={{ color: 'var(--secondary-color)' }}>
                  {calculatedPrice.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
              </div>
              {product.stockControl && typeof product.stockQuantity === 'number' && (
                <div className="text-right">
                  <span className={`text-sm font-medium ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stockQuantity > 0 
                      ? `${product.stockQuantity} disponíveis` 
                      : "Fora de estoque"}
                  </span>
                </div>
              )}
            </div>
            
            {product.variationGroups.length > 0 && (
              <div className="border-t dark:border-gray-700 pt-4 mt-2">
                <ProductVariations 
                  variationGroups={product.variationGroups}
                  onVariationsChange={handleVariationsChange}
                />
              </div>
            )}
            
            {/* Quantidade e Botão Adicionar ao Carrinho agora estão DENTRO da área rolável */}
            {!isOutOfStock && (
              <div className="border-t dark:border-gray-700 pt-4 mt-2 space-y-4"> {/* Adicionado space-y-4 aqui */}
                <div> {/* Div para agrupar Label e Input/Buttons da Quantidade */}
                  <Label htmlFor={`quantity-${product.id}-modal`} className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Quantidade</Label>
                  <div className="flex items-center">
                    <Button type="button" variant="outline" size="icon" onClick={decrementQuantity} disabled={quantity <= 1} aria-label="Diminuir quantidade">
                      <Minus className="h-4 w-4" />
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
                      className="w-16 h-9 mx-2 text-center border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary"
                      tabIndex={-1} 
                    />
                    <Button type="button" variant="outline" size="icon" onClick={incrementQuantity} aria-label="Aumentar quantidade">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button 
                  className="w-full py-3 text-base font-semibold" // Removido mt-6, pois o space-y-4 no pai cuida do espaçamento
                  onClick={handleAddToCart}
                  style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}
                >
                  <ShoppingCart className="mr-2" size={20} />
                  Adicionar ao Carrinho
                </Button>
              </div>
            )}

            {isOutOfStock && (
               <div className="border-t dark:border-gray-700 pt-4 mt-2">
                 <Button 
                   className="w-full py-3 text-base font-semibold"
                   disabled={true}
                 >
                   Produto Esgotado
                 </Button>
               </div>
            )}
          </div> {/* Fim do conteúdo principal rolável */}
          
          {/* O footer fixo foi removido. O botão Adicionar ao Carrinho agora rola com o conteúdo. */}

        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCard;