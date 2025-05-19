
import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

export function CheckoutPage() {
  const { cart, openCart } = useCart();

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg md:hidden">
      <Button
        onClick={openCart}
        className="w-full py-6 text-lg"
        disabled={cart.items.length === 0}
      >
        {cart.items.length === 0 ? (
          'Carrinho vazio'
        ) : (
          <>
            Finalizar Pedido ({formatCurrency(cart.subtotal)})
            <Send className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>

      {/* Espaçador para evitar que o conteúdo fique escondido atrás do botão fixo em mobile */}
      <div className="h-24 md:hidden"></div>
    </div>
  );
}

export default CheckoutPage;
