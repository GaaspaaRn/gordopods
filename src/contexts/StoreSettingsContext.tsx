
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StoreSettings, SocialLink, DeliverySettings, Neighborhood, StoreConfig } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Valores padrão para as configurações da loja
const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Gordopods',
  logo: '',
  banner: '',
  primaryColor: '#9b87f5',
  secondaryColor: '#6E59A5',
  description: '',
  socialLinks: [],
  contactInfo: {
    phone: '',
    email: ''
  },
  whatsappNumber: ''
};

// Valores padrão para as configurações de entrega
const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  pickup: {
    enabled: true,
    instructions: 'Retire sua compra em nossa loja'
  },
  fixedRate: {
    enabled: false,
    fee: 0,
    description: 'Taxa fixa de entrega'
  },
  neighborhoodRates: {
    enabled: false,
    neighborhoods: []
  }
};

// Valores padrão para as configurações de loja
const DEFAULT_STORE_CONFIG: StoreConfig = {
  whatsappNumber: ''
};

interface StoreSettingsContextType {
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => Promise<void>;
  isLoading: boolean;
  addSocialLink: (socialLink: Omit<SocialLink, "id">) => Promise<void>;
  updateSocialLink: (id: string, socialLink: Partial<Omit<SocialLink, "id">>) => Promise<void>;
  deleteSocialLink: (id: string) => Promise<void>;
  
  // Adicionando propriedades para configurações de entrega
  deliverySettings: DeliverySettings;
  updateDeliverySettings: (settings: Partial<DeliverySettings>) => Promise<void>;
  addNeighborhood: (neighborhood: Omit<Neighborhood, "id">) => Promise<void>;
  updateNeighborhood: (id: string, neighborhood: Partial<Omit<Neighborhood, "id">>) => Promise<void>;
  removeNeighborhood: (id: string) => Promise<void>;
  
  // Adicionando propriedades para configurações da loja
  storeConfig: StoreConfig;
  updateStoreConfig: (config: Partial<StoreConfig>) => Promise<void>;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(DEFAULT_DELIVERY_SETTINGS);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar configurações da loja
  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        // Tenta buscar do Supabase
        const { data: settingsData, error: settingsError } = await supabase
          .from('store_settings')
          .select('*')
          .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error('Erro ao buscar configurações da loja:', settingsError);
          toast.error('Erro ao carregar configurações da loja');
        }

        // Se encontrou dados no Supabase, mapeia para o formato esperado
        if (settingsData) {
          const mappedSettings: StoreSettings = {
            storeName: settingsData.store_name || DEFAULT_STORE_SETTINGS.storeName,
            logo: settingsData.logo_url || DEFAULT_STORE_SETTINGS.logo,
            banner: settingsData.banner_url || DEFAULT_STORE_SETTINGS.banner,
            primaryColor: DEFAULT_STORE_SETTINGS.primaryColor,
            secondaryColor: DEFAULT_STORE_SETTINGS.secondaryColor,
            description: settingsData.store_description || DEFAULT_STORE_SETTINGS.description,
            socialLinks: [], // Será preenchido após carregar os links sociais
            contactInfo: {
              phone: DEFAULT_STORE_SETTINGS.contactInfo.phone,
              email: DEFAULT_STORE_SETTINGS.contactInfo.email
            },
            whatsappNumber: settingsData.whatsapp_number || DEFAULT_STORE_SETTINGS.whatsappNumber
          };
          
          setStoreSettings(mappedSettings);
          
          // Atualizar também o storeConfig
          setStoreConfig({
            ...storeConfig,
            whatsappNumber: settingsData.whatsapp_number || DEFAULT_STORE_CONFIG.whatsappNumber
          });
        } else {
          // Se não encontrou no banco, tenta carregar do localStorage
          const storedSettings = localStorage.getItem('gordopods-store-settings');
          if (storedSettings) {
            try {
              setStoreSettings(JSON.parse(storedSettings));
            } catch (e) {
              console.error('Erro ao analisar configurações da loja do localStorage:', e);
              localStorage.removeItem('gordopods-store-settings');
            }
          }
          
          // Carregar configurações de entrega do localStorage
          const storedDeliverySettings = localStorage.getItem('gordopods-delivery-settings');
          if (storedDeliverySettings) {
            try {
              setDeliverySettings(JSON.parse(storedDeliverySettings));
            } catch (e) {
              console.error('Erro ao analisar configurações de entrega do localStorage:', e);
              localStorage.removeItem('gordopods-delivery-settings');
            }
          }
          
          // Carregar configurações de loja do localStorage
          const storedStoreConfig = localStorage.getItem('gordopods-store-config');
          if (storedStoreConfig) {
            try {
              setStoreConfig(JSON.parse(storedStoreConfig));
            } catch (e) {
              console.error('Erro ao analisar configurações de loja do localStorage:', e);
              localStorage.removeItem('gordopods-store-config');
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações da loja:', error);
        toast.error('Erro ao carregar configurações da loja');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreSettings();
  }, []);

  // Salvar configurações em localStorage sempre que mudarem
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('gordopods-store-settings', JSON.stringify(storeSettings));
    }
  }, [storeSettings, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('gordopods-delivery-settings', JSON.stringify(deliverySettings));
    }
  }, [deliverySettings, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('gordopods-store-config', JSON.stringify(storeConfig));
    }
  }, [storeConfig, isLoading]);

  // Função para atualizar as configurações da loja
  const updateStoreSettings = async (settings: Partial<StoreSettings>) => {
    try {
      const updatedSettings = { ...storeSettings, ...settings };
      setStoreSettings(updatedSettings);

      // Salvar no Supabase
      const { error } = await supabase
        .from('store_settings')
        .upsert({
          id: crypto.randomUUID(), // Será usado apenas se não existir registro
          store_name: updatedSettings.storeName,
          logo_url: updatedSettings.logo,
          banner_url: updatedSettings.banner,
          store_description: updatedSettings.description,
          whatsapp_number: updatedSettings.whatsappNumber
        });

      if (error) {
        console.error('Erro ao salvar configurações da loja:', error);
        toast.error('Erro ao salvar configurações da loja');
        return;
      }

      toast.success('Configurações da loja atualizadas com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar configurações da loja:', error);
      toast.error('Erro ao atualizar configurações da loja');
    }
  };

  // Funções para gerenciar links sociais
  const addSocialLink = async (socialLink: Omit<SocialLink, "id">) => {
    const newLink: SocialLink = {
      ...socialLink,
      id: crypto.randomUUID()
    };
    
    const updatedSocialLinks = [...storeSettings.socialLinks, newLink];
    await updateStoreSettings({ socialLinks: updatedSocialLinks });
    toast.success('Link social adicionado com sucesso');
  };

  const updateSocialLink = async (id: string, socialLink: Partial<Omit<SocialLink, "id">>) => {
    const updatedSocialLinks = storeSettings.socialLinks.map(link => 
      link.id === id ? { ...link, ...socialLink } : link
    );
    
    await updateStoreSettings({ socialLinks: updatedSocialLinks });
    toast.success('Link social atualizado com sucesso');
  };

  const deleteSocialLink = async (id: string) => {
    const updatedSocialLinks = storeSettings.socialLinks.filter(link => link.id !== id);
    await updateStoreSettings({ socialLinks: updatedSocialLinks });
    toast.success('Link social removido com sucesso');
  };

  // Funções para gerenciar configurações de entrega
  const updateDeliverySettings = async (settings: Partial<DeliverySettings>) => {
    try {
      const updatedSettings = {
        ...deliverySettings,
        ...settings
      };
      
      setDeliverySettings(updatedSettings);
      localStorage.setItem('gordopods-delivery-settings', JSON.stringify(updatedSettings));
      toast.success('Configurações de entrega atualizadas com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar configurações de entrega:', error);
      toast.error('Erro ao atualizar configurações de entrega');
    }
  };

  // Funções para gerenciar bairros/regiões
  const addNeighborhood = async (neighborhood: Omit<Neighborhood, "id">) => {
    try {
      const newNeighborhood: Neighborhood = {
        ...neighborhood,
        id: crypto.randomUUID()
      };
      
      const updatedNeighborhoods = [
        ...deliverySettings.neighborhoodRates.neighborhoods, 
        newNeighborhood
      ];
      
      await updateDeliverySettings({
        neighborhoodRates: {
          ...deliverySettings.neighborhoodRates,
          neighborhoods: updatedNeighborhoods
        }
      });
      
      toast.success('Bairro adicionado com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar bairro:', error);
      toast.error('Erro ao adicionar bairro');
    }
  };

  const updateNeighborhood = async (id: string, neighborhood: Partial<Omit<Neighborhood, "id">>) => {
    try {
      const updatedNeighborhoods = deliverySettings.neighborhoodRates.neighborhoods.map(item => 
        item.id === id ? { ...item, ...neighborhood } : item
      );
      
      await updateDeliverySettings({
        neighborhoodRates: {
          ...deliverySettings.neighborhoodRates,
          neighborhoods: updatedNeighborhoods
        }
      });
      
      toast.success('Bairro atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar bairro:', error);
      toast.error('Erro ao atualizar bairro');
    }
  };

  const removeNeighborhood = async (id: string) => {
    try {
      const updatedNeighborhoods = deliverySettings.neighborhoodRates.neighborhoods.filter(
        item => item.id !== id
      );
      
      await updateDeliverySettings({
        neighborhoodRates: {
          ...deliverySettings.neighborhoodRates,
          neighborhoods: updatedNeighborhoods
        }
      });
      
      toast.success('Bairro removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover bairro:', error);
      toast.error('Erro ao remover bairro');
    }
  };

  // Função para atualizar configurações da loja
  const updateStoreConfig = async (config: Partial<StoreConfig>) => {
    try {
      const updatedConfig = { ...storeConfig, ...config };
      setStoreConfig(updatedConfig);
      
      // Atualizar o número de WhatsApp nas configurações da loja também
      if (config.whatsappNumber !== undefined) {
        await updateStoreSettings({ whatsappNumber: config.whatsappNumber });
      }
      
      toast.success('Configurações da loja atualizadas com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar configurações da loja:', error);
      toast.error('Erro ao atualizar configurações da loja');
    }
  };

  return (
    <StoreSettingsContext.Provider
      value={{
        storeSettings,
        updateStoreSettings,
        isLoading,
        addSocialLink,
        updateSocialLink,
        deleteSocialLink,
        deliverySettings,
        updateDeliverySettings,
        addNeighborhood,
        updateNeighborhood,
        removeNeighborhood,
        storeConfig,
        updateStoreConfig
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (context === undefined) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
}
