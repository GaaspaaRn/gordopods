// src/types/index.ts
// SEU CÓDIGO AQUI ESTAVA CORRETO PARA AS DEFINIÇÕES DE StoreSettings e DeliverySettings
// NENHUMA MUDANÇA NECESSÁRIA NESTE ARQUIVO COM BASE NOS ERROS APRESENTADOS.

export interface Category {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
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
   stock?: number | null;
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
  id: string; 
  name: string;
  url: string;
}

export interface ContactInfo {
  phone: string | null;
  email: string | null;
  address?: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  fee: number;
}

export interface DeliverySettings {
  // ... (sua definição de DeliverySettings, parece OK) ...
  pickup?: { enabled: boolean; instructions?: string; };
  fixedRate?: { enabled: boolean; fee: number; description?: string; };
  neighborhoodRates?: { enabled: boolean; neighborhoods: Neighborhood[]; };
  deliveryEnabled?: boolean;
  minOrderValue?: number;
  deliveryFeeType?: 'fixed' | 'neighborhood' | 'pickup' | 'none';
  dynamicFeePerKm?: number;
  freeDeliveryAbove?: number;
  maxDeliveryRadiusKm?: number;
  estimatedDeliveryTime?: { min: number; max: number };
  deliveryHours?: Array<{ dayOfWeek: number; open: string; close: string; enabled: boolean }>;
}

export interface StoreSettings {
  id?: string;                 // Opcional se o DB gera
  storeName: string;            // Mapeia de store_name
  logo: string | null;          // Mapeia de logo_url
  banner: string | null;        // Mapeia de banner_url
  primaryColor: string;         // Mapeia de primary_color
  secondaryColor: string;       // Mapeia de secondary_color
  description: string | null;   // Mapeia de store_description, permitir null
  socialLinks: SocialLink[] | null; // Mapeia de social_links (JSONB), permitir null
  contactInfo: ContactInfo | null;  // Mapeia de contact_info (JSONB), permitir null
  whatsappNumber: string | null;  // Mapeia de whatsapp_number
  delivery_settings: DeliverySettings; // Mapeia de delivery_settings (JSONB) - assumindo que sempre terá um default
  facebook_url?: string | null;
  instagram_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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