import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Product, ProductImage, ProductVariationGroup, ProductVariationOption } from '../types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

// ... (Interface ProductContextType e initialProducts como na sua versão anterior) ...
interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>; // Retorna ID ou null
  updateProduct: (id: string, productUpdates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'images' | 'variationGroups'>>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductStatus: (id: string, currentStatus: boolean) => Promise<void>;
  // Imagens
  addProductImage: (productId: string, imageData: Omit<ProductImage, 'id' | 'productId'>) => Promise<ProductImage | null>;
  updateProductImage: (imageId: string, updates: Partial<Omit<ProductImage, 'id' | 'productId'>>) => Promise<void>;
  removeProductImage: (imageId: string) => Promise<void>;
  reorderProductImages: (productId: string, images: ProductImage[]) => Promise<void>;
  setMainProductImage: (productId: string, imageIdToSetAsMain: string) => Promise<void>;
  // Grupos de Variação
  addVariationGroup: (productId: string, groupData: Omit<ProductVariationGroup, 'id' | 'productId' | 'options'>) => Promise<ProductVariationGroup | null>;
  updateVariationGroup: (groupId: string, updates: Partial<Omit<ProductVariationGroup, 'id' | 'productId' | 'options'>>) => Promise<void>; // productId não é necessário para update se groupId é PK
  removeVariationGroup: (groupId: string) => Promise<void>;
  // Opções de Variação
  addVariationOption: (groupId: string, optionData: Omit<ProductVariationOption, 'id' | 'groupId'>) => Promise<ProductVariationOption | null>;
  updateVariationOption: (optionId: string, updates: Partial<Omit<ProductVariationOption, 'id' | 'groupId'>>) => Promise<void>; // groupId não é necessário para update se optionId é PK
  removeVariationOption: (optionId: string) => Promise<void>;
  // Getters
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (categoryId: string) => Product[];
  getActiveProducts: () => Product[];
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);
const initialProducts: Product[] = [];


export function ProductProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = React.useState(true);

  // Função para carregar produtos - pode ser chamada por outras funções para refresh
  const loadProducts = async () => {
    // Não seta isLoading para true aqui, pois pode ser chamado por funções que já gerenciam isLoading
    console.log('[ProductContext] (loadProducts) Tentando buscar produtos do Supabase...');
    try {
      const { data: productsData, error: productsError, count } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          product_images!product_id(*),
          product_variation_groups!product_id(
            *,
            product_variation_options!group_id(*)
          )
        `, { count: 'exact' });

      console.log('[ProductContext] (loadProducts) Resultado - Count:', count, 'Error:', productsError);

      if (productsError) {
        console.error('Erro ao carregar produtos (loadProducts):', productsError);
        // Não mostrar toast aqui, pode ser chamado internamente
      }

      let currentProducts = initialProducts;
      if (productsData && productsData.length > 0) {
        // ... (lógica de mapeamento como antes) ...
        const productsWithRelations = productsData.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: product.price,
            categoryId: product.category_id || '',
            categoryName: product.category?.name || '',
            images: product.product_images ? product.product_images.map((img: any) => ({
              id: img.id,
              url: img.url,
              isMain: img.is_main,
              order: img.order_position !== undefined ? img.order_position : 0
            })).sort((a: ProductImage, b: ProductImage) => a.order - b.order) : [],
            variationGroups: product.product_variation_groups ? product.product_variation_groups.map((group: any) => ({
              id: group.id,
              name: group.name,
              required: group.required,
              multipleSelection: group.multiple_selection,
              options: group.product_variation_options ? group.product_variation_options.map((opt: any) => ({
                id: opt.id,
                name: opt.name,
                priceModifier: opt.price_modifier,
                stock: opt.stock_quantity !== undefined ? opt.stock_quantity : 0 
              })) : []
            })) : [],
            stockControl: product.stock_control || false,
            stockQuantity: product.stock_quantity || 0,
            autoStockReduction: product.auto_stock_reduction || false,
            active: product.active !== undefined ? product.active : true,
            createdAt: product.created_at,
            updatedAt: product.updated_at
          })) as Product[];
        currentProducts = productsWithRelations;
        console.log('[ProductContext] (loadProducts) Produtos carregados/recarregados do Supabase.');
        localStorage.setItem('gordopods-products', JSON.stringify(currentProducts));
      } else if (!productsError) {
        console.log('[ProductContext] (loadProducts) Nenhum produto no Supabase, tentando localStorage...');
        const storedProducts = localStorage.getItem('gordopods-products');
        if (storedProducts) currentProducts = JSON.parse(storedProducts);
        else console.log('[ProductContext] (loadProducts) Nenhum produto no localStorage.');
      } else {
          console.log('[ProductContext] (loadProducts) Erro ao buscar do Supabase, tentando localStorage...');
          const storedProducts = localStorage.getItem('gordopods-products');
          if (storedProducts) currentProducts = JSON.parse(storedProducts);
      }
      setProducts(currentProducts);
    } catch (error: any) {
      console.error('Erro crítico em loadProducts:', error);
      setProducts(initialProducts); // Fallback
    }
    // setIsLoading(false) é gerenciado pelo useEffect principal
  };

  // --- FETCH INICIAL DE PRODUTOS ---
  useEffect(() => {
    const initialLoad = async () => {
        console.log('[ProductContext] (useEffect) Iniciando fetch de produtos. Auth loading:', authIsLoading);
        setIsLoading(true);
        await loadProducts(); // Chama a função de carregamento refatorada
        if (!authIsLoading) {
            setIsLoading(false);
        }
    }
    initialLoad();
  }, [authIsLoading]);

  useEffect(() => {
    if (!authIsLoading && isLoading) {
      setIsLoading(false);
    }
  }, [authIsLoading, isLoading]);

  useEffect(() => {
    if (!isLoading && !authIsLoading) {
      if (products.length > 0 || localStorage.getItem('gordopods-products')) {
        localStorage.setItem('gordopods-products', JSON.stringify(products));
      }
    }
  }, [products, isLoading, authIsLoading]);

  // --- FUNÇÕES CRUD ---
  // ... (addProduct, updateProduct, deleteProduct, toggleProductStatus como antes) ...
  // ... (addProductImage, updateProductImage, removeProductImage, reorderProductImages, setMainProductImage como antes) ...
  // ... (addVariationGroup, addVariationOption como antes) ...
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => { /* ... sua implementação ... */ return null; };
  const updateProduct = async (id: string, productUpdates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'images' | 'variationGroups'>>) => { /* ... sua implementação ... */ };
  const deleteProduct = async (id: string) => { /* ... sua implementação ... */ };
  const toggleProductStatus = async (id: string, currentStatus: boolean) => { /* ... sua implementação ... */ };
  const addProductImage = async (productId: string, imageData: Omit<ProductImage, 'id' | 'productId'>): Promise<ProductImage | null> => { /* ... sua implementação ... */ return null;};
  const updateProductImage = async (imageId: string, updates: Partial<Omit<ProductImage, 'id' | 'productId'>>) => { /* ... sua implementação ... */ };
  const removeProductImage = async (imageId: string) => { /* ... sua implementação ... */ };
  const reorderProductImages = async (productId: string, images: ProductImage[]) => { /* ... sua implementação ... */ };
  const setMainProductImage = async (productId: string, imageIdToSetAsMain: string) => { /* ... sua implementação ... */ };
  const addVariationGroup = async (productId: string, groupData: Omit<ProductVariationGroup, 'id' | 'productId' | 'options'>): Promise<ProductVariationGroup | null> => { /* ... sua implementação ... */ return null;};
  const addVariationOption = async (groupId: string, optionData: Omit<ProductVariationOption, 'id' | 'groupId'>): Promise<ProductVariationOption | null> => { /* ... sua implementação ... */ return null;};


  // IMPLEMENTAÇÃO DAS FUNÇÕES RESTANTES:
  const updateVariationGroup = async (groupId: string, updates: Partial<Omit<ProductVariationGroup, 'id' | 'productId' | 'options'>>) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    setIsLoading(true); // Opcional, para feedback
    try {
      // Mapear nomes de propriedades se necessário (ex: multipleSelection -> multiple_selection)
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.required !== undefined) dbUpdates.required = updates.required;
      if (updates.multipleSelection !== undefined) dbUpdates.multiple_selection = updates.multipleSelection;
      // Adicione outras colunas da sua tabela product_variation_groups aqui

      const { error } = await supabase
        .from('product_variation_groups')
        .update(dbUpdates)
        .eq('id', groupId);

      if (error) throw error;
      await loadProducts(); // Recarrega todos os produtos para refletir a mudança
      toast.success('Grupo de variação atualizado!');
    } catch (error: any) {
      console.error('Erro ao atualizar grupo de variação:', error);
      toast.error(`Erro ao atualizar grupo: ${error.message}`);
    } finally {
      setIsLoading(false); // Opcional
    }
  };

  const removeVariationGroup = async (groupId: string) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    setIsLoading(true);
    try {
      // Se ON DELETE CASCADE não estiver configurado para product_variation_options.group_id,
      // você precisaria deletar as opções primeiro:
      // await supabase.from('product_variation_options').delete().eq('group_id', groupId);

      const { error } = await supabase
        .from('product_variation_groups')
        .delete()
        .eq('id', groupId);
      if (error) throw error;
      await loadProducts(); // Recarrega
      toast.success('Grupo de variação removido!');
    } catch (error: any) {
      console.error('Erro ao remover grupo de variação:', error);
      toast.error(`Erro ao remover grupo: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateVariationOption = async (optionId: string, updates: Partial<Omit<ProductVariationOption, 'id' | 'groupId'>>) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    setIsLoading(true); // Opcional
    try {
      // Mapear nomes de propriedades se necessário (ex: priceModifier -> price_modifier)
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.priceModifier !== undefined) dbUpdates.price_modifier = updates.priceModifier;
      if (updates.stock !== undefined) dbUpdates.stock_quantity = updates.stock; // Assumindo stock_quantity no DB
      // Adicione outras colunas da sua tabela product_variation_options aqui

      const { error } = await supabase
        .from('product_variation_options')
        .update(dbUpdates)
        .eq('id', optionId);

      if (error) throw error;
      await loadProducts(); // Recarrega
      toast.success('Opção de variação atualizada!');
    } catch (error: any) {
      console.error('Erro ao atualizar opção de variação:', error);
      toast.error(`Erro ao atualizar opção: ${error.message}`);
    } finally {
      setIsLoading(false); // Opcional
    }
  };

  const removeVariationOption = async (optionId: string) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('product_variation_options')
        .delete()
        .eq('id', optionId);
      if (error) throw error;
      await loadProducts(); // Recarrega
      toast.success('Opção de variação removida!');
    } catch (error: any) {
      console.error('Erro ao remover opção de variação:', error);
      toast.error(`Erro ao remover opção: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Getters ---
  const getProductById = (id: string) => products.find(product => product.id === id);
  const getProductsByCategory = (categoryId: string) => products.filter(product => product.categoryId === categoryId);
  const getActiveProducts = () => products.filter(product => product.active);

  return (
    <ProductContext.Provider 
      value={{
        products,
        isLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStatus,
        addProductImage,
        updateProductImage,
        removeProductImage,
        reorderProductImages,
        setMainProductImage,
        addVariationGroup,
        updateVariationGroup, // Agora implementada
        removeVariationGroup, // Agora implementada
        addVariationOption,
        updateVariationOption, // Agora implementada
        removeVariationOption, // Agora implementada
        getProductById,
        getProductsByCategory,
        getActiveProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
