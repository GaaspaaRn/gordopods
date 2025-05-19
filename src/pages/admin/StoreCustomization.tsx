
import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { BasicInfoTab } from '@/components/admin/store-customization/BasicInfoTab';
import { AppearanceTab } from '@/components/admin/store-customization/AppearanceTab';
import { SocialLinksTab } from '@/components/admin/store-customization/SocialLinksTab';
import { ContactInfoTab } from '@/components/admin/store-customization/ContactInfoTab';

export default function StoreCustomization() {
  const { 
    storeSettings, 
    updateStoreSettings, 
    addSocialLink, 
    updateSocialLink, 
    deleteSocialLink 
  } = useStoreSettings();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Personalização da Loja</h1>
          <p className="text-muted-foreground">
            Personalize a aparência da sua loja online
          </p>
        </div>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="social">Redes Sociais</TabsTrigger>
            <TabsTrigger value="contact">Contato</TabsTrigger>
          </TabsList>
          
          {/* Basic Information Tab */}
          <TabsContent value="basic">
            <BasicInfoTab 
              storeSettings={storeSettings} 
              onSave={updateStoreSettings} 
            />
          </TabsContent>
          
          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <AppearanceTab 
              storeSettings={storeSettings} 
              onSave={updateStoreSettings} 
            />
          </TabsContent>
          
          {/* Social Media Tab */}
          <TabsContent value="social">
            <SocialLinksTab 
              storeSettings={storeSettings}
              onAdd={(name, url) => addSocialLink({ name, url })}
              onUpdate={(id, name, url) => updateSocialLink(id, { name, url })}
              onRemove={deleteSocialLink}
            />
          </TabsContent>
          
          {/* Contact Information Tab */}
          <TabsContent value="contact">
            <ContactInfoTab 
              storeSettings={storeSettings} 
              onSave={updateStoreSettings} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
