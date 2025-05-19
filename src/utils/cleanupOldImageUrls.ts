// src/utils/cleanupOldImageUrls.ts
import { supabase } from '../integrations/supabase/client';

export async function cleanupOldImageUrls() {
  try {
    // Verificar se a limpeza já foi feita
    const cleanupFlag = localStorage.getItem('imageUrlsCleanup');
    if (cleanupFlag === 'true') {
      console.log('URLs de imagens já foram limpas anteriormente.');
      return;
    }

    // Limpar URLs antigas de produtos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, images:product_images(id, url)');

    if (productsError) throw productsError;

    for (const product of products) {
      const images = product.images || [];
      
      // Filtrar imagens com URLs que não são do Supabase Storage
      const nonSupabaseImages = images.filter((img: any) => {
        const url = img.url || '';
        return url && !url.includes('supabase.co/storage/v1/object/public');
      });
      
      if (nonSupabaseImages.length > 0) {
        // Excluir imagens antigas
        for (const img of nonSupabaseImages) {
          const { error } = await supabase
            .from('product_images')
            .delete()
            .eq('id', img.id);
          
          if (error) console.error('Erro ao excluir imagem antiga:', error);
        }
      }
    }

    // Limpar URLs antigas de configurações da loja
    const { data: storeSettings, error: settingsError } = await supabase
      .from('store_settings')
      .select('id, logo_url, banner_url');

    if (settingsError) throw settingsError;

    if (storeSettings && storeSettings.length > 0) {
      const settings = storeSettings[0];
      const updates: any = {};
      
      // Verificar logo
      if (settings.logo_url && !settings.logo_url.includes('supabase.co/storage/v1/object/public')) {
        updates.logo_url = null;
      }
      
      // Verificar banner
      if (settings.banner_url && !settings.banner_url.includes('supabase.co/storage/v1/object/public')) {
        updates.banner_url = null;
      }
      
      // Atualizar se necessário
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('store_settings')
          .update(updates)
          .eq('id', settings.id);
        
        if (error) console.error('Erro ao limpar URLs antigas das configurações da loja:', error);
      }
    }

    // Marcar limpeza como concluída
    localStorage.setItem('imageUrlsCleanup', 'true');
    console.log('Limpeza de URLs de imagens antigas concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a limpeza de URLs de imagens antigas:', error);
  }
}
