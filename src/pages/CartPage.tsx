
import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

// Componente FixedCheckoutButton
export function FixedCheckoutButton() {
  const { cart, openCart } = useCart();
  
  if (cart.items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg md:hidden">
      <Button
        onClick={openCart}
        className="w-full py-6 text-lg"
      >
        <>
          Finalizar Pedido ({formatCurrency(cart.subtotal)})
          <Send className="ml-2 h-5 w-5" />
        </>
      </Button>
    </div>
  );
}
