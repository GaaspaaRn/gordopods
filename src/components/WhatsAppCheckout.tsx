
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { formatCurrency } from '@/utils/format';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Order } from '@/types';

interface CustomerInfo {
  name: string;
  phone: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    district: string;
  };
}

interface CheckoutFormProps {
  onSubmit: (order: Order) => void;
}

export function WhatsAppCheckout({ onSubmit }: CheckoutFormProps) {
  const { cart } = useCart();
  const { storeSettings, deliverySettings } = useStoreSettings();
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
  });
  
  const [notes, setNotes] = useState('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'fixedRate' | 'neighborhood'>('pickup');
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>('');
  
  // Calcular taxa de entrega com base na seleção
  const getDeliveryFee = () => {
    switch (deliveryType) {
      case 'pickup':
        return 0;
      case 'fixedRate':
        return deliverySettings?.fixedRate?.fee || 0;
      case 'neighborhood': {
        const neighborhood = deliverySettings?.neighborhoodRates?.neighborhoods.find(
          n => n.id === selectedNeighborhoodId
        );
        return neighborhood?.fee || 0;
      }
      default:
        return 0;
    }
  };
  
  const getDeliveryName = () => {
    switch (deliveryType) {
      case 'pickup':
        return 'Retirada no local';
      case 'fixedRate':
        return deliverySettings?.fixedRate?.description || 'Taxa fixa';
      case 'neighborhood': {
        const neighborhood = deliverySettings?.neighborhoodRates?.neighborhoods.find(
          n => n.id === selectedNeighborhoodId
        );
        return `Entrega para ${neighborhood?.name || 'bairro selecionado'}`;
      }
      default:
        return '';
    }
  };
  
  const total = cart.subtotal + getDeliveryFee();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se o formulário está válido
    if (!customerInfo.name || !customerInfo.phone) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    // Se for entrega, verificar se o endereço está preenchido
    if (deliveryType !== 'pickup' && 
        (!customerInfo.address?.street || 
         !customerInfo.address?.number || 
         !customerInfo.address?.district)) {
      alert('Por favor, preencha o endereço completo para entrega.');
      return;
    }
    
    // Verificar se há itens no carrinho
    if (cart.items.length === 0) {
      alert('Seu carrinho está vazio.');
      return;
    }
    
    // Criar objeto de ordem
    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber: `#${Math.floor(Date.now() / 1000).toString().slice(-6)}`,
      customer: customerInfo,
      items: cart.items,
      subtotal: cart.subtotal,
      deliveryOption: {
        type: deliveryType,
        name: getDeliveryName(),
        fee: getDeliveryFee(),
        neighborhoodId: deliveryType === 'neighborhood' ? selectedNeighborhoodId : undefined,
        neighborhoodName: deliveryType === 'neighborhood' 
          ? deliverySettings?.neighborhoodRates?.neighborhoods.find(n => n.id === selectedNeighborhoodId)?.name 
          : undefined
      },
      total,
      notes,
      status: 'Novo',
      createdAt: new Date().toISOString(),
      whatsappSent: false
    };
    
    onSubmit(order);
  };
  
  // Renderizar opções de forma condicional
  const renderDeliveryOptions = () => {
    // Verificar quais opções estão habilitadas
    const hasPickup = deliverySettings?.pickup?.enabled;
    const hasFixedRate = deliverySettings?.fixedRate?.enabled;
    const hasNeighborhood = deliverySettings?.neighborhoodRates?.enabled && 
                            deliverySettings?.neighborhoodRates?.neighborhoods.length > 0;
    
    // Se nenhuma opção estiver habilitada, mostrar mensagem
    if (!hasPickup && !hasFixedRate && !hasNeighborhood) {
      return (
        <div className="text-center py-4 text-gray-500">
          Nenhuma opção de entrega configurada.
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <Label>Forma de recebimento</Label>
        <Select 
          value={deliveryType} 
          onValueChange={(value) => setDeliveryType(value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione como deseja receber" />
          </SelectTrigger>
          <SelectContent>
            {hasPickup && (
              <SelectItem value="pickup">Retirar no local</SelectItem>
            )}
            {hasFixedRate && (
              <SelectItem value="fixedRate">
                Entrega com taxa fixa ({formatCurrency(deliverySettings?.fixedRate?.fee || 0)})
              </SelectItem>
            )}
            {hasNeighborhood && (
              <SelectItem value="neighborhood">Entrega por bairros</SelectItem>
            )}
          </SelectContent>
        </Select>
        
        {/* Mostrar seleção de bairros se a opção for entrega por bairros */}
        {deliveryType === 'neighborhood' && (
          <div>
            <Label>Bairro</Label>
            <Select 
              value={selectedNeighborhoodId} 
              onValueChange={setSelectedNeighborhoodId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu bairro" />
              </SelectTrigger>
              <SelectContent>
                {deliverySettings?.neighborhoodRates?.neighborhoods.map(neighborhood => (
                  <SelectItem key={neighborhood.id} value={neighborhood.id}>
                    {neighborhood.name} ({formatCurrency(neighborhood.fee)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Mostrar instruções para retirada se a opção for retirada */}
        {deliveryType === 'pickup' && deliverySettings?.pickup?.instructions && (
          <div className="bg-muted p-3 rounded-md text-sm">
            <p>{deliverySettings.pickup.instructions}</p>
          </div>
        )}
        
        {/* Mostrar campos de endereço se for entrega */}
        {deliveryType !== 'pickup' && (
          <div className="space-y-4 mt-4">
            <h3 className="font-medium">Endereço de entrega</h3>
            
            <div>
              <Label htmlFor="street">Rua/Avenida</Label>
              <Input 
                id="street" 
                placeholder="Ex: Av. Brasil" 
                value={customerInfo.address?.street || ''} 
                onChange={(e) => setCustomerInfo({
                  ...customerInfo, 
                  address: { 
                    ...(customerInfo.address || {}), 
                    street: e.target.value,
                    number: customerInfo.address?.number || '',
                    district: customerInfo.address?.district || ''
                  }
                })}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="number">Número</Label>
                <Input 
                  id="number" 
                  placeholder="Ex: 123" 
                  value={customerInfo.address?.number || ''} 
                  onChange={(e) => setCustomerInfo({
                    ...customerInfo, 
                    address: { 
                      ...(customerInfo.address || {}), 
                      number: e.target.value,
                      street: customerInfo.address?.street || '',
                      district: customerInfo.address?.district || ''
                    }
                  })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="complement">Complemento (opcional)</Label>
                <Input 
                  id="complement" 
                  placeholder="Ex: Apto 101" 
                  value={customerInfo.address?.complement || ''} 
                  onChange={(e) => setCustomerInfo({
                    ...customerInfo, 
                    address: { 
                      ...(customerInfo.address || {}), 
                      complement: e.target.value,
                      street: customerInfo.address?.street || '',
                      number: customerInfo.address?.number || '',
                      district: customerInfo.address?.district || ''
                    }
                  })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="district">Bairro</Label>
              <Input 
                id="district" 
                placeholder="Ex: Centro" 
                value={customerInfo.address?.district || ''} 
                onChange={(e) => setCustomerInfo({
                  ...customerInfo, 
                  address: { 
                    ...(customerInfo.address || {}), 
                    district: e.target.value,
                    street: customerInfo.address?.street || '',
                    number: customerInfo.address?.number || ''
                  }
                })}
                required
              />
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dados do cliente */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Dados para o pedido</h3>
        
        <div>
          <Label htmlFor="name">Nome completo</Label>
          <Input 
            id="name" 
            placeholder="Seu nome completo" 
            value={customerInfo.name} 
            onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="phone">WhatsApp</Label>
          <Input 
            id="phone" 
            placeholder="(DDD) 9XXXX-XXXX" 
            value={customerInfo.phone} 
            onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
            required
          />
        </div>
      </div>
      
      {/* Opções de entrega */}
      <div className="border-t pt-4">
        {renderDeliveryOptions()}
      </div>
      
      {/* Observações */}
      <div>
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea 
          id="notes" 
          placeholder="Alguma instrução especial para seu pedido?" 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
      
      {/* Resumo do pedido */}
      <div className="border-t pt-4">
        <div className="flex justify-between py-2">
          <span>Subtotal:</span>
          <span>{formatCurrency(cart.subtotal)}</span>
        </div>
        
        <div className="flex justify-between py-2">
          <span>Taxa de entrega:</span>
          <span>{formatCurrency(getDeliveryFee())}</span>
        </div>
        
        <div className="flex justify-between py-2 font-bold text-lg">
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
      
      {/* Botão de enviar */}
      <Button type="submit" className="w-full py-6 text-lg">
        Finalizar e Enviar no WhatsApp
      </Button>
    </form>
  );
}

export function generateWhatsAppMessage(order: Order): string {
  // Formatação da mensagem para o WhatsApp
  let message = `*Pedido ${order.orderNumber} - ${order.customer.name}*\n\n`;
  
  // Dados do cliente
  message += `📱 *Cliente*: ${order.customer.name}\n`;
  message += `📞 *Telefone*: ${order.customer.phone}\n`;
  
  // Endereço se for entrega
  if (order.deliveryOption.type !== 'pickup' && order.customer.address) {
    message += `\n📍 *Endereço*:\n`;
    message += `${order.customer.address.street}, ${order.customer.address.number}\n`;
    
    if (order.customer.address.complement) {
      message += `Complemento: ${order.customer.address.complement}\n`;
    }
    
    message += `Bairro: ${order.customer.address.district}\n`;
  }
  
  // Itens do pedido
  message += `\n🛒 *Itens do pedido*:\n`;
  
  order.items.forEach((item, index) => {
    message += `${index + 1}. ${item.quantity}x ${item.productName} - ${formatCurrency(item.totalPrice)}\n`;
    
    // Adicionar variações se existirem
    if (item.selectedVariations && item.selectedVariations.length > 0) {
      item.selectedVariations.forEach(variation => {
        message += `   • ${variation.groupName}: ${variation.optionName}\n`;
      });
    }
  });
  
  // Subtotal e taxa de entrega
  message += `\n💰 *Subtotal*: ${formatCurrency(order.subtotal)}\n`;
  message += `🚚 *${order.deliveryOption.name}*: ${formatCurrency(order.deliveryOption.fee)}\n`;
  message += `💵 *Total*: ${formatCurrency(order.total)}\n`;
  
  // Observações se existirem
  if (order.notes) {
    message += `\n📝 *Observações*:\n${order.notes}\n`;
  }
  
  return message;
}

export function redirectToWhatsApp(order: Order, whatsappNumber: string): void {
  const message = generateWhatsAppMessage(order);
  const encodedMessage = encodeURIComponent(message);
  
  // Formatar número de telefone (remover caracteres não numéricos)
  const formattedNumber = whatsappNumber.replace(/\D/g, '');
  
  // Construir URL do WhatsApp
  const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
  
  // Redirecionar
  window.open(whatsappUrl, '_blank');
}
