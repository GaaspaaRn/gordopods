import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StoreSettings, SocialLink, DeliverySettings, Neighborhood, StoreConfig } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

// --- VALORES PADRÃO ---
// Certifique-se que seus tipos em @/types refletem estas estruturas
const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  pickup: { enabled: false, instructions: "Retire seu pedido em nosso endereço." },
  fixedRate: { enabled: false, fee: 0, description: "Taxa de entrega única para toda a cidade." },
  neighborhoodRates: { enabled: false, neighborhoods: [] },
  // Adicionando campos faltantes que estavam no seu DEFAULT_DELIVERY_SETTINGS original
  deliveryEnabled: false,
  minOrderValue: 0,
  deliveryFeeType: 'none',
  dynamicFeePerKm: 0,
  freeDeliveryAbove: 0,
  maxDeliveryRadiusKm: 0,
  estimatedDeliveryTime: { min: 30, max: 60 },
  deliveryHours: [],
};

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Nome da Loja Padrão',
  logo: '',
  banner: '',
  primaryColor: '#3B82F6',
  secondaryColor: '#10B981',
  description: 'Descrição padrão da loja.',
  socialLinks: [],
  contactInfo: { phone: '', email: '', address: '' },
  whatsappNumber: '',
  delivery_settings: DEFAULT_DELIVERY_SETTINGS, // Inicializa com o default
};

const DEFAULT_STORE_CONFIG: StoreConfig = {
  currency: 'BRL',
  currencySymbol: 'R$',
  allowGuestCheckout: true,
  showStock: true,
  lowStockThreshold: 5,
  maxItemsPerOrder: 0,
  minItemsPerOrder: 0,
  orderNumberPrefix: 'GPD-',
  whatsappNumber: '',
  maintenanceMode: false,
  maintenanceMessage: 'Loja em manutenção. Voltamos em breve!',
};

// --- INTERFACE DO CONTEXTO ---
interface StoreSettingsContextType {
  storeSettings: StoreSettings;
  deliverySettings: DeliverySettings; // <<< ADICIONADO AQUI PARA ACESSO DIRETO
  isLoading: boolean;
  updateStoreSettings: (settings: Partial<StoreSettings>) => Promise<void>; // Esta já atualiza tudo, incluindo delivery_settings aninhado
  updateDeliverySettings: (settings: Partial<DeliverySettings>) => Promise<void>; // Função específica para deliverySettings
  // Funções de SocialLink e Neighborhood podem ser mantidas se você as usa
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

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Deriva deliverySettings do storeSettings para simplificar
  const deliverySettings = storeSettings.delivery_settings;

  useEffect(() => {
    const fetchStoreSettingsAndConfig = async () => {
      console.log('[StoreSettingsContext] Iniciando fetch. Auth loading:', authIsLoading);
      setIsLoading(true);
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('store_settings')
          .select('*')
          .eq('id', STORE_SETTINGS_ROW_ID)
          .maybeSingle();

        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error('Erro ao buscar store_settings do Supabase:', settingsError);
        }

        let loadedSettings = DEFAULT_STORE_SETTINGS; // Começa com o default completo
        if (settingsData) {
          loadedSettings = {
            ...DEFAULT_STORE_SETTINGS, // Garante que todas as chaves default existam
            ...settingsData,          // Sobrescreve com dados do DB
            // Garante que sub-objetos sejam mesclados ou usem default se nulos no DB
            socialLinks: settingsData.social_links ?? [],
            contactInfo: settingsData.contact_info ?? DEFAULT_STORE_SETTINGS.contactInfo,
            delivery_settings: settingsData.delivery_settings 
              ? (typeof settingsData.delivery_settings === 'string' 
                  ? JSON.parse(settingsData.delivery_settings) 
                  : { ...DEFAULT_DELIVERY_SETTINGS, ...settingsData.delivery_settings } // Mescla com default
                ) 
              : DEFAULT_DELIVERY_SETTINGS,
          } as StoreSettings; // Type assertion para garantir a forma
          console.log('[StoreSettingsContext] Configurações carregadas do Supabase:', loadedSettings);
          localStorage.setItem('gordopods-store-settings', JSON.stringify(loadedSettings));
        } else {
          const storedSettingsStr = localStorage.getItem('gordopods-store-settings');
          if (storedSettingsStr) {
            const parsed = JSON.parse(storedSettingsStr);
            // Garante que o default seja aplicado se o localStorage estiver incompleto
            loadedSettings = { ...DEFAULT_STORE_SETTINGS, ...parsed, delivery_settings: parsed.delivery_settings ? { ...DEFAULT_DELIVERY_SETTINGS, ...parsed.delivery_settings } : DEFAULT_DELIVERY_SETTINGS };
            console.log('[StoreSettingsContext] Configurações carregadas do localStorage.');
          } else {
            console.log('[StoreSettingsContext] Nenhuma config no localStorage ou Supabase, usando defaults.');
            // loadedSettings já é DEFAULT_STORE_SETTINGS
          }
        }
        setStoreSettings(loadedSettings);

        const storedStoreConfig = localStorage.getItem('gordopods-store-config');
        let currentStoreConfig = DEFAULT_STORE_CONFIG;
        if (storedStoreConfig) currentStoreConfig = { ...DEFAULT_STORE_CONFIG, ...JSON.parse(storedStoreConfig) };
        
        setStoreConfig(prev => ({
            ...currentStoreConfig,
            whatsappNumber: loadedSettings.whatsappNumber ?? currentStoreConfig.whatsappNumber ?? DEFAULT_STORE_CONFIG.whatsappNumber,
        }));

      } catch (error: any) {
        console.error('Erro crítico ao carregar configurações da loja:', error);
        toast.error(`Erro ao carregar configs: ${error.message}`);
        setStoreSettings(DEFAULT_STORE_SETTINGS);
        setStoreConfig(DEFAULT_STORE_CONFIG);
      } finally {
        if (!authIsLoading) setIsLoading(false);
      }
    };
    fetchStoreSettingsAndConfig();
  }, [authIsLoading]);

  useEffect(() => {
    if (!authIsLoading && isLoading) setIsLoading(false);
  }, [authIsLoading, isLoading]);

  useEffect(() => {
    if (!isLoading && !authIsLoading) {
      localStorage.setItem('gordopods-store-settings', JSON.stringify(storeSettings));
    }
  }, [storeSettings, isLoading, authIsLoading]);

  useEffect(() => {
    if (!isLoading && !authIsLoading) {
      localStorage.setItem('gordopods-store-config', JSON.stringify(storeConfig));
    }
  }, [storeConfig, isLoading, authIsLoading]);

  const updateStoreSettingsInternal = async (newSettings: StoreSettings) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    setStoreSettings(newSettings); // Atualização otimista
    if (newSettings.whatsappNumber !== undefined) {
      setStoreConfig(prev => ({ ...prev, whatsappNumber: newSettings.whatsappNumber! }));
    }
    try {
      const dbData = {
        id: STORE_SETTINGS_ROW_ID,
        store_name: newSettings.storeName,
        logo_url: newSettings.logo,
        banner_url: newSettings.banner,
        primary_color: newSettings.primaryColor,
        secondary_color: newSettings.secondaryColor,
        store_description: newSettings.description,
        whatsapp_number: newSettings.whatsappNumber,
        social_links: newSettings.socialLinks,
        contact_info: newSettings.contactInfo,
        delivery_settings: newSettings.delivery_settings, // Envia o objeto completo
        updated_at: new Date().toISOString(),
      };
      console.log('Upserting store_settings:', JSON.stringify(dbData, null, 2));
      const { error } = await supabase.from('store_settings').upsert(dbData, { onConflict: 'id' });
      if (error) { toast.error(`Erro Supabase: ${error.message}`); throw error; }
      toast.success('Configurações da loja salvas!');
    } catch (error: any) { console.error('Erro ao salvar store_settings:', error); }
  };

  const updateStoreSettings = async (settingsUpdates: Partial<StoreSettings>) => {
    // Se delivery_settings for passado em settingsUpdates, ele deve ser mesclado corretamente
    let newDeliverySettings = storeSettings.delivery_settings;
    if (settingsUpdates.delivery_settings) {
        newDeliverySettings = {
            ...storeSettings.delivery_settings, // Default atual
            ...settingsUpdates.delivery_settings, // Novas parciais
            // Garante que sub-objetos sejam mesclados e não substituídos se parciais
            pickup: settingsUpdates.delivery_settings.pickup ? { ...storeSettings.delivery_settings.pickup, ...settingsUpdates.delivery_settings.pickup } : storeSettings.delivery_settings.pickup,
            fixedRate: settingsUpdates.delivery_settings.fixedRate ? { ...storeSettings.delivery_settings.fixedRate, ...settingsUpdates.delivery_settings.fixedRate } : storeSettings.delivery_settings.fixedRate,
            neighborhoodRates: settingsUpdates.delivery_settings.neighborhoodRates ? { 
                ...storeSettings.delivery_settings.neighborhoodRates, 
                ...settingsUpdates.delivery_settings.neighborhoodRates,
                neighborhoods: settingsUpdates.delivery_settings.neighborhoodRates.neighborhoods || storeSettings.delivery_settings.neighborhoodRates?.neighborhoods || [] 
            } : storeSettings.delivery_settings.neighborhoodRates,
        };
    }
    await updateStoreSettingsInternal({ 
        ...storeSettings, 
        ...settingsUpdates,
        delivery_settings: newDeliverySettings // Garante que delivery_settings seja o objeto mesclado
    });
  };

  const updateDeliverySettings = async (deliveryUpdates: Partial<DeliverySettings>) => {
    // Chama updateStoreSettings, que agora sabe como mesclar delivery_settings aninhado
    await updateStoreSettings({ delivery_settings: deliveryUpdates });
  };
  
  // Funções de SocialLink (ajustadas para Omit<SocialLink, "id"> como no tipo do contexto)
  const addSocialLink = async (socialLink: Omit<SocialLink, "id">) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    const newLink: SocialLink = { ...socialLink, id: crypto.randomUUID(), platform: socialLink.platform || 'default' }; // Adicionado platform default
    await updateStoreSettings({ socialLinks: [...storeSettings.socialLinks, newLink] });
  };
  const updateSocialLink = async (id: string, socialLinkUpdate: Partial<Omit<SocialLink, "id">>) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    await updateStoreSettings({ socialLinks: storeSettings.socialLinks.map(link => link.id === id ? { ...link, ...socialLinkUpdate } as SocialLink : link )});
  };
  const deleteSocialLink = async (id: string) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    await updateStoreSettings({ socialLinks: storeSettings.socialLinks.filter(link => link.id !== id) });
  };

  // Funções de Neighborhood (operam em storeSettings.delivery_settings.neighborhoodRates.neighborhoods)
  const addNeighborhood = async (neighborhood: Omit<Neighborhood, "id">) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    const currentNeighborhoodRates = storeSettings.delivery_settings.neighborhoodRates || { enabled: true, neighborhoods: [] };
    const newNeighborhoodWithId: Neighborhood = { ...neighborhood, id: crypto.randomUUID() };
    await updateDeliverySettings({ 
        neighborhoodRates: {
            ...currentNeighborhoodRates,
            enabled: true, // Garante que esteja habilitado se adicionarmos um bairro
            neighborhoods: [...(currentNeighborhoodRates.neighborhoods || []), newNeighborhoodWithId]
        }
    });
  };
  const updateNeighborhood = async (id: string, neighborhoodUpdate: Partial<Omit<Neighborhood, "id">>) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    const currentNeighborhoodRates = storeSettings.delivery_settings.neighborhoodRates;
    if (!currentNeighborhoodRates) return; // Não deveria acontecer se bem inicializado
    await updateDeliverySettings({
        neighborhoodRates: {
            ...currentNeighborhoodRates,
            neighborhoods: currentNeighborhoodRates.neighborhoods.map(n => n.id === id ? { ...n, ...neighborhoodUpdate } as Neighborhood : n)
        }
    });
  };
  const removeNeighborhood = async (id: string) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    const currentNeighborhoodRates = storeSettings.delivery_settings.neighborhoodRates;
    if (!currentNeighborhoodRates) return;
    await updateDeliverySettings({
        neighborhoodRates: {
            ...currentNeighborhoodRates,
            neighborhoods: currentNeighborhoodRates.neighborhoods.filter(n => n.id !== id)
        }
    });
  };

  const updateStoreConfig = async (config: Partial<StoreConfig>) => {
    const newLocalConfig = { ...storeConfig, ...config };
    setStoreConfig(newLocalConfig);
    if (config.whatsappNumber !== undefined && config.whatsappNumber !== storeSettings.whatsappNumber) {
      if (isAuthenticated) {
          await updateStoreSettings({ whatsappNumber: config.whatsappNumber });
      }
    }
  };

  return (
    <StoreSettingsContext.Provider
      value={{
        storeSettings,
        deliverySettings, // <<< EXPOSTO AQUI
        isLoading: isLoading || authIsLoading, // Considera ambos para o estado de loading geral
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