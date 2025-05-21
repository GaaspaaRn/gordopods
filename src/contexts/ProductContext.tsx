import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Product, ProductImage, ProductVariationGroup, ProductVariationOption } from '../types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

// ... (Interface ProductContextType e initialProducts como antes) ...
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
  removeProductImage: (imageId: string) => Promise<void>; // productId não é estritamente necessário se o imageId for globalmente único
  reorderProductImages: (productId: string, images: ProductImage[]) => Promise<void>; // Recebe array de imagens com nova ordem
  setMainProductImage: (productId: string, imageIdToSetAsMain: string) => Promise<void>;
  // Grupos de Variação
  addVariationGroup: (productId: string, groupData: Omit<ProductVariationGroup, 'id' | 'productId' | 'options'>) => Promise<ProductVariationGroup | null>;
  updateVariationGroup: (groupId: string, updates: Partial<Omit<ProductVariationGroup, 'id' | 'productId' | 'options'>>) => Promise<void>;
  removeVariationGroup: (groupId: string) => Promise<void>;
  // Opções de Variação
  addVariationOption: (groupId: string, optionData: Omit<ProductVariationOption, 'id' | 'groupId'>) => Promise<ProductVariationOption | null>;
  updateVariationOption: (optionId: string, updates: Partial<Omit<ProductVariationOption, 'id' | 'groupId'>>) => Promise<void>;
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

  // --- FETCH INICIAL DE PRODUTOS (como modificado anteriormente) ---
  useEffect(() => {
    const loadProducts = async () => {
      console.log('[ProductContext] Iniciando fetch de produtos. Auth loading:', authIsLoading);
      setIsLoading(true);
      try {
        console.log('[ProductContext] Tentando buscar produtos do Supabase...');
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

        console.log('[ProductContext] Resultado da query de produtos - Count:', count, 'Error:', productsError);

        if (productsError) {
          console.error('Erro ao carregar produtos do Supabase:', productsError);
        }

        let currentProducts = initialProducts;
        if (productsData && productsData.length > 0) {
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
          console.log('[ProductContext] Produtos carregados do Supabase:', currentProducts);
          localStorage.setItem('gordopods-products', JSON.stringify(currentProducts));
        } else if (!productsError) {
          console.log('[ProductContext] Nenhum produto no Supabase, tentando localStorage...');
          const storedProducts = localStorage.getItem('gordopods-products');
          if (storedProducts) currentProducts = JSON.parse(storedProducts);
          else console.log('[ProductContext] Nenhum produto no localStorage, usando array vazio.');
        } else {
            console.log('[ProductContext] Erro ao buscar do Supabase, tentando localStorage...');
            const storedProducts = localStorage.getItem('gordopods-products');
            if (storedProducts) currentProducts = JSON.parse(storedProducts);
            else console.log('[ProductContext] Nenhum produto no localStorage (após erro Supabase), usando array vazio.');
        }
        setProducts(currentProducts);
      } catch (error: any) {
        console.error('Erro crítico ao carregar produtos (bloco catch):', error);
        toast.error(`Erro inesperado ao carregar produtos: ${error.message}`);
        setProducts(initialProducts);
      } finally {
        if (!authIsLoading) {
            setIsLoading(false);
        }
      }
    };
    loadProducts();
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

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    if (!isAuthenticated) { toast.error("Login necessário."); return null; }
    setIsLoading(true);
    try {
      const productToInsert = {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category_id: productData.categoryId,
        stock_control: productData.stockControl,
        stock_quantity: productData.stockQuantity,
        auto_stock_reduction: productData.autoStockReduction,
        active: productData.active,
        // created_at e updated_at são definidos pelo Supabase
      };
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert(productToInsert)
        .select()
        .single();

      if (error || !newProduct) {
        throw error || new Error("Falha ao criar produto");
      }
      // Aqui você precisaria mapear newProduct de volta para o tipo Product e adicionar ao estado
      // E depois salvar imagens e variações referenciando newProduct.id
      // Por simplicidade, vamos recarregar todos os produtos. Para UX melhor, atualize o estado local.
      await loadProducts(); // Recarrega para simplicidade
      toast.success('Produto adicionado!');
      setIsLoading(false);
      return newProduct.id;
    } catch (error: any) {
      console.error('Erro ao adicionar produto:', error);
      toast.error(`Erro ao adicionar produto: ${error.message}`);
      setIsLoading(false);
      return null;
    }
  };

  const updateProduct = async (id: string, productUpdates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'images' | 'variationGroups'>>) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    setIsLoading(true);
    try {
      const updatesForDb: any = { ...productUpdates };
      if (productUpdates.categoryId) { // Mapeia para o nome da coluna do DB
        updatesForDb.category_id = productUpdates.categoryId;
        delete updatesForDb.categoryId;
      }
      // Adicione outros mapeamentos de nome de propriedade se necessário

      const { error } = await supabase
        .from('products')
        .update(updatesForDb)
        .eq('id', id);
      if (error) throw error;

      // Atualiza o estado local
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...productUpdates } as Product : p));
      toast.success('Produto atualizado!');
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error);
      toast.error(`Erro ao atualizar produto: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    setIsLoading(true);
    try {
      // Primeiro, delete as dependências (imagens, variações) ou configure CASCADE DELETE no Supabase
      // Exemplo simplificado:
      await supabase.from('product_images').delete().eq('product_id', id);
      // ...deletar product_variation_options, depois product_variation_groups...
      // Ou, se CASCADE DELETE estiver configurado no DB para product_id em tabelas filhas:
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Produto removido!');
    } catch (error: any) {
      console.error('Erro ao remover produto:', error);
      toast.error(`Erro ao remover produto: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProductStatus = async (id: string, currentStatus: boolean) => {
    await updateProduct(id, { active: !currentStatus });
  };

  // --- Imagens ---
  const addProductImage = async (productId: string, imageData: Omit<ProductImage, 'id' | 'productId'>): Promise<ProductImage | null> => {
    if (!isAuthenticated) { toast.error("Login necessário."); return null; }
    try {
      const { data, error } = await supabase
        .from('product_images')
        .insert({ ...imageData, product_id: productId })
        .select()
        .single();
      if (error || !data) throw error || new Error("Falha ao adicionar imagem");
      // Atualiza o estado local do produto específico
      setProducts(prevProds => prevProds.map(p => {
        if (p.id === productId) {
          return { ...p, images: [...p.images, {id: data.id, ...imageData}] };
        }
        return p;
      }));
      return {id: data.id, ...imageData};
    } catch (error: any) {
      toast.error(`Erro ao adicionar imagem: ${error.message}`);
      return null;
    }
  };

  const updateProductImage = async (imageId: string, updates: Partial<Omit<ProductImage, 'id' | 'productId'>>) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    try {
      const { error } = await supabase.from('product_images').update(updates).eq('id', imageId);
      if (error) throw error;
      // Recarregar produtos para simplicidade ou atualizar estado local mais granularmente
      await loadProducts();
      toast.success("Imagem atualizada.");
    } catch (error: any) {
      toast.error(`Erro ao atualizar imagem: ${error.message}`);
    }
  };

  const removeProductImage = async (imageId: string) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    try {
      const { error } = await supabase.from('product_images').delete().eq('id', imageId);
      if (error) throw error;
      await loadProducts(); // Recarregar
      toast.success("Imagem removida.");
    } catch (error: any) {
      toast.error(`Erro ao remover imagem: ${error.message}`);
    }
  };

  const reorderProductImages = async (productId: string, imagesWithNewOrder: ProductImage[]) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    try {
      // Isso exigiria múltiplas chamadas update ou uma função RPC.
      // Por simplicidade, vamos apenas atualizar o estado local e depois refazer o fetch completo.
      // Em um cenário real, você faria upsert em todas as imagens com suas novas 'order_position'.
      for (const image of imagesWithNewOrder) {
        await supabase.from('product_images').update({ order_position: image.order }).eq('id', image.id);
      }
      await loadProducts(); // Recarregar para garantir consistência
      toast.success("Ordem das imagens atualizada.");
    } catch (error: any) {
      toast.error(`Erro ao reordenar imagens: ${error.message}`);
    }
  };

  const setMainProductImage = async (productId: string, imageIdToSetAsMain: string) => {
    if (!isAuthenticated) { toast.error("Login necessário."); return; }
    try {
      // Primeiro, desmarca todas as outras como principal para este produto
      await supabase.from('product_images').update({ is_main: false }).eq('product_id', productId);
      // Depois, marca a nova como principal
      await supabase.from('product_images').update({ is_main: true }).eq('id', imageIdToSetAsMain);
      await loadProducts(); // Recarregar
      toast.success("Imagem principal definida.");
    } catch (error: any) {
      toast.error(`Erro ao definir imagem principal: ${error.message}`);
    }
  };

  // --- Grupos de Variação ---
  const addVariationGroup = async (productId: string, groupData: Omit<ProductVariationGroup, 'id' | 'productId' | 'options'>): Promise<ProductVariationGroup | null> => {
    if (!isAuthenticated) { toast.error("Login necessário."); return null; }
    try {
      const { data, error } = await supabase
        .from('product_variation_groups')
        .insert({ ...groupData, product_id: productId })
        .select()
        .single();
      if (error || !data) throw error || new Error("Falha ao adicionar grupo");
      await loadProducts();
      return { ...data, options: [] } as ProductVariationGroup; // options vazio inicialmente
    } catch (error: any) {
      toast.error(`Erro ao adicionar grupo de variação: ${error.message}`);
      return null;
    }
  };

  // ... (Implemente updateVariationGroup, removeVariationGroup de forma similar)
  const updateVariationGroup = async (groupId: string, updates: Partial<Omit<ProductVariationGroup, 'id' | 'productId' | 'options'>>) => { if (!isAuthenticated) { toast.error("Login necessário."); return; } console.warn("updateVariationGroup não implementado"); setIsLoading(false); };
  const removeVariationGroup = async (groupId: string) => { if (!isAuthenticated) { toast.error("Login necessário."); return; } console.warn("removeVariationGroup não implementado"); setIsLoading(false); };


  // --- Opções de Variação ---
  const addVariationOption = async (groupId: string, optionData: Omit<ProductVariationOption, 'id' | 'groupId'>): Promise<ProductVariationOption | null> => {
    if (!isAuthenticated) { toast.error("Login necessário."); return null; }
    try {
      const { data, error } = await supabase
        .from('product_variation_options')
        .insert({ ...optionData, group_id: groupId })
        .select()
        .single();
      if (error || !data) throw error || new Error("Falha ao adicionar opção");
      await loadProducts();
      return data as ProductVariationOption;
    } catch (error: any) {
      toast.error(`Erro ao adicionar opção de variação: ${error.message}`);
      return null;
    }
  };

  // ... (Implemente updateVariationOption, removeVariationOption de forma similar) ...
  const updateVariationOption = async (optionId: string, updates: Partial<Omit<ProductVariationOption, 'id' | 'groupId'>>) => { if (!isAuthenticated) { toast.error("Login necessário."); return; } console.warn("updateVariationOption não implementado"); setIsLoading(false); };
  const removeVariationOption = async (optionId: string) => { if (!isAuthenticated) { toast.error("Login necessário."); return; } console.warn("removeVariationOption não implementado"); setIsLoading(false); };


  // --- Getters (operam sobre o estado local) ---
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
        updateVariationGroup,
        removeVariationGroup,
        addVariationOption,
        updateVariationOption,
        removeVariationOption,
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
