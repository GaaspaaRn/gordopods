import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StoreSettings, SocialLink, DeliverySettings, Neighborhood, StoreConfig } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext'; // 1. Importe useAuth

// Valores padrão (mantenha os seus)
const DEFAULT_STORE_SETTINGS: StoreSettings = { /* ... */ };
const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = { /* ... */ };
const DEFAULT_STORE_CONFIG: StoreConfig = { /* ... */ };

interface StoreSettingsContextType {
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => Promise<void>;
  isLoading: boolean;
  addSocialLink: (socialLink: Omit<SocialLink, "id">) => Promise<void>;
  updateSocialLink: (id: string, socialLink: Partial<Omit<SocialLink, "id">>) => Promise<void>;
  deleteSocialLink: (id: string) => Promise<void>;
  deliverySettings: DeliverySettings;
  updateDeliverySettings: (settings: Partial<DeliverySettings>) => Promise<void>;
  addNeighborhood: (neighborhood: Omit<Neighborhood, "id">) => Promise<void>;
  updateNeighborhood: (id: string, neighborhood: Partial<Omit<Neighborhood, "id">>) => Promise<void>;
  removeNeighborhood: (id: string) => Promise<void>;
  storeConfig: StoreConfig;
  updateStoreConfig: (config: Partial<StoreConfig>) => Promise<void>;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

// Se sua tabela store_settings deve ter apenas uma linha, defina um ID fixo.
// Se for multi-tenant, você precisará de um user_id ou similar para filtrar.
// Para este exemplo, vou assumir um ID fixo para uma configuração global da loja.
const STORE_SETTINGS_ROW_ID = '07aade8d-8c00-45d8-867d-777976529bcb'; // SUBSTITUA por um UUID real e fixo ou sua lógica de ID

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth(); // 2. Use o estado de autenticação
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(DEFAULT_DELIVERY_SETTINGS);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStoreSettings = async () => {
      // 3. Adicione a condição para buscar dados
      if (isAuthenticated && !authIsLoading) {
        setIsLoading(true);
        try {
          console.log('[StoreSettingsContext] Usuário autenticado, buscando configurações...');
          const { data: settingsData, error: settingsError } = await supabase
            .from('store_settings')
            .select('*')
            // .eq('id', STORE_SETTINGS_ROW_ID) // Se você tem um ID fixo para a linha de configurações
            .maybeSingle(); // Use maybeSingle se pode não haver nenhuma linha ainda

          if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116: "Actual response rows (0) not equal to expected rows (1)"
            console.error('Erro ao buscar configurações da loja do Supabase:', settingsError);
            toast.error(`Erro Supabase (Config Loja): ${settingsError.message}`);
          }

          if (settingsData) {
            const mappedSettings: StoreSettings = {
              storeName: settingsData.store_name || DEFAULT_STORE_SETTINGS.storeName,
              logo: settingsData.logo_url || DEFAULT_STORE_SETTINGS.logo,
              banner: settingsData.banner_url || DEFAULT_STORE_SETTINGS.banner,
              primaryColor: settingsData.primary_color || DEFAULT_STORE_SETTINGS.primaryColor, // Assumindo persistência
              secondaryColor: settingsData.secondary_color || DEFAULT_STORE_SETTINGS.secondaryColor, // Assumindo persistência
              description: settingsData.store_description || DEFAULT_STORE_SETTINGS.description,
              socialLinks: settingsData.social_links || [], // Assumindo que social_links é um JSONB no Supabase
              contactInfo: settingsData.contact_info || DEFAULT_STORE_SETTINGS.contactInfo, // Assumindo JSONB
              whatsappNumber: settingsData.whatsapp_number || DEFAULT_STORE_SETTINGS.whatsappNumber,
            };
            setStoreSettings(mappedSettings);
            setStoreConfig(prevConfig => ({
              ...prevConfig,
              whatsappNumber: mappedSettings.whatsappNumber || DEFAULT_STORE_CONFIG.whatsappNumber,
            }));
            localStorage.setItem('gordopods-store-settings', JSON.stringify(mappedSettings));
            console.log('[StoreSettingsContext] Configurações carregadas do Supabase:', mappedSettings);
          } else {
            // Nenhuma configuração no Supabase, carrega do localStorage ou usa default
            console.log('[StoreSettingsContext] Nenhuma configuração no Supabase, usando localStorage/default.');
            const storedSettings = localStorage.getItem('gordopods-store-settings');
            if (storedSettings) setStoreSettings(JSON.parse(storedSettings));
            else setStoreSettings(DEFAULT_STORE_SETTINGS);
          }
          
          // Carregar configurações de entrega do localStorage (parece que não são do Supabase neste contexto)
          const storedDeliverySettings = localStorage.getItem('gordopods-delivery-settings');
          if (storedDeliverySettings) setDeliverySettings(JSON.parse(storedDeliverySettings));
          
          // Carregar storeConfig do localStorage (se não vier do Supabase)
          const storedStoreConfig = localStorage.getItem('gordopods-store-config');
          // Se storeConfig.whatsappNumber não foi setado pelo Supabase, usa o do localStorage
          if (storedStoreConfig && !settingsData?.whatsapp_number) {
             const parsedConfig = JSON.parse(storedStoreConfig);
             setStoreConfig(prev => ({...prev, ...parsedConfig}));
          }


        } catch (error: any) {
          console.error('Erro ao carregar configurações da loja (bloco catch):', error);
          toast.error(`Erro inesperado (Config Loja): ${error.message}`);
          const stored = localStorage.getItem('gordopods-store-settings');
          setStoreSettings(stored ? JSON.parse(stored) : DEFAULT_STORE_SETTINGS);
        } finally {
          setIsLoading(false);
        }
      } else if (!authIsLoading && !isAuthenticated) {
        console.log('[StoreSettingsContext] Usuário não autenticado. Carregando do localStorage/default.');
        const storedSettings = localStorage.getItem('gordopods-store-settings');
        if (storedSettings) setStoreSettings(JSON.parse(storedSettings)); else setStoreSettings(DEFAULT_STORE_SETTINGS);
        
        const storedDelivery = localStorage.getItem('gordopods-delivery-settings');
        if (storedDelivery) setDeliverySettings(JSON.parse(storedDelivery)); else setDeliverySettings(DEFAULT_DELIVERY_SETTINGS);

        const storedConfig = localStorage.getItem('gordopods-store-config');
        if (storedConfig) setStoreConfig(JSON.parse(storedConfig)); else setStoreConfig(DEFAULT_STORE_CONFIG);
        
        setIsLoading(false);
      } else if (authIsLoading) {
        console.log('[StoreSettingsContext] Aguardando status de autenticação...');
      }
    };

    fetchStoreSettings();
  }, [isAuthenticated, authIsLoading]); // 4. Adicione dependências

  // ... seus useEffects para salvar no localStorage ...
  useEffect(() => {
    if (!isLoading) localStorage.setItem('gordopods-store-settings', JSON.stringify(storeSettings));
  }, [storeSettings, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('gordopods-delivery-settings', JSON.stringify(deliverySettings));
  }, [deliverySettings, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('gordopods-store-config', JSON.stringify(storeConfig));
  }, [storeConfig, isLoading]);


  const updateStoreSettings = async (settings: Partial<StoreSettings>) => {
    const updatedSettings = { ...storeSettings, ...settings };
    // Remova campos que não existem na tabela `store_settings` antes do upsert
    const { socialLinks, contactInfo, ...settingsForDb } = updatedSettings;

    try {
      setIsLoading(true); // Adicionado para feedback
      // Mapear para nomes de colunas do Supabase
      const dbData = {
        // id: STORE_SETTINGS_ROW_ID, // Use um ID fixo se sua tabela só tem uma linha de config
        store_name: settingsForDb.storeName,
        logo_url: settingsForDb.logo,
        banner_url: settingsForDb.banner,
        primary_color: settingsForDb.primaryColor,
        secondary_color: settingsForDb.secondaryColor,
        store_description: settingsForDb.description,
        whatsapp_number: settingsForDb.whatsappNumber,
        social_links: socialLinks, // Se for uma coluna JSONB na tabela store_settings
        contact_info: contactInfo, // Se for uma coluna JSONB
        updated_at: new Date().toISOString(),
      };

      // Verifica se já existe um registro para fazer update, senão insert
      const { data: existing, error: fetchError } = await supabase
        .from('store_settings')
        .select('id')
        // .eq('id', STORE_SETTINGS_ROW_ID) // Se usar ID fixo
        .limit(1)
        .single();

      let error;
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = 0 rows
        throw fetchError;
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from('store_settings')
          .update(dbData)
          .eq('id', existing.id); // Atualiza o registro existente
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('store_settings')
          .insert({ ...dbData, id: crypto.randomUUID() }); // Insere novo se não existir (ajuste o ID)
        error = insertError;
      }

      if (error) {
        console.error('Erro ao salvar configurações da loja no Supabase:', error);
        toast.error(`Erro Supabase: ${error.message}`);
        // Reverter para estado anterior em caso de erro? Ou deixar o otimista?
        return;
      }
      
      // Só atualiza o estado local se o Supabase foi bem-sucedido
      setStoreSettings(updatedSettings); 
      if (settings.whatsappNumber !== undefined) {
        setStoreConfig(prev => ({ ...prev, whatsappNumber: settings.whatsappNumber! }));
      }
      toast.success('Configurações da loja atualizadas com sucesso');
    } catch (error: any) {
      console.error('Erro ao atualizar configurações da loja (bloco catch):', error);
      toast.error(`Erro inesperado: ${error.message}`);
    } finally {
      setIsLoading(false); // Adicionado
    }
  };

  // Funções para gerenciar links sociais (precisariam de tabela própria ou serem JSONB em store_settings)
  // Se socialLinks for uma coluna JSONB em store_settings, o updateStoreSettings já lida com isso.
  // Se for tabela separada, precisaria de chamadas supabase.from('social_links')...
  const addSocialLink = async (socialLink: Omit<SocialLink, "id">) => {
    const newLink: SocialLink = { ...socialLink, id: crypto.randomUUID() };
    const updatedSocialLinks = [...storeSettings.socialLinks, newLink];
    await updateStoreSettings({ socialLinks: updatedSocialLinks }); // Isso salvará no JSONB
    toast.success('Link social adicionado com sucesso');
  };
  // ... updateSocialLink e deleteSocialLink seguiriam o mesmo padrão para JSONB ...

  // Funções para gerenciar configurações de entrega (assumindo que são apenas localStorage)
  const updateDeliverySettings = async (settings: Partial<DeliverySettings>) => {
    const updatedSettings = { ...deliverySettings, ...settings };
    setDeliverySettings(updatedSettings);
    // localStorage.setItem('gordopods-delivery-settings', JSON.stringify(updatedSettings)); // Já tratado no useEffect
    toast.success('Configurações de entrega atualizadas com sucesso');
  };
  // ... addNeighborhood, updateNeighborhood, removeNeighborhood (assumindo localStorage) ...

  const updateStoreConfig = async (config: Partial<StoreConfig>) => {
    const updatedConfig = { ...storeConfig, ...config };
    setStoreConfig(updatedConfig);
    if (config.whatsappNumber !== undefined) {
      // Dispara o updateStoreSettings para persistir o whatsapp_number no Supabase
      await updateStoreSettings({ whatsappNumber: config.whatsappNumber });
    }
    // localStorage.setItem('gordopods-store-config', JSON.stringify(updatedConfig)); // Já tratado no useEffect
    toast.success('Configurações da loja (config) atualizadas com sucesso');
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
        addNeighborhood: async (n) => { /* ... */ }, // Mantenha a implementação se for só localStorage
        updateNeighborhood: async (id, n) => { /* ... */ },
        removeNeighborhood: async (id) => { /* ... */ },
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
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
}
