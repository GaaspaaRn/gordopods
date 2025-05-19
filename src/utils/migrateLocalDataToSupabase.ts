// src/utils/migrateLocalDataToSupabase.ts
import { supabase } from '../integrations/supabase/client';

export async function migrateLocalDataToSupabase() {
  try {
    // Verificar se a migração já foi feita
    const migrationFlag = localStorage.getItem('dataMigrated');
    if (migrationFlag === 'true') {
      console.log('Dados já foram migrados anteriormente.');
      return;
    }
    
    // Migrar categorias
    const storedCategories = localStorage.getItem('categories');
    if (storedCategories) {
      const categories = JSON.parse(storedCategories);
      
      for (const category of categories) {
        const { error } = await supabase
          .from('categories')
          .upsert({
            id: category.id,
            name: category.name,
            description: category.description,
            active: category.active,
            created_at: category.createdAt,
            updated_at: category.updatedAt
          });
        
        if (error) console.error('Erro ao migrar categoria:', error);
      }
    }
    
    // Migrar produtos
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      const products = JSON.parse(storedProducts);
      
      for (const product of products) {
        // Inserir produto base
        const { error: productError } = await supabase
          .from('products')
          .upsert({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            category_id: product.categoryId,
            stock_control: product.stockControl,
            stock_quantity: product.stockQuantity,
            auto_stock_reduction: product.autoStockReduction,
            active: product.active,
            created_at: product.createdAt,
            updated_at: product.updatedAt
          });
        
        if (productError) {
          console.error('Erro ao migrar produto:', productError);
          continue;
        }
        
        // Migrar imagens
        if (product.images && product.images.length > 0) {
          for (const image of product.images) {
            const { error: imageError } = await supabase
              .from('product_images')
              .upsert({
                id: image.id,
                product_id: product.id,
                url: image.url,
                is_main: image.isMain,
                order_position: image.order
              });
            
            if (imageError) console.error('Erro ao migrar imagem:', imageError);
          }
        }
        
        // Migrar grupos de variação
        if (product.variationGroups && product.variationGroups.length > 0) {
          for (const group of product.variationGroups) {
            const { error: groupError } = await supabase
              .from('product_variation_groups')
              .upsert({
                id: group.id,
                product_id: product.id,
                name: group.name,
                required: group.required,
                multiple_selection: group.multipleSelection
              });
            
            if (groupError) {
              console.error('Erro ao migrar grupo de variação:', groupError);
              continue;
            }
            
            // Migrar opções de variação
            if (group.options && group.options.length > 0) {
              for (const option of group.options) {
                const { error: optionError } = await supabase
                  .from('product_variation_options')
                  .upsert({
                    id: option.id,
                    group_id: group.id,
                    name: option.name,
                    price_modifier: option.priceModifier
                  });
                
                if (optionError) console.error('Erro ao migrar opção de variação:', optionError);
              }
            }
          }
        }
      }
    }
    
    // Marcar migração como concluída
    localStorage.setItem('dataMigrated', 'true');
    console.log('Migração de dados concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração de dados:', error);
  }
}
