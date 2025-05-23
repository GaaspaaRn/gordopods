// src/contexts/StoreSettingsContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
// Importe Database, Tables e Json do local CORRETO do seu arquivo gerado
import type { Database, Tables, Json } from '@/types/supabase'; 

// Importe seus tipos manuais
import { StoreSettings, SocialLink, DeliverySettings, Neighborhood, StoreConfig, ContactInfo } from '@/types'; 
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

// --- VALORES PADRÃO ---
const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  pickup: { enabled: false, instructions: "Retire seu pedido em nosso endereço." },
  fixedRate: { enabled: false, fee: 0, description: "Taxa de entrega única para toda a cidade." },
  neighborhoodRates: { enabled: false, neighborhoods: [] },
  deliveryEnabled: false, minOrderValue: 0, deliveryFeeType: 'none',
  dynamicFeePerKm: 0, freeDeliveryAbove: 0, maxDeliveryRadiusKm: 0,
  estimatedDeliveryTime: { min: 30, max: 60 }, deliveryHours: [],
};

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  // Inclua TODAS as propriedades da interface StoreSettings com valores default
  id: undefined,
  storeName: 'Nome da Loja Padrão', 
  logo: null, 
  banner: null,
  primaryColor: '#3B82F6', 
  secondaryColor: '#10B981',
  description: 'Descrição padrão da loja.', 
  socialLinks: [], 
  contactInfo: { phone: null, email: null, address: '' }, 
  whatsappNumber: null,
  delivery_settings: DEFAULT_DELIVERY_SETTINGS,
  facebook_url: null,
  instagram_url: null,
  created_at: null,
  updated_at: null,
};

const DEFAULT_STORE_CONFIG: StoreConfig = {
  whatsappNumber: null, currency: 'BRL', currencySymbol: 'R$',
  allowGuestCheckout: true, showStock: true, lowStockThreshold: 5,
  maxItemsPerOrder: 0, minItemsPerOrder: 0, orderNumberPrefix: 'GPD-',
  maintenanceMode: false, maintenanceMessage: 'Loja em manutenção. Voltamos em breve!',
};

// --- INTERFACE DO CONTEXTO ---
interface StoreSettingsContextType {
  storeSettings: StoreSettings;
  deliverySettings: DeliverySettings; 
  isLoading: boolean;
  updateStoreSettings: (settings: Partial<StoreSettings>) => Promise<void>;
  updateDeliverySettings: (settings: Partial<DeliverySettings>) => Promise<void>;
  addSocialLink: (socialLink: Omit<SocialLink, "id">) => Promise<void>;
  updateSocialLink: (id: string, socialLink: Partial<Omit<SocialLink, "id">>) => Promise<void>;
  deleteSocialLink: (id: string) => Promise<void>;
  addNeighborhood: (neighborhood: Omit<Neighborhood, "id">) => Promise<void>;
  updateNeighborhood: (id: string, neighborhood: Partial<Omit<Neighborhood, "id">>) => Promise<void>;
  removeNeighborhood: (id: string) => Promise<void>;
  storeConfig: StoreConfig;
  updateStoreConfig: (config: Partial<StoreConfig>) => Promise<void>;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);
const STORE_SETTINGS_ROW_ID = '9119506d-a648-4776-8da8-c36a00c0cfad';

// Tipo explícito para a linha da tabela store_settings vinda do DB
type StoreSettingsDataFromDb = Database['public']['Tables']['store_settings']['Row'];

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  const deliverySettings = storeSettings.delivery_settings;

  const fetchStoreSettingsAndConfig = useCallback(async () => { // Envolvido em useCallback
    console.log('[StoreSettingsContext] Iniciando fetch. Auth loading:', authIsLoading);
    setIsLoading(true);
    try {
      const { data, error: settingsError } = await supabase
        .from('store_settings')
        .select(` 
          id, store_name, store_description, logo_url, banner_url, whatsapp_number,
          primary_color, secondary_color, social_links, contact_info, delivery_settings,
          created_at, updated_at, facebook_url, instagram_url 
        `) // Seleciona todas as colunas esperadas
        .eq('id', STORE_SETTINGS_ROW_ID)
        .maybeSingle();

      const settingsDataTyped: StoreSettingsDataFromDb | null = data;
      console.log('[StoreSettingsContext] RAW settingsDataTyped:', settingsDataTyped);

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Erro ao buscar store_settings do Supabase:', settingsError);
      }

      let loadedSettings = { ...DEFAULT_STORE_SETTINGS }; 

      if (settingsDataTyped) {
        loadedSettings = {
          ...DEFAULT_STORE_SETTINGS, // Garante todas as chaves da interface StoreSettings
          id: settingsDataTyped.id ?? DEFAULT_STORE_SETTINGS.id,
          storeName: settingsDataTyped.store_name ?? DEFAULT_STORE_SETTINGS.storeName,
          description: settingsDataTyped.store_description ?? DEFAULT_STORE_SETTINGS.description,
          logo: settingsDataTyped.logo_url ?? DEFAULT_STORE_SETTINGS.logo,
          banner: settingsDataTyped.banner_url ?? DEFAULT_STORE_SETTINGS.banner,
          whatsappNumber: settingsDataTyped.whatsapp_number ?? DEFAULT_STORE_SETTINGS.whatsappNumber,
          primaryColor: settingsDataTyped.primary_color ?? DEFAULT_STORE_SETTINGS.primaryColor,
          secondaryColor: settingsDataTyped.secondary_color ?? DEFAULT_STORE_SETTINGS.secondaryColor,
          
          socialLinks: settingsDataTyped.social_links 
            ? (settingsDataTyped.social_links as unknown as SocialLink[]) 
            : DEFAULT_STORE_SETTINGS.socialLinks, 
          contactInfo: settingsDataTyped.contact_info 
            ? (settingsDataTyped.contact_info as unknown as ContactInfo) 
            : DEFAULT_STORE_SETTINGS.contactInfo,
          
          delivery_settings: settingsDataTyped.delivery_settings 
            ? (typeof settingsDataTyped.delivery_settings === 'string' 
                ? JSON.parse(settingsDataTyped.delivery_settings) 
                : { ...DEFAULT_DELIVERY_SETTINGS, ...(settingsDataTyped.delivery_settings as object) } 
              ) 
            : DEFAULT_STORE_SETTINGS.delivery_settings,

          created_at: settingsDataTyped.created_at ?? DEFAULT_STORE_SETTINGS.created_at,
          updated_at: settingsDataTyped.updated_at ?? DEFAULT_STORE_SETTINGS.updated_at,
          facebook_url: settingsDataTyped.facebook_url ?? DEFAULT_STORE_SETTINGS.facebook_url,
          instagram_url: settingsDataTyped.instagram_url ?? DEFAULT_STORE_SETTINGS.instagram_url,
        };
        console.log('[StoreSettingsContext] Configurações mapeadas:', loadedSettings);
        localStorage.setItem('gordopods-store-settings', JSON.stringify(loadedSettings));
      } else {
        const storedSettingsStr = localStorage.getItem('gordopods-store-settings');
        if (storedSettingsStr) {
          const parsed = JSON.parse(storedSettingsStr);
          loadedSettings = { ...DEFAULT_STORE_SETTINGS, ...parsed, delivery_settings: parsed.delivery_settings ? { ...DEFAULT_DELIVERY_SETTINGS, ...parsed.delivery_settings } : DEFAULT_DELIVERY_SETTINGS };
        }
      }
      setStoreSettings(loadedSettings);

      const storedStoreConfig = localStorage.getItem('gordopods-store-config');
      let currentStoreConfig = DEFAULT_STORE_CONFIG;
      if (storedStoreConfig) currentStoreConfig = { ...DEFAULT_STORE_CONFIG, ...JSON.parse(storedStoreConfig) };
      setStoreConfig(prev => ({ ...currentStoreConfig, whatsappNumber: loadedSettings.whatsappNumber ?? currentStoreConfig.whatsappNumber ?? DEFAULT_STORE_CONFIG.whatsappNumber }));

    } catch (error: any) { 
      console.error('Erro crítico ao carregar configurações da loja:', error);
      toast.error(`Erro ao carregar configs: ${error.message}`);
      setStoreSettings(DEFAULT_STORE_SETTINGS);
      setStoreConfig(DEFAULT_STORE_CONFIG);
    } 
    finally { if (!authIsLoading) setIsLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authIsLoading]); // Apenas authIsLoading aqui, pois fetchStoreSettingsAndConfig é agora um useCallback sem deps externas que mudam

  useEffect(() => {
    fetchStoreSettingsAndConfig();
  }, [fetchStoreSettingsAndConfig]); // Executa quando fetchStoreSettingsAndConfig muda (ou seja, na montagem)


  useEffect(() => { if (!authIsLoading && isLoading) setIsLoading(false); }, [authIsLoading, isLoading]);
  useEffect(() => { if (!isLoading && !authIsLoading) localStorage.setItem('gordopods-store-settings', JSON.stringify(storeSettings)); }, [storeSettings, isLoading, authIsLoading]);
  useEffect(() => { if (!isLoading && !authIsLoading) localStorage.setItem('gordopods-store-config', JSON.stringify(storeConfig)); }, [storeConfig, isLoading, authIsLoading]);

  const updateStoreSettingsInternal = async (newSettings: StoreSettings) => {
    // ... (implementação como antes, mas com casts para Json)
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    setStoreSettings(newSettings);
    if (newSettings.whatsappNumber !== undefined) {
      setStoreConfig(prev => ({ ...prev, whatsappNumber: newSettings.whatsappNumber! }));
    }
    try {
      const dbData = {
        id: STORE_SETTINGS_ROW_ID,
        store_name: newSettings.storeName,
        store_description: newSettings.description,
        logo_url: newSettings.logo,
        banner_url: newSettings.banner,
        whatsapp_number: newSettings.whatsappNumber,
        primary_color: newSettings.primaryColor,
        secondary_color: newSettings.secondaryColor,
        social_links: newSettings.socialLinks as unknown as Json, // Cast
        contact_info: newSettings.contactInfo as unknown as Json, // Cast
        delivery_settings: newSettings.delivery_settings as unknown as Json, // Cast
        updated_at: new Date().toISOString(),
        // Se você tem facebook_url e instagram_url no DB e quer atualizá-los:
        facebook_url: newSettings.facebook_url,
        instagram_url: newSettings.instagram_url,
        // created_at não é geralmente atualizado
      };
      console.log('Upserting store_settings:', JSON.stringify(dbData, null, 2));
      const { error } = await supabase.from('store_settings').upsert(dbData, { onConflict: 'id' });
      if (error) { toast.error(`Erro Supabase: ${error.message}`); throw error; }
      toast.success('Configurações da loja salvas!');
    } catch (error: any) { 
        console.error('Erro ao salvar store_settings no Supabase (internal):', error);
        throw error; 
    }
  };
  
  const updateStoreSettings = async (settingsUpdates: Partial<StoreSettings>) => {
    // ... (lógica de mesclagem como antes, está correta) ...
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    try {
        let newDeliverySettings = storeSettings.delivery_settings;
        if (settingsUpdates.delivery_settings) {
            newDeliverySettings = {
                ...(storeSettings.delivery_settings || DEFAULT_DELIVERY_SETTINGS), 
                ...settingsUpdates.delivery_settings, 
                pickup: settingsUpdates.delivery_settings.pickup ? { ...(storeSettings.delivery_settings?.pickup || DEFAULT_DELIVERY_SETTINGS.pickup), ...settingsUpdates.delivery_settings.pickup } : storeSettings.delivery_settings?.pickup,
                fixedRate: settingsUpdates.delivery_settings.fixedRate ? { ...(storeSettings.delivery_settings?.fixedRate || DEFAULT_DELIVERY_SETTINGS.fixedRate), ...settingsUpdates.delivery_settings.fixedRate } : storeSettings.delivery_settings?.fixedRate,
                neighborhoodRates: settingsUpdates.delivery_settings.neighborhoodRates ? { 
                    ...(storeSettings.delivery_settings?.neighborhoodRates || DEFAULT_DELIVERY_SETTINGS.neighborhoodRates), 
                    ...settingsUpdates.delivery_settings.neighborhoodRates,
                    neighborhoods: settingsUpdates.delivery_settings.neighborhoodRates.neighborhoods || storeSettings.delivery_settings.neighborhoodRates?.neighborhoods || [] 
                } : storeSettings.delivery_settings?.neighborhoodRates,
            };
        }
        const mergedSettings = { ...storeSettings, ...settingsUpdates, delivery_settings: newDeliverySettings };
        await updateStoreSettingsInternal(mergedSettings);
    } catch (error) {
        console.error("Falha ao atualizar configurações da loja (nível superior):", error)
    }
  };

  const updateDeliverySettings = async (deliveryUpdates: Partial<DeliverySettings>) => {
    await updateStoreSettings({ delivery_settings: deliveryUpdates });
  };
  
  const addSocialLink = async (socialLinkData: Omit<SocialLink, "id">) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    // Agora socialLinkData deve ter 'platform', 'name', 'url'
    const newLink: SocialLink = { 
        id: crypto.randomUUID(), 
        platform: socialLinkData.platform, // Assume que platform vem de socialLinkData
        name: socialLinkData.name,
        url: socialLinkData.url
    };
    await updateStoreSettings({ socialLinks: [...(storeSettings.socialLinks || []), newLink] });
    toast.success("Link social adicionado."); // Adicionado feedback
  };

  const updateSocialLink = async (id: string, socialLinkUpdate: Partial<Omit<SocialLink, "id">>) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; } 
    await updateStoreSettings({ socialLinks: (storeSettings.socialLinks || []).map(link => link.id === id ? { ...link, ...socialLinkUpdate } as SocialLink : link )});
    toast.success("Link social atualizado."); // Adicionado feedback
  };

  const deleteSocialLink = async (id: string) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; } 
    await updateStoreSettings({ socialLinks: (storeSettings.socialLinks || []).filter(link => link.id !== id) });
    toast.success("Link social removido."); // Adicionado feedback
  };

  // ... (addNeighborhood, updateNeighborhood, removeNeighborhood, updateStoreConfig como antes)
  const addNeighborhood = async (neighborhoodData: Omit<Neighborhood, "id">) => {if (!isAuthenticated) { toast.error("Login necessário."); return; } const currentRates = storeSettings.delivery_settings.neighborhoodRates || { enabled: false, neighborhoods: [] }; const newN: Neighborhood = { ...neighborhoodData, id: crypto.randomUUID() }; await updateDeliverySettings({ neighborhoodRates: { ...currentRates, enabled: true, neighborhoods: [...currentRates.neighborhoods, newN] } });};
  const updateNeighborhood = async (id: string, neighborhoodUpdate: Partial<Omit<Neighborhood, "id">>) => {if (!isAuthenticated) { toast.error("Login necessário."); return; } const currentRates = storeSettings.delivery_settings.neighborhoodRates; if (!currentRates || !currentRates.neighborhoods) return; await updateDeliverySettings({ neighborhoodRates: { ...currentRates, neighborhoods: currentRates.neighborhoods.map(n => n.id === id ? { ...n, ...neighborhoodUpdate } as Neighborhood : n) } });};
  const removeNeighborhood = async (id: string) => {if (!isAuthenticated) { toast.error("Login necessário."); return; } const currentRates = storeSettings.delivery_settings.neighborhoodRates; if (!currentRates || !currentRates.neighborhoods) return; await updateDeliverySettings({ neighborhoodRates: { ...currentRates, neighborhoods: currentRates.neighborhoods.filter(n => n.id !== id) } });};
  const updateStoreConfig = async (config: Partial<StoreConfig>) => { const newConf = { ...storeConfig, ...config }; setStoreConfig(newConf); if (config.whatsappNumber !== undefined && config.whatsappNumber !== storeSettings.whatsappNumber && isAuthenticated) { await updateStoreSettings({ whatsappNumber: config.whatsappNumber }); }};


  return (
    <StoreSettingsContext.Provider
      value={{
        storeSettings,
        deliverySettings, 
        isLoading: isLoading || authIsLoading,
        updateStoreSettings,
        updateDeliverySettings,
        addSocialLink,
        updateSocialLink,
        deleteSocialLink,
        addNeighborhood,
        updateNeighborhood,
        removeNeighborhood,
        storeConfig,
        updateStoreConfig,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (context === undefined) {
    throw new Error('useStoreSettings deve ser usado dentro de um StoreSettingsProvider');
  }
  return context;
}