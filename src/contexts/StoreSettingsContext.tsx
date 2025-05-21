import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StoreSettings, SocialLink, DeliverySettings, Neighborhood, StoreConfig } from '@/types'; // Certifique-se que StoreSettings inclua delivery_settings
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

// --- VALORES PADRÃO ---
const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  deliveryEnabled: false,
  minOrderValue: 0,
  deliveryFeeType: 'fixed',
  fixedFee: 0,
  dynamicFeePerKm: 0,
  freeDeliveryAbove: 0,
  maxDeliveryRadiusKm: 0,
  estimatedDeliveryTime: { min: 30, max: 60 },
  deliveryHours: [],
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
  delivery_settings: DEFAULT_DELIVERY_SETTINGS,
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
  updateStoreSettings: (settings: Partial<StoreSettings>) => Promise<void>;
  isLoading: boolean;
  addSocialLink: (socialLink: Omit<SocialLink, "id" | "store_settings_id">) => Promise<void>;
  updateSocialLink: (id: string, socialLink: Partial<Omit<SocialLink, "id" | "store_settings_id">>) => Promise<void>;
  deleteSocialLink: (id: string) => Promise<void>;
  updateDeliverySettings: (settings: Partial<DeliverySettings>) => Promise<void>;
  addNeighborhood: (neighborhood: Omit<Neighborhood, "id">) => Promise<void>;
  updateNeighborhood: (id: string, neighborhood: Partial<Omit<Neighborhood, "id">>) => Promise<void>;
  removeNeighborhood: (id: string) => Promise<void>;
  storeConfig: StoreConfig;
  updateStoreConfig: (config: Partial<StoreConfig>) => Promise<void>;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

// --- IDs FIXOS ---
const STORE_SETTINGS_ROW_ID = '9119506d-a648-4776-8da8-c36a00c0cfad';
// const ADMIN_USER_ID = '07aade8d-8c00-45d8-867d-777976529bcb';

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuth();
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);
  const [isLoading, setIsLoading] = useState(true); // Começa true, gerenciado pelo useEffect

  // MODIFICAÇÃO AQUI: Lógica de fetch inicial
  useEffect(() => {
    const fetchStoreSettingsAndConfig = async () => {
      console.log('[StoreSettingsContext] Iniciando fetch. Auth loading:', authIsLoading, 'Authenticated:', isAuthenticated);
      setIsLoading(true); // Indica que estamos começando a carregar/verificar

      try {
        console.log('[StoreSettingsContext] Tentando buscar configurações do Supabase...');
        // Busca do Supabase independentemente do status de autenticação inicial
        const { data: settingsData, error: settingsError } = await supabase
          .from('store_settings')
          .select('*')
          .eq('id', STORE_SETTINGS_ROW_ID)
          .maybeSingle();

        if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116: "Actual response rows (0) not equal to expected rows (1)"
          console.error('Erro ao buscar store_settings do Supabase:', settingsError);
          // Não mostrar toast aqui, pois o fallback para localStorage/default é o comportamento esperado
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
            delivery_settings: settingsData.delivery_settings ? (typeof settingsData.delivery_settings === 'string' ? JSON.parse(settingsData.delivery_settings) : settingsData.delivery_settings) : DEFAULT_DELIVERY_SETTINGS,
          };
          console.log('[StoreSettingsContext] Configurações (store_settings) carregadas do Supabase:', currentSettings);
          localStorage.setItem('gordopods-store-settings', JSON.stringify(currentSettings)); // Cache no localStorage
        } else {
          console.log('[StoreSettingsContext] Nenhuma config no Supabase para o ID, tentando localStorage...');
          const storedSettingsStr = localStorage.getItem('gordopods-store-settings');
          if (storedSettingsStr) {
            currentSettings = JSON.parse(storedSettingsStr);
            console.log('[StoreSettingsContext] Configurações carregadas do localStorage.');
          } else {
            console.log('[StoreSettingsContext] Nenhuma config no localStorage, usando defaults.');
            // currentSettings já é DEFAULT_STORE_SETTINGS
          }
          if (!currentSettings.delivery_settings) { // Garante que delivery_settings exista
              currentSettings.delivery_settings = DEFAULT_DELIVERY_SETTINGS;
          }
        }
        setStoreSettings(currentSettings);

        const storedStoreConfig = localStorage.getItem('gordopods-store-config');
        let currentStoreConfig = DEFAULT_STORE_CONFIG;
        if (storedStoreConfig) {
           currentStoreConfig = JSON.parse(storedStoreConfig);
        }
        setStoreConfig(prev => ({
            ...currentStoreConfig,
            whatsappNumber: currentSettings.whatsappNumber ?? currentStoreConfig.whatsappNumber ?? DEFAULT_STORE_CONFIG.whatsappNumber,
        }));

      } catch (error: any) {
        console.error('Erro crítico ao carregar configurações da loja (bloco catch):', error);
        toast.error(`Erro inesperado ao carregar configs: ${error.message}`);
        setStoreSettings(DEFAULT_STORE_SETTINGS); // Fallback para default em caso de erro
        setStoreConfig(prev => ({...DEFAULT_STORE_CONFIG, whatsappNumber: DEFAULT_STORE_SETTINGS.whatsappNumber ?? DEFAULT_STORE_CONFIG.whatsappNumber}));
      } finally {
        // O isLoading geral só deve ser false quando authIsLoading também for false.
        // Se authIsLoading ainda é true, o carregamento geral não terminou.
        if (!authIsLoading) {
            setIsLoading(false);
            console.log('[StoreSettingsContext] Fetch de dados e auth resolvido, finalizando loading geral.');
        } else {
            console.log('[StoreSettingsContext] Fetch de dados finalizado, aguardando auth resolver para finalizar loading geral.');
        }
      }
    };

    fetchStoreSettingsAndConfig();

  }, [authIsLoading]); // Removido isAuthenticated daqui, authIsLoading é o gatilho principal para reavaliar o estado inicial.
                       // A lógica interna já lida com isAuthenticated.

  // Efeito adicional para garantir que isLoading seja definido como false
  // APENAS DEPOIS que authIsLoading se tornar false, caso o fetch termine antes.
  useEffect(() => {
    if (!authIsLoading && isLoading) {
      // Se authIsLoading acabou de se tornar false E o fetch já pode ter terminado (mas isLoading ainda é true)
      // ou o fetch terminou e authIsLoading era true, então agora podemos dizer que o carregamento geral terminou.
      setIsLoading(false);
      console.log('[StoreSettingsContext] Auth resolvido (possivelmente após fetch), finalizando loading geral.');
    }
  }, [authIsLoading, isLoading]);
  // FIM DA MODIFICAÇÃO

  // Salvar storeSettings (que inclui delivery_settings) no localStorage
  useEffect(() => {
    if (!isLoading && !authIsLoading) { // Apenas salva se não estiver em algum estado de carregamento
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
    const newLocalSettings = { ...storeSettings, ...settingsToUpdate };
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
        delivery_settings: newLocalSettings.delivery_settings,
        updated_at: new Date().toISOString(),
      };

      // ADICIONADO CONSOLE.LOG AQUI
      console.log('Dados enviados para upsert store_settings:', JSON.stringify(dbData, null, 2));

      const { error } = await supabase.from('store_settings').upsert(dbData, { onConflict: 'id' });

      if (error) {
        console.error('Erro ao salvar store_settings no Supabase:', error);
        toast.error(`Erro Supabase ao salvar: ${error.message}`);
        return;
      }
      
      toast.success('Configurações da loja atualizadas no Supabase!');
    } catch (error: any) {
      console.error('Erro ao atualizar store_settings (bloco catch):', error);
      toast.error(`Erro inesperado ao salvar: ${error.message}`);
    }
  };

  // --- FUNÇÕES AUXILIARES ---
  const addSocialLink = async (socialLink: Omit<SocialLink, "id" | "store_settings_id">) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; } // Adicionada verificação
    const newLinkWithId: SocialLink = { ...socialLink, id: crypto.randomUUID() };
    const updatedSocialLinks = [...storeSettings.socialLinks, newLinkWithId];
    await updateStoreSettings({ socialLinks: updatedSocialLinks });
  };

  const updateSocialLink = async (id: string, socialLinkUpdate: Partial<Omit<SocialLink, "id" | "store_settings_id">>) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; } // Adicionada verificação
    const updatedSocialLinks = storeSettings.socialLinks.map(link =>
      link.id === id ? { ...link, ...socialLinkUpdate } : link
    );
    await updateStoreSettings({ socialLinks: updatedSocialLinks });
  };

  const deleteSocialLink = async (id: string) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; } // Adicionada verificação
    const updatedSocialLinks = storeSettings.socialLinks.filter(link => link.id !== id);
    await updateStoreSettings({ socialLinks: updatedSocialLinks });
  };

  const updateDeliverySettings = async (deliverySettingsUpdate: Partial<DeliverySettings>) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; } // Adicionada verificação
    await updateStoreSettings({ 
        delivery_settings: { 
            ...storeSettings.delivery_settings, 
            ...deliverySettingsUpdate 
        } 
    });
  };
  
  const addNeighborhood = async (neighborhood: Omit<Neighborhood, "id">) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; } // Adicionada verificação
    const newNeighborhoodWithId: Neighborhood = { ...neighborhood, id: crypto.randomUUID() };
    const updatedNeighborhoods = [...storeSettings.delivery_settings.neighborhoods, newNeighborhoodWithId];
    await updateDeliverySettings({ neighborhoods: updatedNeighborhoods });
  };

  const updateNeighborhood = async (id: string, neighborhoodUpdate: Partial<Omit<Neighborhood, "id">>) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; } // Adicionada verificação
    const updatedNeighborhoods = storeSettings.delivery_settings.neighborhoods.map(n =>
      n.id === id ? { ...n, ...neighborhoodUpdate } : n
    );
    await updateDeliverySettings({ neighborhoods: updatedNeighborhoods });
  };

  const removeNeighborhood = async (id: string) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; } // Adicionada verificação
    const updatedNeighborhoods = storeSettings.delivery_settings.neighborhoods.filter(n => n.id !== id);
    await updateDeliverySettings({ neighborhoods: updatedNeighborhoods });
  };

  const updateStoreConfig = async (config: Partial<StoreConfig>) => {
    const newLocalConfig = { ...storeConfig, ...config };
    setStoreConfig(newLocalConfig);
    if (config.whatsappNumber !== undefined && config.whatsappNumber !== storeSettings.whatsappNumber) {
      // Apenas atualiza se autenticado, pois mexe com storeSettings
      if (isAuthenticated) {
          await updateStoreSettings({ whatsappNumber: config.whatsappNumber });
      } else {
          toast.info("Faça login para salvar o número do WhatsApp nas configurações da loja.");
      }
    }
    toast.success('Configurações gerais da loja atualizadas (localmente)');
  };

  return (
    <StoreSettingsContext.Provider
      value={{
        storeSettings,
        updateStoreSettings,
        isLoading: isLoading, // Simplificado, pois o useEffect agora gerencia o isLoading de forma mais robusta
        addSocialLink,
        updateSocialLink,
        deleteSocialLink,
        updateDeliverySettings,
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
