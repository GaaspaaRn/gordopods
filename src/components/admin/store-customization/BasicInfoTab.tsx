
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ImageUploader } from '@/components/ui/image-uploader';
import { StoreSettings } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface BasicInfoTabProps {
  storeSettings: StoreSettings;
  onSave: (settings: Partial<StoreSettings>) => void;
}

export function BasicInfoTab({ storeSettings, onSave }: BasicInfoTabProps) {
  const [storeName, setStoreName] = useState(storeSettings.storeName);
  const [logo, setLogo] = useState(storeSettings.logo || '');
  const [banner, setBanner] = useState(storeSettings.banner || '');
  const [description, setDescription] = useState(storeSettings.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Update local state when storeSettings change (e.g., after saving)
  useEffect(() => {
    setStoreName(storeSettings.storeName);
    setLogo(storeSettings.logo || '');
    setBanner(storeSettings.banner || '');
    setDescription(storeSettings.description || '');
    setUploadError('');
  }, [storeSettings]);

  const handleSaveBasic = async () => {
    try {
      setIsSubmitting(true);
      setUploadError('');
      
      // Validação básica
      if (!storeName.trim()) {
        toast.error("O nome da loja é obrigatório");
        return;
      }
      
      // Preparar os dados para o Supabase
      const storeData = {
        store_name: storeName.trim(),
        logo_url: logo,
        banner_url: banner,
        store_description: description,
        updated_at: new Date().toISOString()
      };
      
      // Verificar se o registro já existe
      const { data: existingSettings, error: checkError } = await supabase
        .from('store_settings')
        .select('id')
        .limit(1);
      
      let saveError;
      
      if (checkError) {
        console.error("Erro ao verificar configurações existentes:", checkError);
      }
      
      // Atualizar ou inserir no Supabase
      if (existingSettings && existingSettings.length > 0) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('store_settings')
          .update(storeData)
          .eq('id', existingSettings[0].id);
        saveError = error;
      } else {
        // Inserir novo registro
        const { error } = await supabase
          .from('store_settings')
          .insert({
            ...storeData,
            created_at: new Date().toISOString()
          });
        saveError = error;
      }
      
      if (saveError) {
        console.error("Erro ao salvar configurações no Supabase:", saveError);
        toast.error("Ocorreu um erro ao salvar as configurações da loja no banco de dados");
        return;
      }
      
      // Atualizar estado local
      await onSave({
        storeName,
        logo,
        banner,
        description,
      });
      
      toast.success("Informações da loja atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar informações básicas:", error);
      toast.error("Ocorreu um erro ao salvar as informações.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Básicas</CardTitle>
        <CardDescription>
          Defina as informações principais da sua loja
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="storeName">Nome da Loja</Label>
          <Input
            id="storeName"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <ImageUploader 
            label="Logotipo da Loja"
            currentImageUrl={logo}
            folder="logos"
            onImageUploaded={(url) => {
              setLogo(url);
              setUploadError('');
            }}
            imageClassName="max-h-16 object-contain"
            recommendedSize="Recomendado: 200x200 pixels, Quadrado, Máx 1MB. Formatos: JPG, PNG, WebP."
            onError={(error) => {
              setUploadError(error);
              toast.error(error);
            }}
          />
          {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
        </div>
        
        <div className="space-y-2">
          <ImageUploader 
            label="Imagem de Capa/Banner"
            currentImageUrl={banner}
            folder="banners"
            onImageUploaded={(url) => setBanner(url)}
            imageClassName="w-full h-32 object-cover rounded"
            recommendedSize="Recomendado: 1200x400 pixels (proporção 3:1), Máx 2MB. Formatos: JPG, PNG, WebP."
            onError={(error) => toast.error(error)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Descrição da Loja</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva sua loja em poucas palavras..."
            rows={3}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveBasic} disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Informações'}
        </Button>
      </CardFooter>
    </Card>
  );
}
