
import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImagePreview } from './image-preview';
import { Loader2, Upload } from 'lucide-react';
import { Input } from './input';

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
  folder?: string;
  label?: string;
  imageClassName?: string;
  recommendedSize?: string;
  onError?: (error: string) => void;
}

export function ImageUploader({
  onImageUploaded,
  currentImageUrl,
  folder = 'misc',
  label = 'Imagem',
  imageClassName = 'max-h-40 object-contain',
  recommendedSize,
  onError
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação básica de tipo de arquivo
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'O arquivo selecionado não é uma imagem válida';
      toast.error(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    // Validação de tamanho (máximo de 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'A imagem não pode ter mais de 5MB';
      toast.error(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    try {
      // Mostrar preview local
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Iniciar upload
      setIsUploading(true);
      
      // Gerar nome de arquivo único baseado em timestamp e nome original
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload para o Supabase Storage com retry
      let uploadAttempts = 0;
      let uploadSuccess = false;
      let uploadError = null;
      
      while (uploadAttempts < 3 && !uploadSuccess) {
        try {
          const { data, error } = await supabase.storage
            .from('gordopods-assets')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: uploadAttempts > 0 // Tenta sobrescrever no retry
            });

          if (error) {
            uploadError = error;
            uploadAttempts++;
            // Aguarda um momento antes de tentar novamente
            if (uploadAttempts < 3) await new Promise(r => setTimeout(r, 1000));
          } else {
            uploadSuccess = true;
            uploadError = null;
            
            // Obter URL pública da imagem - corrigido para usar o método adequado
            const { data: urlData } = supabase.storage
              .from('gordopods-assets')
              .getPublicUrl(filePath);

            // Callback com a URL da imagem
            onImageUploaded(urlData.publicUrl);
            toast.success('Imagem enviada com sucesso!');
          }
        } catch (e) {
          uploadError = e;
          uploadAttempts++;
          if (uploadAttempts < 3) await new Promise(r => setTimeout(r, 1000));
        }
      }
      
      if (!uploadSuccess) {
        const errorMsg = uploadError?.message || 'Falha ao fazer upload após múltiplas tentativas';
        if (onError) onError(errorMsg);
        throw uploadError || new Error(errorMsg);
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem. Tente novamente.');
      
      // Limpar preview em caso de erro
      if (previewUrl && previewUrl !== currentImageUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(currentImageUrl || null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = useCallback(() => {
    // Limpar preview local se houver
    if (previewUrl && previewUrl !== currentImageUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setPreviewUrl(null);
    onImageUploaded(''); // Limpar a imagem
  }, [previewUrl, currentImageUrl, onImageUploaded]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {previewUrl ? 'Trocar imagem' : 'Enviar imagem'}
              </>
            )}
          </Button>
          
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
        </div>

        {/* Recomendações de dimensões */}
        {recommendedSize && (
          <p className="text-xs text-muted-foreground">
            {recommendedSize}
          </p>
        )}
      </div>

      <ImagePreview 
        previewUrl={previewUrl}
        isUploading={isUploading}
        onRemove={handleRemoveImage}
        imageClassName={imageClassName}
      />
    </div>
  );
}
