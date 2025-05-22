
import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../integrations/supabase/client';

interface ImageUploaderProps {
  currentImageUrl?: string;
  onImageChange: (url: string | null) => void;
  bucketName?: string;
  folderPath?: string;
  recommendedDimensions?: string;
}

export function ImageUploader({
  currentImageUrl,
  onImageChange,
  bucketName = 'gordopods-assets',
  folderPath = 'products',
  recommendedDimensions
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB.');
      return;
    }

        try {
      setIsUploading(true);

      // Criar URL de preview local
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Gerar nome de arquivo único
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`; // Ex: 'products/timestamp-random.png'

      // --- ADICIONAR LOGS AQUI PARA DEBUG ---
      console.log('[ImageUploader] Iniciando upload...');
      console.log('[ImageUploader] Bucket:', bucketName); // Deve ser 'gordopods-assets'
      console.log('[ImageUploader] File Path no Storage:', filePath);
      console.log('[ImageUploader] Objeto File:', file); // Verifique nome, tamanho, tipo
      console.log('[ImageUploader] Opções de Upload:', { cacheControl: '3600', upsert: false });
      const { data: authData } = await supabase.auth.getUser();
      console.log('[ImageUploader] Usuário autenticado:', authData.user ? authData.user.id : 'Nenhum usuário logado');
      // --- FIM DOS LOGS PARA DEBUG ---

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName) // Deve ser 'gordopods-assets'
        .upload(filePath, file, { // 'file' aqui é o objeto File do input
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // --- LOG DETALHADO DO ERRO DO STORAGE ---
        console.error('[ImageUploader] ERRO NO UPLOAD PARA O STORAGE:', error);
        // --- FIM DO LOG DETALHADO ---
        throw error; // Re-lança o erro para ser pego pelo catch externo
      }

      // Obter URL pública - corrigido para usar o método adequado
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!publicUrlData.publicUrl) {
        console.error('[ImageUploader] Falha ao obter URL pública após upload, publicUrlData:', publicUrlData);
        throw new Error('Falha ao obter URL pública');
      }

      // Notificar componente pai sobre a nova URL
      onImageChange(publicUrlData.publicUrl);
      toast.success('Imagem enviada com sucesso!');

    } catch (error: any) { // Captura o erro lançado pelo 'throw error' ou outros
      console.error('[ImageUploader] Erro final no bloco catch:', error);
      // A mensagem de erro que você está vendo no console (com RLS) vem daqui
      // porque 'error' pode ser o objeto de erro do Supabase { message, error, statusCode }
      // ou um objeto Error padrão.
      const errorMessage = error.message || 'Falha ao enviar imagem. Tente novamente.';
      toast.error(errorMessage);
      
      // Manter a URL atual em caso de erro
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Preview da imagem */}
      {previewUrl && (
        <div className="relative w-full max-w-[300px] h-[200px] border rounded-md overflow-hidden">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-contain"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
            disabled={isUploading}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Área de upload */}
      <div className="space-y-2">
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
        {recommendedDimensions && (
          <p className="text-xs text-muted-foreground">
            {recommendedDimensions}
          </p>
        )}
      </div>
    </div>
  );
}
