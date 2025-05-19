
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
    
    // Calculate new price
    const totalModifier = variations.reduce(
      (sum, variation) => sum + variation.priceModifier, 
      0
    );
    
    setCalculatedPrice(product.price + totalModifier);
  };
  
  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);
  
  const handleAddToCart = () => {
    // Check if required variations are selected
    const missingRequired = product.variationGroups
      .filter(group => group.required)
      .some(group => 
        !selectedVariations.some(selected => selected.groupId === group.id)
      );
      
    if (missingRequired) {
      alert("Por favor selecione todas as opções obrigatórias.");
      return;
    }
    
    // Check stock
    if (product.stockControl && 
        typeof product.stockQuantity === 'number' && 
        product.stockQuantity < quantity) {
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

  const isOutOfStock = 
    product.stockControl && 
    typeof product.stockQuantity === 'number' && 
    product.stockQuantity <= 0;

  return (
    <>
      <Card className="h-full overflow-hidden hover:shadow-md transition">
        {/* Product thumbnail */}
        <div 
          className="h-48 bg-gray-100 overflow-hidden cursor-pointer" 
          onClick={handleOpenDialog}
        >
          {mainImage ? (
            <img
              src={mainImage.url}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = "https://via.placeholder.com/300?text=Imagem";
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400">Sem imagem</span>
            </div>
          )}
        </div>
        
        {/* Product info */}
        <CardContent className="p-4">
          <h3 
            className="font-medium cursor-pointer hover:text-primary" 
            onClick={handleOpenDialog}
          >
            {product.name}
          </h3>
          
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">
            {product.description.substring(0, 100)}
            {product.description.length > 100 ? '...' : ''}
          </p>
          
          <div className="mt-2 flex items-center justify-between">
            <span className="font-bold" style={{ color: 'var(--secondary-color)' }}>
              {product.price.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </span>
            
            <Button 
              size="sm"
              variant="outline"
              onClick={handleOpenDialog}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? (
                "Esgotado"
              ) : (
                <>Ver detalhes</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Product detail dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 mt-2">
            {/* Product images gallery */}
            <ProductImageGallery images={product.images} productName={product.name} />
            
            {/* Description */}
            <div>
              <h4 className="font-medium mb-1">Descrição</h4>
              <p className="text-sm text-gray-600">{product.description}</p>
            </div>
            
            {/* Price display */}
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Preço</h4>
                <p className="text-lg font-bold" style={{ color: 'var(--secondary-color)' }}>
                  {calculatedPrice.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
              </div>
              
              {/* Stock info if applicable */}
              {product.stockControl && typeof product.stockQuantity === 'number' && (
                <div className="text-right">
                  <span className="text-sm text-gray-500">
                    {product.stockQuantity > 0 
                      ? `${product.stockQuantity} disponíveis` 
                      : "Fora de estoque"}
                  </span>
                </div>
              )}
            </div>
            
            {/* Variations selection */}
            {product.variationGroups.length > 0 && (
              <ProductVariations 
                variationGroups={product.variationGroups}
                onVariationsChange={handleVariationsChange}
              />
            )}
            
            {/* Quantity selector */}
            <div>
              <Label htmlFor="quantity">Quantidade</Label>
              <div className="flex items-center mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setQuantity(isNaN(value) ? 1 : Math.max(1, value));
                  }}
                  className="w-20 mx-2 text-center"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={incrementQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Add to cart button */}
            <Button 
              className="mt-4" 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <ShoppingCart className="mr-2" size={18} />
              {isOutOfStock 
                ? "Produto esgotado" 
                : "Adicionar ao Carrinho"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCard;
