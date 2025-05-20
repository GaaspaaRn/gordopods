import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Product, ProductImage, ProductVariationGroup, ProductVariationOption } from '../types';
import { toast } from 'sonner';
import { useCategories } from './CategoryContext'; // Você pode precisar disso se houver dependência
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext'; // 1. Importe useAuth

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductStatus: (id: string) => Promise<void>;
  addProductImage: (productId: string, url: string, isMain?: boolean) => Promise<void>;
  updateProductImage: (productId: string, imageId: string, updates: Partial<Omit<ProductImage, 'id'>>) => Promise<void>;
  removeProductImage: (productId: string, imageId: string) => Promise<void>;
  reorderProductImages: (productId: string, imageIds: string[]) => Promise<void>;
  setMainProductImage: (productId: string, imageId: string) => Promise<void>;
  addVariationGroup: (productId: string, group: Omit<ProductVariationGroup, 'id'>) => Promise<string>;
  updateVariationGroup: (productId: string, groupId: string, updates: Partial<Omit<ProductVariationGroup, 'id'>>) => Promise<void>;
  removeVariationGroup: (productId: string, groupId: string) => Promise<void>;
  addVariationOption: (productId: string, groupId: string, option: Omit<ProductVariationOption, 'id'>) => Promise<string>;
  updateVariationOption: (productId: string, groupId: string, optionId: string, updates: Partial<Omit<ProductVariationOption, 'id'>>) => Promise<void>;
  removeVariationOption: (productId: string, groupId: string, optionId: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (categoryId: string) => Product[];
  getActiveProducts: () => Product[];
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Sample product data (mantenha sua lógica de fallback se desejar)
const initialProducts: Product[] = [
  // ... seus produtos mock ...
];

export function ProductProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth(); // 2. Use o estado de autenticação
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true); // Loading do ProductContext
  // const { categories } = useCategories(); // Descomente se loadProducts depender de categories

  useEffect(() => {
    const loadProducts = async () => {
      // 3. Adicione a condição para buscar dados
      // Adicione `&& categories.length > 0` se a busca de produtos depender das categorias já carregadas
      if (isAuthenticated && !authIsLoading /* && categories.length > 0 */) {
        setIsLoading(true);
        try {
          console.log('[ProductContext] Usuário autenticado, buscando produtos do Supabase...');
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select(`
              *,
              category:categories(id, name),
              product_images:product_images(*),
              product_variation_groups:product_variation_groups(
                *,
                product_variation_options:product_variation_options(*)
              )
            `);

          if (productsError) {
            console.error('Erro ao carregar produtos do Supabase:', productsError);
            toast.error(`Erro Supabase (Produtos): ${productsError.message}`);
            const storedProducts = localStorage.getItem('gordopods-products');
            setProducts(storedProducts ? JSON.parse(storedProducts) : initialProducts);
            return;
          }

          if (!productsData) {
            console.warn('[ProductContext] Nenhum dado de produto retornado do Supabase.');
            setProducts(initialProducts); // Ou um array vazio se preferir
            return;
          }
          
          // O mapeamento que você tinha aqui parecia bom para lidar com os dados aninhados.
          // Vou mantê-lo, mas certifique-se que os nomes das colunas no Supabase correspondem.
          const productsWithRelations = productsData.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: product.price,
            categoryId: product.category_id || '', // Do join com categories
            images: product.product_images ? product.product_images.map((img: any) => ({
              id: img.id,
              url: img.url,
              isMain: img.is_main,
              order: img.order_position
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
                stock: opt.stock_quantity // Se você tiver estoque por variação
              })) : []
            })) : [],
            stockControl: product.stock_control || false,
            stockQuantity: product.stock_quantity || 0,
            autoStockReduction: product.auto_stock_reduction || false,
            active: product.active || false,
            createdAt: product.created_at,
            updatedAt: product.updated_at
          })) as Product[];


          setProducts(productsWithRelations);
          localStorage.setItem('gordopods-products', JSON.stringify(productsWithRelations));
          console.log('[ProductContext] Produtos carregados do Supabase:', productsWithRelations);

        } catch (error: any) {
          console.error('Erro inesperado ao carregar produtos (bloco catch):', error);
          toast.error(`Erro inesperado (Produtos): ${error.message}`);
          const storedProducts = localStorage.getItem('gordopods-products');
          setProducts(storedProducts ? JSON.parse(storedProducts) : initialProducts);
        } finally {
          setIsLoading(false);
        }
      } else if (!authIsLoading && !isAuthenticated) {
        console.log('[ProductContext] Usuário não autenticado. Carregando do localStorage ou iniciais.');
        const storedProducts = localStorage.getItem('gordopods-products');
        setProducts(storedProducts ? JSON.parse(storedProducts) : initialProducts);
        setIsLoading(false);
      } else if (authIsLoading) {
        console.log('[ProductContext] Aguardando status de autenticação para carregar produtos...');
      }
    };
    
    loadProducts();
  }, [isAuthenticated, authIsLoading /* , categories */]); // 4. Adicione dependências
                                                      // Adicione 'categories' se loadProducts depender dele

  // Salvar produtos no localStorage quando mudarem (parece OK)
  useEffect(() => {
    if (!isLoading && products.length > 0) {
      localStorage.setItem('gordopods-products', JSON.stringify(products));
    }
  }, [products, isLoading]);
  
  // ... Suas funções CRUD (addProduct, updateProduct, deleteProduct, etc.) ...
  // Certifique-se de que elas estão usando `await supabase...` e que as colunas
  // no Supabase (ex: category_id, product_id, is_main, order_position, etc.)
  // correspondem ao que você está enviando.
  // O erro de UUID na exclusão precisa ser investigado na sua página de listagem
  // ou onde quer que deleteProduct(id) seja chamado, para garantir que 'id' é o UUID.

  const findProductIndex = (id: string) => {
    const index = products.findIndex(product => product.id === id);
    if (index === -1) {
      // Não lance erro aqui, retorne -1 ou trate de outra forma se o produto puder não existir ainda no estado
      // console.warn(`Product with ID ${id} not found in local state`);
    }
    return index;
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const id = crypto.randomUUID(); // Ou deixe o Supabase gerar se for serial
      
      const newProductDB = {
        id, // Se seu ID no Supabase é gerado pelo DB, omita isso e pegue do retorno
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category_id: productData.categoryId,
        stock_control: productData.stockControl,
        stock_quantity: productData.stockQuantity,
        auto_stock_reduction: productData.autoStockReduction,
        active: productData.active,
        created_at: now,
        updated_at: now,
      };

      const { data: insertedProduct, error } = await supabase
        .from('products')
        .insert(newProductDB)
        .select()
        .single(); // Para pegar o produto inserido, incluindo ID gerado pelo DB
      
      if (error || !insertedProduct) {
        console.error('Erro ao adicionar produto no Supabase:', error);
        toast.error(`Erro Supabase: ${error?.message || 'Falha ao inserir produto'}`);
        setIsLoading(false);
        return ''; // Ou lance o erro
      }
      
      // Mapear para o tipo Product do frontend
      const newProductApp: Product = {
        ...productData,
        id: insertedProduct.id, // Usa o ID retornado pelo Supabase
        createdAt: insertedProduct.created_at,
        updatedAt: insertedProduct.updated_at,
        images: [], // As imagens e variações serão salvas separadamente
        variationGroups: [],
      };

      // Salvar imagens do produto
      const savedImages: ProductImage[] = [];
      for (const image of productData.images || []) {
        const imageId = image.id || crypto.randomUUID();
        const { data: imgData, error: imgError } = await supabase
          .from('product_images')
          .insert({
            id: imageId,
            product_id: insertedProduct.id,
            url: image.url,
            is_main: image.isMain,
            order_position: image.order
          })
          .select()
          .single();
        if (imgError) console.error('Erro ao salvar imagem:', imgError);
        else if (imgData) savedImages.push({ id: imgData.id, url: imgData.url, isMain: imgData.is_main, order: imgData.order_position });
      }
      newProductApp.images = savedImages;

      // Salvar grupos de variação e opções
      const savedVariationGroups: ProductVariationGroup[] = [];
      for (const group of productData.variationGroups || []) {
        const groupId = group.id || crypto.randomUUID();
        const { data: groupData, error: groupError } = await supabase
          .from('product_variation_groups')
          .insert({
            id: groupId,
            product_id: insertedProduct.id,
            name: group.name,
            required: group.required,
            multiple_selection: group.multipleSelection
          })
          .select()
          .single();
        
        if (!groupError && groupData) {
          const savedOptions: ProductVariationOption[] = [];
          for (const option of group.options) {
            const optionId = option.id || crypto.randomUUID();
            const { data: optData, error: optError } = await supabase
              .from('product_variation_options')
              .insert({
                id: optionId,
                group_id: groupData.id,
                name: option.name,
                price_modifier: option.priceModifier,
                // stock_quantity: option.stock // Se tiver estoque por opção
              })
              .select()
              .single();
            if (optError) console.error('Erro ao salvar opção de variação:', optError);
            else if (optData) savedOptions.push({ id: optData.id, name: optData.name, priceModifier: optData.price_modifier, stock: optData.stock_quantity });
          }
          savedVariationGroups.push({
            id: groupData.id,
            name: groupData.name,
            required: groupData.required,
            multipleSelection: groupData.multiple_selection,
            options: savedOptions
          });
        } else if (groupError) {
          console.error('Erro ao salvar grupo de variação:', groupError);
        }
      }
      newProductApp.variationGroups = savedVariationGroups;

      setProducts(prev => [...prev, newProductApp]);
      toast.success('Produto adicionado com sucesso!');
      setIsLoading(false);
      return insertedProduct.id;
    } catch (error: any) {
      console.error('Erro ao adicionar produto (bloco catch):', error);
      toast.error(`Erro inesperado: ${error.message}`);
      setIsLoading(false);
      throw error; // Re-lança para que o formulário possa tratar se necessário
    }
  };
  
  // ... (Implemente as outras funções CRUD: updateProduct, deleteProduct, etc.,
  //      de forma similar, garantindo que as chamadas ao Supabase estejam corretas
  //      e que as RLS no backend permitam as operações para usuários autenticados)

  const deleteProduct = async (id: string) => { // id aqui DEVE SER o UUID
    setIsLoading(true);
    try {
      console.log('[ProductContext] Tentando excluir produto com ID (UUID):', id);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id); // Garanta que 'id' é a coluna UUID correta
      
      if (error) {
        console.error(`Erro ao excluir produto ${id} do Supabase:`, error);
        toast.error(error.message || 'Erro ao excluir produto do banco de dados');
        setIsLoading(false);
        return;
      }
      
      setProducts(prev => prev.filter(product => product.id !== id));
      toast.success('Produto removido com sucesso!');
    } catch (error: any) {
      console.error(`Erro ao excluir produto ${id}:`, error);
      toast.error(error.message || 'Erro ao remover produto');
    } finally {
      setIsLoading(false);
    }
  };


  // Implementar as demais funções de forma similar, sempre usando `await supabase...`
  // e tratando os erros.

  const updateProduct = async (id: string, updates: Partial<Product>) => { /* ... */ setIsLoading(false); Promise.resolve(); };
  const toggleProductStatus = async (id: string) => { /* ... */ setIsLoading(false);Promise.resolve(); };
  const addProductImage = async (productId: string, url: string, isMain: boolean = false) => { /* ... */ setIsLoading(false);Promise.resolve(); };
  const updateProductImage = async (productId: string, imageId: string, updates: Partial<Omit<ProductImage, 'id'>>) => { /* ... */setIsLoading(false); Promise.resolve(); };
  const removeProductImage = async (productId: string, imageId: string) => { /* ... */ setIsLoading(false);Promise.resolve(); };
  const reorderProductImages = async (productId: string, imageIds: string[]) => { /* ... */setIsLoading(false); Promise.resolve(); };
  const setMainProductImage = async (productId: string, imageId: string) => { /* ... */ setIsLoading(false);Promise.resolve(); };
  const addVariationGroup = async (productId: string, group: Omit<ProductVariationGroup, 'id'>) => { /* ... */setIsLoading(false); return Promise.resolve(''); };
  const updateVariationGroup = async (productId: string, groupId: string, updates: Partial<Omit<ProductVariationGroup, 'id'>>) => { /* ... */setIsLoading(false); Promise.resolve(); };
  const removeVariationGroup = async (productId: string, groupId: string) => { /* ... */ setIsLoading(false);Promise.resolve(); };
  const addVariationOption = async (productId: string, groupId: string, option: Omit<ProductVariationOption, 'id'>) => { /* ... */setIsLoading(false); return Promise.resolve(''); };
  const updateVariationOption = async (productId: string, groupId: string, optionId: string, updates: Partial<Omit<ProductVariationOption, 'id'>>) => { /* ... */setIsLoading(false); Promise.resolve(); };
  const removeVariationOption = async (productId: string, groupId: string, optionId: string) => { /* ... */setIsLoading(false); Promise.resolve(); };
  
  // Query operations (parecem OK, operam sobre o estado local)
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
