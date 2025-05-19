
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Função para gerar um nome único para o arquivo
const generateUniqueFileName = (file: File) => {
  const extension = file.name.split('.').pop();
  return `${uuidv4()}.${extension}`;
};

// Função para limpar a URL para uso como nome de arquivo
const sanitizeFileName = (fileName: string) => {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9-.]/g, '-')
    .replace(/-+/g, '-');
};

// Função para extrair a extensão do arquivo de uma URL ou nome de arquivo
const getFileExtension = (url: string) => {
  const parts = url.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() : '';
};

// Função para verificar se a URL é uma URL do Supabase Storage
const isSupabaseUrl = (url: string) => {
  // Verificar se a URL contém o domínio do Supabase Storage
  return url.includes('supabase.co/storage/v1/object/public/') || 
         url.includes('supabase.in/storage/v1/object/public/');
};

// Função para extrair o caminho do arquivo de uma URL do Supabase Storage
const extractPathFromSupabaseUrl = (url: string, bucketName: string) => {
  const regex = new RegExp(`/storage/v1/object/public/${bucketName}/(.+)`);
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Função principal para fazer upload de arquivo
export const uploadImage = async (
  file: File,
  bucketName: string = 'images',
  folder: string = ''
): Promise<string> => {
  try {
    // Verificar se o arquivo é uma imagem
    if (!file.type.startsWith('image/')) {
      throw new Error('O arquivo não é uma imagem válida');
    }

    // Gerar um nome de arquivo único
    const fileName = folder
      ? `${folder}/${generateUniqueFileName(file)}`
      : generateUniqueFileName(file);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw error;
    }

    // Construir a URL pública manualmente
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Erro no upload de imagem:', error);
    throw error;
  }
};

// Função para fazer upload de uma imagem a partir de uma URL
export const uploadImageFromUrl = async (
  url: string,
  bucketName: string = 'images',
  folder: string = ''
): Promise<string> => {
  try {
    // Verificar se a URL já é do Supabase Storage e do mesmo bucket
    if (isSupabaseUrl(url) && url.includes(`/storage/v1/object/public/${bucketName}/`)) {
      return url; // Retornar a mesma URL se já for do Supabase e do mesmo bucket
    }

    // Fazer fetch da imagem
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao buscar imagem da URL: ${response.statusText}`);
    }

    // Converter para Blob
    const imageBlob = await response.blob();
    
    // Extrair nome do arquivo da URL ou gerar um
    const urlParts = url.split('/');
    let originalFileName = urlParts[urlParts.length - 1].split('?')[0];
    
    // Verificar se tem extensão, caso contrário, tentar determinar pelo tipo MIME
    if (!getFileExtension(originalFileName)) {
      const extension = imageBlob.type.split('/')[1];
      originalFileName = `${originalFileName}.${extension}`;
    }
    
    // Sanitizar o nome do arquivo
    const sanitizedFileName = sanitizeFileName(originalFileName);
    
    // Gerar nome final do arquivo
    const fileName = folder
      ? `${folder}/${uuidv4()}-${sanitizedFileName}`
      : `${uuidv4()}-${sanitizedFileName}`;

    // Criar um File a partir do Blob
    const file = new File([imageBlob], sanitizedFileName, { type: imageBlob.type });

    // Upload do arquivo
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Erro ao fazer upload da imagem da URL:', error);
      throw error;
    }

    // Construir a URL pública manualmente
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Erro no upload de imagem a partir de URL:', error);
    throw error;
  }
};

// Função para excluir uma imagem
export const deleteImage = async (url: string, bucketName: string = 'images'): Promise<boolean> => {
  try {
    // Verificar se a URL é do Supabase Storage
    if (!isSupabaseUrl(url)) {
      console.warn('A URL não parece ser do Supabase Storage:', url);
      return false;
    }

    // Extrair o caminho do arquivo da URL
    const filePath = extractPathFromSupabaseUrl(url, bucketName);
    if (!filePath) {
      console.warn('Não foi possível extrair o caminho do arquivo da URL:', url);
      return false;
    }

    // Excluir o arquivo
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Erro ao excluir imagem:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao tentar excluir imagem:', error);
    return false;
  }
};

// Função para obter a URL pública de uma imagem
export const getPublicUrl = (path: string, bucketName: string = 'images'): string => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(path);
  
  return publicUrl;
};
