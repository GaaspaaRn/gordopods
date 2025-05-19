
import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

interface ProductDetailsProps {
  handleAddToCart: () => void;
  allRequiredVariationsSelected: () => boolean;
}

export function ProductDetails({ handleAddToCart, allRequiredVariationsSelected }: ProductDetailsProps) {
  return (
    <div className="product-details-container">
      {/* Conteúdo do produto */}
      <div className="product-content-area">
        {/* Imagens e informações básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* ... conteúdo existente ... */}
        </div>
        
        {/* Variações */}
        <div className="space-y-6">
          {/* ... conteúdo existente ... */}
          
          {/* Espaçador para garantir que o botão não cubra conteúdo em mobile */}
          <div className="h-16 md:hidden"></div>
        </div>
      </div>
      
      {/* Botão de adicionar ao carrinho - FIXADO NA PARTE INFERIOR */}
      <div className="product-button-container">
        <Button
          onClick={handleAddToCart}
          disabled={!allRequiredVariationsSelected()}
          className="add-to-cart-button"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          Adicionar ao Pedido
        </Button>
      </div>
    </div>
  );
}
