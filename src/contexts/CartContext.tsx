
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Cart, SelectedVariation, Product, Order } from '@/types';
import { toast } from 'sonner';
import { useStoreSettings } from './StoreSettingsContext';

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
  
  // Use o hook useStoreSettings para obter as configurações da loja
  const { storeSettings } = useStoreSettings();
  
  // Load cart from localStorage
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

  // Save cart to localStorage
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

  const addToCart = (product: Product, quantity: number, selectedVariations: SelectedVariation[]) => {
    // Calculate the total price with variations
    const totalVariationPrice = selectedVariations.reduce(
      (sum, variation) => sum + variation.priceModifier,
      0
    );
    
    const itemUnitPrice = product.price + totalVariationPrice;
    const itemTotalPrice = itemUnitPrice * quantity;
    
    // Find main image URL
    const mainImage = product.images.find(img => img.isMain) || product.images[0];
    const imageUrl = mainImage?.url;
    
    // Check if the same product with the same variations already exists
    const existingItemIndex = cart.items.findIndex(item => {
      if (item.productId !== product.id) return false;
      
      // Check if variations match
      if (item.selectedVariations.length !== selectedVariations.length) return false;
      
      // Check each variation
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
      // Update quantity of existing item
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
      // Add new item
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
    
    // Open the cart when adding an item
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
    toast.success('Carrinho esvaziado!');
  };
  
  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const closeCart = () => setIsCartOpen(false);
  const openCart = () => setIsCartOpen(true);
  
  // Function to save order to database
  const saveOrderToDatabase = async (order: Order): Promise<boolean> => {
    try {
      // This would be replaced with an actual API call in a production environment
      // For now, we'll simulate the API call and store in localStorage for demo purposes
      
      // Generate timestamp for order if not provided
      if (!order.createdAt) {
        order.createdAt = new Date().toISOString();
      }
      
      // Retrieve existing orders or initialize empty array
      const existingOrdersJson = localStorage.getItem('gordopods-orders');
      const existingOrders = existingOrdersJson ? JSON.parse(existingOrdersJson) : [];
      
      // Add the new order
      existingOrders.push(order);
      
      // Save back to localStorage
      localStorage.setItem('gordopods-orders', JSON.stringify(existingOrders));
      
      console.log('Order saved successfully:', order);
      
      // Clear cart after successful order
      clearCart();
      
      return true;
    } catch (error) {
      console.error('Failed to save order:', error);
      toast.error('Falha ao registrar o pedido no sistema.');
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
        saveOrderToDatabase
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
