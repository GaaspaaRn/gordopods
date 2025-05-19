
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { WhatsAppCheckout, redirectToWhatsApp } from '@/components/WhatsAppCheckout';
import { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function CheckoutCompletePage() {
  const { cart, saveOrderToDatabase } = useCart();
  const { storeSettings } = useStoreSettings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Verificar se o carrinho está vazio
  if (cart.items.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Seu carrinho está vazio</h2>
          <p className="text-muted-foreground">Adicione produtos ao seu carrinho antes de finalizar o pedido.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Voltar para a loja
          </Button>
        </div>
      </div>
    );
  }
  
  const handleOrderSubmit = async (order: Order) => {
    try {
      setLoading(true);
      
      // Salvar o pedido no banco de dados ou localStorage
      const saved = await saveOrderToDatabase(order);
      
      if (saved) {
        // Redirecionar para o WhatsApp
        redirectToWhatsApp(order, storeSettings.whatsappNumber);
        
        // Redirecionar de volta para a loja após um curto período
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      alert('Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para a loja</span>
        </Button>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Finalizar Pedido</h1>
      
      {/* Formulário de checkout */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <WhatsAppCheckout onSubmit={handleOrderSubmit} />
      </div>
    </div>
  );
}

export default CheckoutCompletePage;
