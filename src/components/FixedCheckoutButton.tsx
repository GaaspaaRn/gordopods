// src/components/FixedCheckoutButton.tsx
import React from 'react';
import { Button } from './ui/button';
import { formatCurrency } from '../utils/format';
import { ArrowRight } from 'lucide-react';

interface FixedCheckoutButtonProps {
  totalPrice: number;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function FixedCheckoutButton({
  totalPrice,
  onClick,
  disabled = false,
  isLoading = false
}: FixedCheckoutButtonProps) {
  return (
    <>
      {/* Botão fixo para mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg md:hidden z-50">
        <Button
          onClick={onClick}
          className="w-full py-6 text-lg"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            'Processando...'
          ) : (
            <>
              Finalizar Pedido ({formatCurrency(totalPrice)})
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
      
      {/* Versão para desktop */}
      <div className="hidden md:block">
        <Button
          onClick={onClick}
          className="w-full py-6 text-lg"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            'Processando...'
          ) : (
            <>
              Finalizar Pedido
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
      
      {/* Espaçador para mobile */}
      <div className="h-24 md:hidden"></div>
    </>
  );
}
