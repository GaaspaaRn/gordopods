import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Cart, SelectedVariation, Product, Order } from '@/types';
import { toast } from 'sonner';
import { useStoreSettings } from './StoreSettingsContext';
import { supabase } from '@/integrations/supabase/client'; // *** ADICIONADO IMPORT DO SUPABASE ***
// import { useAuth } from './AuthContext'; // Descomente se precisar de autenticação para salvar pedidos

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity: number, selectedVariations: SelectedVariation[]) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  toggleCart: () => void;
  closeCart: () => void;
  openCart: () => void;
  saveOrderToDatabase: (order: Order) => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [], subtotal: 0 });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { storeSettings } = useStoreSettings();
  // const { isAuthenticated } = useAuth(); // Descomente se usar autenticação

  // Load cart from localStorage (mantido para o carrinho em si)
  useEffect(() => {
    const storedCart = localStorage.getItem('gordopods-cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (error) {
        console.error('Failed to parse stored cart:', error);
        localStorage.removeItem('gordopods-cart');
      }
    }
  }, []);

  // Save cart to localStorage (mantido para o carrinho em si)
  useEffect(() => {
    localStorage.setItem('gordopods-cart', JSON.stringify(cart));
  }, [cart]);

  // Calculate subtotal whenever the items change
  useEffect(() => {
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    if (cart.subtotal !== subtotal) {
      setCart(prev => ({ ...prev, subtotal }));
    }
  }, [cart.items]);

  // --- Funções do Carrinho (addToCart, updateQuantity, removeItem, clearCart, toggleCart, etc.) ---
  // Mantenha as implementações existentes de addToCart, updateQuantity, removeItem, clearCart, toggleCart, closeCart, openCart
  // Elas não precisam ser alteradas para esta correção.
  const addToCart = (product: Product, quantity: number, selectedVariations: SelectedVariation[]) => {
    const totalVariationPrice = selectedVariations.reduce(
      (sum, variation) => sum + variation.priceModifier,
      0
    );
    const itemUnitPrice = product.price + totalVariationPrice;
    const itemTotalPrice = itemUnitPrice * quantity;
    const mainImage = product.images.find(img => img.isMain) || product.images[0];
    const imageUrl = mainImage?.url;
    const existingItemIndex = cart.items.findIndex(item => {
      if (item.productId !== product.id) return false;
      if (item.selectedVariations.length !== selectedVariations.length) return false;
      const allVariationsMatch = selectedVariations.every(newVar => 
        item.selectedVariations.some(
          existingVar => 
            existingVar.groupId === newVar.groupId && 
            existingVar.optionId === newVar.optionId
        )
      );
      return allVariationsMatch;
    });
    if (existingItemIndex >= 0) {
      const updatedItems = [...cart.items];
      const existingItem = updatedItems[existingItemIndex];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + quantity,
        totalPrice: (existingItem.quantity + quantity) * itemUnitPrice
      };
      setCart({ ...cart, items: updatedItems });
      toast.success('Quantidade atualizada no carrinho!');
    } else {
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        quantity,
        basePrice: product.price,
        selectedVariations,
        totalPrice: itemTotalPrice,
        imageUrl
      };
      setCart({ ...cart, items: [...cart.items, newItem] });
      toast.success('Item adicionado ao carrinho!');
    }
    openCart();
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      return removeItem(itemId);
    }
    const updatedItems = cart.items.map(item => {
      if (item.id === itemId) {
        const unitPrice = item.basePrice + item.selectedVariations.reduce(
          (sum, variation) => sum + variation.priceModifier, 0
        );
        return {
          ...item,
          quantity,
          totalPrice: unitPrice * quantity
        };
      }
      return item;
    });
    setCart({ ...cart, items: updatedItems });
  };

  const removeItem = (itemId: string) => {
    const updatedItems = cart.items.filter(item => item.id !== itemId);
    setCart({ ...cart, items: updatedItems });
    toast.success('Item removido do carrinho!');
  };

  const clearCart = () => {
    setCart({ items: [], subtotal: 0 });
    // Não mostra toast aqui, pois é chamado após salvar pedido ou explicitamente
  };
  
  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const closeCart = () => setIsCartOpen(false);
  const openCart = () => setIsCartOpen(true);

  // *** FUNÇÃO MODIFICADA PARA SALVAR NO SUPABASE ***
  const saveOrderToDatabase = async (order: Order): Promise<boolean> => {
    // if (!isAuthenticated) { toast.error("Erro: Autenticação necessária para salvar."); return false; } // Descomente se usar RLS
    try {
      // Mapeamento do objeto Order para as colunas do Supabase (conforme SQL fornecido)
      const orderToInsert = {
        order_number: order.orderNumber,
        customer_name: order.customer.name,
        customer_phone: order.customer.phone,
        customer_address: order.customer.address ? JSON.stringify(order.customer.address) : null,
        items: JSON.stringify(order.items),
        subtotal: order.subtotal,
        delivery_option: JSON.stringify(order.deliveryOption),
        total: order.total,
        notes: order.notes,
        status: order.status,
        created_at: order.createdAt,
        whatsapp_sent: order.whatsappSent,
        // user_id: auth.user?.id // Adicione se quiser vincular ao usuário logado
      };

      const { error } = await supabase
        .from('orders') // Nome exato da sua tabela de pedidos
        .insert(orderToInsert);

      if (error) {
        throw error; // Lança o erro para o catch
      }

      console.log('Order saved successfully to Supabase:', order.orderNumber);
      // O clearCart() será chamado na função onSubmit do ShoppingCart após esta função retornar true
      return true;

    } catch (error: any) {
      console.error('Failed to save order to Supabase:', error);
      toast.error(`Falha ao registrar o pedido no sistema: ${error.message}`);
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        isCartOpen,
        toggleCart,
        closeCart,
        openCart,
        saveOrderToDatabase // Função agora salva no Supabase
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

