
import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { CartItem as CartItemType } from '@/types';

interface CartItemProps {
  item: CartItemType;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
}

export function CartItem({ item, updateQuantity, removeItem }: CartItemProps) {
  const handleQuantityChange = (delta: number) => {
    updateQuantity(item.id, item.quantity + delta);
  };

  return (
    <div className="cart-item">
      {/* Imagem do produto */}
      <div className="cart-item-image">
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.productName}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400 text-xs text-center">Sem imagem</span>
          </div>
        )}
      </div>

      {/* Informações do produto */}
      <div className="cart-item-content">
        {/* Nome e preço */}
        <div className="cart-item-header">
          <h3 className="cart-item-title">{item.productName}</h3>
          <span className="cart-item-price font-medium">
            {formatCurrency(item.totalPrice)}
          </span>
        </div>

        {/* Variações */}
        {item.selectedVariations && item.selectedVariations.length > 0 && (
          <div className="cart-item-variations">
            {item.selectedVariations.map((variation, index) => (
              <div key={index} className="flex flex-wrap">
                <span className="mr-1">{variation.groupName}:</span>
                <span>{variation.optionName}</span>
              </div>
            ))}
          </div>
        )}

        {/* Controles de quantidade */}
        <div className="cart-item-actions">
          <div className="cart-quantity-controls">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(-1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => removeItem(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
