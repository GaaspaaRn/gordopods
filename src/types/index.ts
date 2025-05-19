
export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  order?: number; // Adicionando campo order para compatibilidade
}

export interface ProductImage {
  id: string;
  url: string;
  isMain: boolean;
  order: number;
}

export interface ProductVariationOption {
  id: string;
  name: string;
  priceModifier: number;
}

export interface ProductVariationGroup {
  id: string;
  name: string;
  options: ProductVariationOption[];
  required: boolean;
  multipleSelection: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  images: ProductImage[];
  variationGroups: ProductVariationGroup[];
  stockControl: boolean;
  stockQuantity: number;
  autoStockReduction: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
}

export interface StoreSettings {
  storeName: string;
  logo: string;
  banner: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
  socialLinks: SocialLink[];
  contactInfo: {
    phone: string;
    email: string;
  };
  whatsappNumber: string; // Campo para número de WhatsApp
}

export interface Neighborhood {
  id: string;
  name: string;
  fee: number;
}

export interface DeliverySettings {
  pickup: {
    enabled: boolean;
    instructions: string;
  };
  fixedRate: {
    enabled: boolean;
    fee: number;
    description: string;
  };
  neighborhoodRates: {
    enabled: boolean;
    neighborhoods: Neighborhood[];
  };
}

export interface StoreConfig {
  whatsappNumber: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

// Interfaces para o carrinho de compras
export interface SelectedVariation {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceModifier: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  basePrice: number;
  selectedVariations: SelectedVariation[];
  totalPrice: number;
  imageUrl?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}

// Interface para pedidos
export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    address?: {
      street: string;
      number: string;
      complement?: string;
      district: string;
    };
  };
  items: CartItem[];
  subtotal: number;
  deliveryOption: {
    type: 'pickup' | 'fixedRate' | 'neighborhood';
    name: string;
    fee: number;
    neighborhoodId?: string;
    neighborhoodName?: string;
  };
  total: number;
  notes?: string;
  status: string;
  createdAt: string;
  whatsappSent: boolean;
}
