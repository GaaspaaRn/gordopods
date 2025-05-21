import React, { useState, useEffect, useRef } from 'react'; // useEffect e useRef não são usados nesta versão, podem ser removidos se não planeja usá-los aqui
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
    resetForm();
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
      
      <Dialog open={isDialogOpen} onOpenChange={(open) => { // Adicionado onOpenChange para resetar no fechamento
        setIsDialogOpen(open);
        if (!open) {
          resetForm();
        }
      }}>
        {/* Sua classe original do DialogContent era "sm:max-w-[550px]"
            Eu tinha sugerido "w-[90%] max-w-md sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-lg"
            Vou manter a sua original para não alterar o layout, mas adicionei overflow-y-auto se precisar.
            Se a sua classe original já era "w-[80%] max-w-md sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-lg", então está OK.
        */}
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto rounded-lg"> {/* Mantendo sua classe original + max-h e overflow */}
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
          </DialogHeader>
          
          {/* Sua estrutura interna original com padding */}
          <div className="grid gap-4 mt-2 py-4"> 
            <ProductImageGallery images={product.images} productName={product.name} />
            <div>
              <h4 className="font-medium mb-1">Descrição</h4>
              <p className="text-sm text-gray-600">{product.description}</p>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Preço</h4>
                <p className="text-lg font-bold" style={{ color: 'var(--secondary-color)' }}>
                  {calculatedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              {product.stockControl && typeof product.stockQuantity === 'number' && (
                <div className="text-right">
                  <span className="text-sm text-gray-500">
                    {product.stockQuantity > 0 ? `${product.stockQuantity} disponíveis` : "Fora de estoque"}
                  </span>
                </div>
              )}
            </div>
            
            {product.variationGroups.length > 0 && (
              <ProductVariations 
                variationGroups={product.variationGroups}
                onVariationsChange={handleVariationsChange}
              />
            )}
            
            <div>
              <Label htmlFor={`quantity-${product.id}`}>Quantidade</Label>
              <div className="flex items-center mt-1">
                <Button type="button" variant="outline" size="icon" onClick={decrementQuantity} disabled={quantity <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id={`quantity-${product.id}`}
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setQuantity(isNaN(value) || value < 1 ? 1 : Math.max(1, value)); // Garante que seja pelo menos 1
                  }}
                  className="w-20 mx-2 text-center"
                  tabIndex={-1} // <<--- ÚNICA ALTERAÇÃO SIGNIFICATIVA PARA O FOCO
                />
                <Button type="button" variant="outline" size="icon" onClick={incrementQuantity}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Mantive seu botão original, apenas corrigindo o uso da variável CSS se você precisar */}
            <Button 
              className="mt-4 w-full" 
              onClick={handleAddToCart} 
              disabled={isOutOfStock}
              // Se você quiser usar a cor primária aqui, use 'var(--primary-color)'
              // Exemplo: style={!isOutOfStock ? { backgroundColor: 'var(--primary-color)', color: 'white' } : {}}
            >
              <ShoppingCart className="mr-2" size={18} />
              {isOutOfStock ? "Produto esgotado" : "Adicionar ao Carrinho"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCard;