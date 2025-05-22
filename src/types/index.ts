// src/types/index.ts
// SEU CÓDIGO AQUI ESTAVA CORRETO PARA AS DEFINIÇÕES DE StoreSettings e DeliverySettings
// NENHUMA MUDANÇA NECESSÁRIA NESTE ARQUIVO COM BASE NOS ERROS APRESENTADOS.

export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string; // Se você não usa/tem no DB, considere tornar opcional ou remover
  active: boolean;
  createdAt: string;
  updatedAt: string;
  order?: number;
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
  // stock?: number; // Se tiver estoque por opção
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
  categoryName?: string; // Adicionado para conveniência se você fizer join
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
  id: string; // Adicionado id que estava faltando na sua struct original
  platform: string; // Adicionado platform que estava faltando na sua struct original
  name: string;
  url: string;
}

export interface ContactInfo { // Adicionada interface para clareza
  phone: string;
  email: string;
  address?: string; // Opcional
}

export interface Neighborhood {
  id: string;
  name: string;
  fee: number;
}

export interface DeliverySettings {
  pickup?: { // Tornado opcional para corresponder ao seu DEFAULT_DELIVERY_SETTINGS que tinha tudo
    enabled: boolean;
    instructions?: string;
  };
  fixedRate?: {
    enabled: boolean;
    fee: number;
    description?: string;
  };
  neighborhoodRates?: {
    enabled: boolean;
    neighborhoods: Neighborhood[];
  };
  // Campos do seu DEFAULT_DELIVERY_SETTINGS que não estavam aqui:
  deliveryEnabled?: boolean; // Exemplo, se você tiver um controle geral
  minOrderValue?: number;
  deliveryFeeType?: 'fixed' | 'neighborhood' | 'pickup' | 'none'; // Adicionei 'none' e 'pickup'
  // fixedFee?: number; // Já dentro de fixedRate
  dynamicFeePerKm?: number;
  freeDeliveryAbove?: number;
  maxDeliveryRadiusKm?: number;
  estimatedDeliveryTime?: { min: number; max: number };
  deliveryHours?: Array<{ dayOfWeek: number; open: string; close: string; enabled: boolean }>;
}


export interface StoreSettings {
  storeName: string;
  logo: string | null; // Permitir null
  banner: string | null; // Permitir null
  primaryColor: string;
  secondaryColor: string;
  description: string;
  socialLinks: SocialLink[];
  contactInfo: ContactInfo; // Usando a interface definida
  whatsappNumber: string | null; // Permitir null
  delivery_settings: DeliverySettings; // <--- JÁ ESTAVA CORRETO AQUI
}

export interface StoreConfig {
  // Adicionei campos do seu DEFAULT_STORE_CONFIG
  currency?: string;
  currencySymbol?: string;
  allowGuestCheckout?: boolean;
  showStock?: boolean;
  lowStockThreshold?: number;
  maxItemsPerOrder?: number;
  minItemsPerOrder?: number;
  orderNumberPrefix?: string;
  whatsappNumber: string | null; // Permitir null
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface SelectedVariation {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceModifier: number;
}

export interface CartItem {
  id: string; // ID do item no carrinho (geralmente productId + hash das variações)
  productId: string;
  productName: string;
  quantity: number;
  basePrice: number; // Preço base do produto sem modificadores
  selectedVariations: SelectedVariation[];
  totalPrice: number; // Preço total do item (basePrice + modificadores) * quantidade
  imageUrl?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number; // Soma de todos os totalPrice dos CartItem
}

export interface OrderDeliveryOption { // Tipo mais explícito para clareza
  type: 'pickup' | 'fixedRate' | 'neighborhood';
  name: string; // Descrição do método
  fee: number;
  neighborhoodId?: string;
  neighborhoodName?: string;
}

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
  deliveryOption: OrderDeliveryOption; // Usando o tipo explícito
  total: number;
  notes?: string;
  status: string; // Ex: 'new', 'processing', 'shipped', 'delivered', 'cancelled'
  createdAt: string;
  whatsappSent: boolean;
  // updatedAt?: string; // Pode ser útil
}