import React, { useState } from 'react'; // Removido useEffect e useRef não utilizados
import { Product, SelectedVariation } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // DialogClose é implícito
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
    // resetForm() será chamado pelo onOpenChange
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

  // Cores para o botão desabilitado (se necessário, senão o estilo padrão do botão será usado)
  // const disabledBackgroundColor = '#E5E7EB'; // Ex: cinza claro
  // const disabledTextColor = '#9CA3AF';    // Ex: cinza médio

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
        {/* Tentando diminuir a largura máxima e garantindo paddings padrão do DialogContent para o X aparecer */}
        {/* Mantendo max-h e overflow para o caso de conteúdo extenso */}
        <DialogContent className="w-[90vw] max-w-sm sm:max-w-md md:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-lg"> {/* Ajuste max-w-md e md:max-w-[500px] */}
          <DialogHeader> {/* O padding padrão do DialogContent deve cuidar do espaçamento do X */}
            <DialogTitle>{product.name}</DialogTitle>
          </DialogHeader>
          
          {/* Conteúdo principal do diálogo. Ajuste os paddings e margins internos aqui se necessário */}
          <div className="grid gap-3 md:gap-4 mt-1 md:mt-2"> {/* Reduzido gap e mt */}
            <ProductImageGallery images={product.images} productName={product.name} />
            
            {product.description && ( // Mostrar descrição apenas se existir
                <div>
                <h4 className="font-medium mb-0.5 text-sm">Descrição</h4> {/* Reduzido mb */}
                <p className="text-xs sm:text-sm text-gray-600 leading-snug">{product.description}</p> {/* Reduzido leading e tamanho da fonte */}
                </div>
            )}

            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-sm">Preço</h4>
                <p className="text-lg font-bold" style={{ color: 'var(--secondary-color)' }}>
                  {calculatedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
              <ProductVariations 
                variationGroups={product.variationGroups}
                onVariationsChange={handleVariationsChange}
              />
            )}
            
            {!isOutOfStock && ( // Só mostra se não estiver esgotado
                <div className="mt-2"> {/* Adicionado mt-2 para separar da seção anterior */}
                    <Label htmlFor={`quantity-${product.id}-modal`} className="text-xs sm:text-sm mb-1 block">Quantidade</Label>
                    <div className="flex items-center">
                        <Button type="button" variant="outline" size="icon" onClick={decrementQuantity} disabled={quantity <= 1} className="h-8 w-8 sm:h-9 sm:w-9"> {/* Tamanho de botão menor */}
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
                        className="w-12 sm:w-16 h-8 sm:h-9 mx-2 text-center" // Largura e altura menores
                        tabIndex={-1} // Para impedir foco automático e abertura do teclado no mobile
                        />
                        <Button type="button" variant="outline" size="icon" onClick={incrementQuantity} className="h-8 w-8 sm:h-9 sm:w-9"> {/* Tamanho de botão menor */}
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    </div>
                </div>
            )}
            
            <Button 
              className="mt-3 md:mt-4 w-full py-2.5 sm:py-3 text-sm sm:text-base" // Padding e texto menores
              onClick={handleAddToCart} 
              disabled={isOutOfStock}
              // Aplicando a cor secundária ao botão "Adicionar ao Carrinho"
              style={!isOutOfStock ? { backgroundColor: 'var(--secondary-color)', color: 'white' } : {}}
            >
              <ShoppingCart className="mr-2" size={16} /> {/* Ícone menor */}
              {isOutOfStock ? "Produto Esgotado" : "Adicionar ao Carrinho"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCard;