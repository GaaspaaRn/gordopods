import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StoreSettings, SocialLink, DeliverySettings, Neighborhood, StoreConfig } from '@/types'; // Certifique-se que StoreSettings inclua delivery_settings
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

// --- VALORES PADRÃO ---
// Certifique-se que seus tipos em @/types refletem estas estruturas
const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  deliveryEnabled: false,
  minOrderValue: 0,
  deliveryFeeType: 'fixed',
  fixedFee: 0,
  dynamicFeePerKm: 0,
  freeDeliveryAbove: 0,
  maxDeliveryRadiusKm: 0,
  estimatedDeliveryTime: { min: 30, max: 60 }, // Exemplo
  deliveryHours: [ // Exemplo
    // { dayOfWeek: 1, open: "10:00", close: "22:00", enabled: true },
    // { dayOfWeek: 2, open: "10:00", close: "22:00", enabled: true },
  ],
  neighborhoods: [],
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
  delivery_settings: DEFAULT_DELIVERY_SETTINGS, // Incluindo delivery_settings aqui
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
  whatsappNumber: '', // Será populado pelo storeSettings
  maintenanceMode: false,
  maintenanceMessage: 'Loja em manutenção. Voltamos em breve!',
};

// --- INTERFACE DO CONTEXTO ---
interface StoreSettingsContextType {
  storeSettings: StoreSettings; // Este agora inclui delivery_settings
  updateStoreSettings: (settings: Partial<StoreSettings>) => Promise<void>;
  isLoading: boolean;
  
  // Funções para socialLinks (parte de storeSettings)
  addSocialLink: (socialLink: Omit<SocialLink, "id" | "store_settings_id">) => Promise<void>;
  updateSocialLink: (id: string, socialLink: Partial<Omit<SocialLink, "id" | "store_settings_id">>) => Promise<void>;
  deleteSocialLink: (id: string) => Promise<void>;

  // Funções para deliverySettings (parte de storeSettings)
  updateDeliverySettings: (settings: Partial<DeliverySettings>) => Promise<void>; // Atualiza a sub-propriedade delivery_settings
  addNeighborhood: (neighborhood: Omit<Neighborhood, "id">) => Promise<void>; // id é gerado internamente
  updateNeighborhood: (id: string, neighborhood: Partial<Omit<Neighborhood, "id">>) => Promise<void>;
  removeNeighborhood: (id: string) => Promise<void>;
  
  storeConfig: StoreConfig;
  updateStoreConfig: (config: Partial<StoreConfig>) => Promise<void>;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

// --- IDs FIXOS ---
const STORE_SETTINGS_ROW_ID = '9119506d-a648-4776-8da8-c36a00c0cfad'; // SEU UUID para a linha de store_settings
// const ADMIN_USER_ID = '07aade8d-8c00-45d8-867d-777976529bcb'; // UUID do seu usuário ADM (pode ser usado para RLS ou verificações)

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuth();
  
  // O estado 'storeSettings' agora inclui 'delivery_settings'
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  // 'deliverySettings' como estado separado não é mais necessário se estiver dentro de 'storeSettings'
  // const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(DEFAULT_DELIVERY_SETTINGS); 
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStoreSettingsAndConfig = async () => {
      if (authIsLoading) {
        console.log('[StoreSettingsContext] Aguardando status de autenticação...');
        setIsLoading(true);
        return;
      }

      // Usuário não autenticado: carrega tudo do localStorage ou usa defaults
      if (!isAuthenticated) {
        console.log('[StoreSettingsContext] Usuário não autenticado. Carregando do localStorage/default.');
        const storedSettingsStr = localStorage.getItem('gordopods-store-settings');
        const storedSettings = storedSettingsStr ? JSON.parse(storedSettingsStr) : DEFAULT_STORE_SETTINGS;
        setStoreSettings(storedSettings);
        
        // Se delivery_settings não estiver no storedSettings, usa o default
        if (!storedSettings.delivery_settings) {
            setStoreSettings(prev => ({...prev, delivery_settings: DEFAULT_DELIVERY_SETTINGS}));
        }

        const storedConfigStr = localStorage.getItem('gordopods-store-config');
        setStoreConfig(storedConfigStr ? JSON.parse(storedConfigStr) : DEFAULT_STORE_CONFIG);
        
        setIsLoading(false);
        return;
      }
      
      // Usuário autenticado: tenta buscar do Supabase
      setIsLoading(true);
      try {
        console.log('[StoreSettingsContext] Usuário autenticado, buscando configurações do Supabase...');
        const { data: settingsData, error: settingsError } = await supabase
          .from('store_settings')
          .select('*') // Certifique-se que a coluna 'delivery_settings' (JSONB) está sendo selecionada
          .eq('id', STORE_SETTINGS_ROW_ID)
          .maybeSingle(); 

        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error('Erro ao buscar store_settings do Supabase:', settingsError);
          toast.error(`Erro Supabase (Store Settings): ${settingsError.message}`);
        }

        let currentSettings = DEFAULT_STORE_SETTINGS;
        if (settingsData) {
          currentSettings = {
            storeName: settingsData.store_name ?? DEFAULT_STORE_SETTINGS.storeName,
            logo: settingsData.logo_url ?? DEFAULT_STORE_SETTINGS.logo,
            banner: settingsData.banner_url ?? DEFAULT_STORE_SETTINGS.banner,
            primaryColor: settingsData.primary_color ?? DEFAULT_STORE_SETTINGS.primaryColor,
            secondaryColor: settingsData.secondary_color ?? DEFAULT_STORE_SETTINGS.secondaryColor,
            description: settingsData.store_description ?? DEFAULT_STORE_SETTINGS.description,
            socialLinks: settingsData.social_links ?? [],
            contactInfo: settingsData.contact_info ?? DEFAULT_STORE_SETTINGS.contactInfo,
            whatsappNumber: settingsData.whatsapp_number ?? DEFAULT_STORE_SETTINGS.whatsappNumber,
            // Crucial: Carrega delivery_settings do Supabase ou usa o default
            delivery_settings: settingsData.delivery_settings ? (typeof settingsData.delivery_settings === 'string' ? JSON.parse(settingsData.delivery_settings) : settingsData.delivery_settings) : DEFAULT_DELIVERY_SETTINGS,
          };
          console.log('[StoreSettingsContext] Configurações (store_settings) carregadas do Supabase:', currentSettings);
        } else {
          console.log('[StoreSettingsContext] Nenhuma config no Supabase para o ID, usando localStorage/default.');
          const storedSettingsStr = localStorage.getItem('gordopods-store-settings');
          currentSettings = storedSettingsStr ? JSON.parse(storedSettingsStr) : DEFAULT_STORE_SETTINGS;
          if (!currentSettings.delivery_settings) { // Garante que delivery_settings exista
              currentSettings.delivery_settings = DEFAULT_DELIVERY_SETTINGS;
          }
        }
        setStoreSettings(currentSettings);
        localStorage.setItem('gordopods-store-settings', JSON.stringify(currentSettings));

        // Carregar storeConfig do localStorage (parece ser apenas local)
        const storedStoreConfig = localStorage.getItem('gordopods-store-config');
        if (storedStoreConfig) {
           const parsedConfig = JSON.parse(storedStoreConfig);
           setStoreConfig(prev => ({
             ...prev,
             ...parsedConfig,
             whatsappNumber: currentSettings.whatsappNumber ?? parsedConfig.whatsappNumber ?? DEFAULT_STORE_CONFIG.whatsappNumber,
           }));
        } else {
            // Se não há config no localStorage, popula whatsappNumber a partir de storeSettings
            setStoreConfig(prev => ({...prev, whatsappNumber: currentSettings.whatsappNumber ?? DEFAULT_STORE_CONFIG.whatsappNumber}));
        }

      } catch (error: any) {
        console.error('Erro ao carregar configurações da loja (bloco catch):', error);
        toast.error(`Erro inesperado (Config Loja): ${error.message}`);
        const stored = localStorage.getItem('gordopods-store-settings');
        setStoreSettings(stored ? JSON.parse(stored) : DEFAULT_STORE_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreSettingsAndConfig();
  }, [isAuthenticated, authIsLoading]);

  // Salvar storeSettings (que inclui delivery_settings) no localStorage
  useEffect(() => {
    if (!isLoading && !authIsLoading) {
      localStorage.setItem('gordopods-store-settings', JSON.stringify(storeSettings));
    }
  }, [storeSettings, isLoading, authIsLoading]);

  // Salvar storeConfig no localStorage
  useEffect(() => {
    if (!isLoading && !authIsLoading) {
      localStorage.setItem('gordopods-store-config', JSON.stringify(storeConfig));
    }
  }, [storeConfig, isLoading, authIsLoading]);

  // --- FUNÇÃO PRINCIPAL DE ATUALIZAÇÃO ---
  const updateStoreSettings = async (settingsToUpdate: Partial<StoreSettings>) => {
    if (!isAuthenticated) {
      toast.error("Você precisa estar logado para atualizar as configurações.");
      return;
    }
    // Atualização otimista
    const newLocalSettings = { ...storeSettings, ...settingsToUpdate };
    // Se delivery_settings está sendo atualizado parcialmente, mescla corretamente
    if (settingsToUpdate.delivery_settings) {
        newLocalSettings.delivery_settings = {
            ...storeSettings.delivery_settings,
            ...settingsToUpdate.delivery_settings
        };
    }
    setStoreSettings(newLocalSettings);

    if (settingsToUpdate.whatsappNumber !== undefined) {
        setStoreConfig(prev => ({ ...prev, whatsappNumber: settingsToUpdate.whatsappNumber! }));
    }

    try {
      const dbData = {
        id: STORE_SETTINGS_ROW_ID,
        store_name: newLocalSettings.storeName,
        logo_url: newLocalSettings.logo,
        banner_url: newLocalSettings.banner,
        primary_color: newLocalSettings.primaryColor,
        secondary_color: newLocalSettings.secondaryColor,
        store_description: newLocalSettings.description,
        whatsapp_number: newLocalSettings.whatsappNumber,
        social_links: newLocalSettings.socialLinks,
        contact_info: newLocalSettings.contactInfo,
        delivery_settings: newLocalSettings.delivery_settings, // Salva o objeto delivery_settings como JSONB
        updated_at: new Date().toISOString(),
        // user_id: user?.id === ADMIN_USER_ID ? user.id : undefined, // Opcional: associar ao ADM
      };

      const { error } = await supabase.from('store_settings').upsert(dbData, { onConflict: 'id' });

      if (error) {
        console.error('Erro ao salvar store_settings no Supabase:', error);
        toast.error(`Erro Supabase ao salvar: ${error.message}`);
        // Considerar reverter o estado local para o anterior ou refazer o fetch
        return;
      }
      
      toast.success('Configurações da loja atualizadas no Supabase!');
    } catch (error: any) {
      console.error('Erro ao atualizar store_settings (bloco catch):', error);
      toast.error(`Erro inesperado ao salvar: ${error.message}`);
    }
  };

  // --- FUNÇÕES AUXILIARES (operam em 'storeSettings' e chamam 'updateStoreSettings') ---

  // Social Links (parte de storeSettings.socialLinks)
  const addSocialLink = async (socialLink: Omit<SocialLink, "id" | "store_settings_id">) => {
    const newLinkWithId: SocialLink = { ...socialLink, id: crypto.randomUUID() };
    const updatedSocialLinks = [...storeSettings.socialLinks, newLinkWithId];
    await updateStoreSettings({ socialLinks: updatedSocialLinks });
    // toast.success('Link social adicionado'); // updateStoreSettings já mostra toast
  };

  const updateSocialLink = async (id: string, socialLinkUpdate: Partial<Omit<SocialLink, "id" | "store_settings_id">>) => {
    const updatedSocialLinks = storeSettings.socialLinks.map(link =>
      link.id === id ? { ...link, ...socialLinkUpdate } : link
    );
    await updateStoreSettings({ socialLinks: updatedSocialLinks });
  };

  const deleteSocialLink = async (id: string) => {
    const updatedSocialLinks = storeSettings.socialLinks.filter(link => link.id !== id);
    await updateStoreSettings({ socialLinks: updatedSocialLinks });
  };

  // Delivery Settings (parte de storeSettings.delivery_settings)
  const updateDeliverySettings = async (deliverySettingsUpdate: Partial<DeliverySettings>) => {
    // Esta função agora atualiza a sub-propriedade 'delivery_settings' dentro de 'storeSettings'
    await updateStoreSettings({ 
        delivery_settings: { 
            ...storeSettings.delivery_settings, 
            ...deliverySettingsUpdate 
        } 
    });
  };
  
  // Neighborhoods (parte de storeSettings.delivery_settings.neighborhoods)
  const addNeighborhood = async (neighborhood: Omit<Neighborhood, "id">) => {
    const newNeighborhoodWithId: Neighborhood = { ...neighborhood, id: crypto.randomUUID() };
    const updatedNeighborhoods = [...storeSettings.delivery_settings.neighborhoods, newNeighborhoodWithId];
    await updateDeliverySettings({ neighborhoods: updatedNeighborhoods });
  };

  const updateNeighborhood = async (id: string, neighborhoodUpdate: Partial<Omit<Neighborhood, "id">>) => {
    const updatedNeighborhoods = storeSettings.delivery_settings.neighborhoods.map(n =>
      n.id === id ? { ...n, ...neighborhoodUpdate } : n
    );
    await updateDeliverySettings({ neighborhoods: updatedNeighborhoods });
  };

  const removeNeighborhood = async (id: string) => {
    const updatedNeighborhoods = storeSettings.delivery_settings.neighborhoods.filter(n => n.id !== id);
    await updateDeliverySettings({ neighborhoods: updatedNeighborhoods });
  };

  // Store Config (apenas local, mas pode influenciar storeSettings.whatsappNumber)
  const updateStoreConfig = async (config: Partial<StoreConfig>) => {
    const newLocalConfig = { ...storeConfig, ...config };
    setStoreConfig(newLocalConfig);
    if (config.whatsappNumber !== undefined && config.whatsappNumber !== storeSettings.whatsappNumber) {
      await updateStoreSettings({ whatsappNumber: config.whatsappNumber });
    }
    // localStorage.setItem('gordopods-store-config', JSON.stringify(newLocalConfig)); // Já tratado no useEffect
    toast.success('Configurações gerais da loja atualizadas (localmente)');
  };

  return (
    <StoreSettingsContext.Provider
      value={{
        storeSettings,
        updateStoreSettings,
        isLoading: isLoading || authIsLoading,
        addSocialLink,
        updateSocialLink,
        deleteSocialLink,
        updateDeliverySettings, // Expondo a função para atualizar delivery_settings
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
