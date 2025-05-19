import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Product, ProductImage, ProductVariationGroup, ProductVariationOption } from '../types';
import { toast } from 'sonner';
import { useCategories } from './CategoryContext';
import { supabase } from '@/integrations/supabase/client';

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

// Sample product data
const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Gordopod Classic',
    description: 'O pod mais vendido da nossa loja, sabor de tabaco clássico.',
    price: 49.90,
    categoryId: '1',
    images: [
      {
        id: '1',
        url: 'https://via.placeholder.com/300x300?text=Pod+Classic',
        isMain: true,
        order: 0
      },
      {
        id: '2',
        url: 'https://via.placeholder.com/300x300?text=Pod+Classic+2',
        isMain: false,
        order: 1
      }
    ],
    variationGroups: [
      {
        id: '1',
        name: 'Sabor',
        options: [
          { id: '1', name: 'Tabaco', priceModifier: 0 },
          { id: '2', name: 'Menta', priceModifier: 5 },
          { id: '3', name: 'Frutas', priceModifier: 10 }
        ],
        required: true,
        multipleSelection: false
      },
      {
        id: '2',
        name: 'Nicotina',
        options: [
          { id: '1', name: '0mg', priceModifier: 0 },
          { id: '2', name: '3mg', priceModifier: 0 },
          { id: '3', name: '5mg', priceModifier: 5 }
        ],
        required: true,
        multipleSelection: false
      }
    ],
    stockControl: true,
    stockQuantity: 100,
    autoStockReduction: true,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Gordopod Premium',
    description: 'Nossa linha premium com maior duração e mais puffs.',
    price: 79.90,
    categoryId: '2',
    images: [
      {
        id: '1',
        url: 'https://via.placeholder.com/300x300?text=Pod+Premium',
        isMain: true,
        order: 0
      }
    ],
    variationGroups: [
      {
        id: '1',
        name: 'Sabor',
        options: [
          { id: '1', name: 'Tabaco Premium', priceModifier: 0 },
          { id: '2', name: 'Hortelã', priceModifier: 0 }
        ],
        required: true,
        multipleSelection: false
      }
    ],
    stockControl: true,
    stockQuantity: 50,
    autoStockReduction: true,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { categories } = useCategories();
  
  // Carregar produtos do Supabase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        
        // Tentar carregar do Supabase
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*');

        if (productsError) {
          console.error('Erro ao carregar produtos do Supabase:', productsError);
          
          // Carregar do localStorage como fallback
          const storedProducts = localStorage.getItem('products');
          if (storedProducts) {
            setProducts(JSON.parse(storedProducts));
          } else {
            setProducts(initialProducts);
          }
          return;
        }

        if (!productsData || productsData.length === 0) {
          // Se não houver dados no Supabase, usar dados iniciais
          setProducts(initialProducts);
          return;
        }

        // Carregar imagens dos produtos
        const productsWithImages = await Promise.all(productsData.map(async (product) => {
          const { data: imagesData, error: imagesError } = await supabase
            .from('product_images')
            .select('*')
            .eq('product_id', product.id);

          if (imagesError) {
            console.error(`Erro ao carregar imagens para produto ${product.id}:`, imagesError);
            return {
              ...product,
              images: [],
              variationGroups: []
            };
          }

          // Carregar grupos de variação
          const { data: variationGroupsData, error: variationGroupsError } = await supabase
            .from('product_variation_groups')
            .select('*')
            .eq('product_id', product.id);

          let variationGroups = [];
          
          if (!variationGroupsError && variationGroupsData) {
            variationGroups = await Promise.all(variationGroupsData.map(async (group) => {
              const { data: optionsData, error: optionsError } = await supabase
                .from('product_variation_options')
                .select('*')
                .eq('group_id', group.id);

              if (optionsError) {
                console.error(`Erro ao carregar opções para grupo ${group.id}:`, optionsError);
                return {
                  ...group,
                  options: []
                };
              }

              return {
                id: group.id,
                name: group.name,
                required: group.required,
                multipleSelection: group.multiple_selection,
                options: optionsData.map(option => ({
                  id: option.id,
                  name: option.name,
                  priceModifier: option.price_modifier
                }))
              };
            }));
          }

          // Properly map all properties to match the Product interface
          return {
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: product.price,
            categoryId: product.category_id || '',
            images: imagesData ? imagesData.map(img => ({
              id: img.id,
              url: img.url,
              isMain: img.is_main,
              order: img.order_position
            })).sort((a, b) => a.order - b.order) : [],
            variationGroups: variationGroups,
            stockControl: product.stock_control || false,
            stockQuantity: product.stock_quantity || 0,
            autoStockReduction: product.auto_stock_reduction || false,
            active: product.active || false,
            createdAt: product.created_at,
            updatedAt: product.updated_at
          } as Product;
        })) as Product[]; // Explicitly cast the whole array to Product[]

        // Set the mapped products to state
        setProducts(productsWithImages);
        
        // Salvar no localStorage como backup
        localStorage.setItem('products', JSON.stringify(productsWithImages));
      } catch (error) {
        console.error('Erro inesperado ao carregar produtos:', error);
        
        // Tentar carregar do localStorage como último recurso
        const storedProducts = localStorage.getItem('products');
        if (storedProducts) {
          setProducts(JSON.parse(storedProducts));
        } else {
          setProducts(initialProducts);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProducts();
  }, []);
  
  // Salvar produtos no localStorage quando mudarem
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('products', JSON.stringify(products));
    }
  }, [products, isLoading]);
  
  // Helper para encontrar o índice de um produto
  const findProductIndex = (id: string) => {
    const index = products.findIndex(product => product.id === id);
    if (index === -1) {
      throw new Error(`Product with ID ${id} not found`);
    }
    return index;
  };

  // CRUD operations for products
  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      
      const newProduct: Product = {
        ...product,
        id,
        createdAt: now,
        updatedAt: now
      };
      
      // Adicionar ao estado local
      setProducts(prev => [...prev, newProduct]);
      
      // Salvar no Supabase
      const { error } = await supabase
        .from('products')
        .insert({
          id: newProduct.id,
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          category_id: newProduct.categoryId,
          stock_control: newProduct.stockControl,
          stock_quantity: newProduct.stockQuantity,
          auto_stock_reduction: newProduct.autoStockReduction,
          active: newProduct.active,
          created_at: newProduct.createdAt,
          updated_at: newProduct.updatedAt
        });
      
      if (error) {
        console.error('Erro ao adicionar produto no Supabase:', error);
        toast.error('Erro ao salvar produto no banco de dados');
      } else {
        // Salvar imagens do produto
        for (const image of newProduct.images) {
          await supabase
            .from('product_images')
            .insert({
              id: image.id,
              product_id: newProduct.id,
              url: image.url,
              is_main: image.isMain,
              order_position: image.order
            });
        }
        
        // Salvar grupos de variação
        for (const group of newProduct.variationGroups) {
          const { data: groupData, error: groupError } = await supabase
            .from('product_variation_groups')
            .insert({
              id: group.id,
              product_id: newProduct.id,
              name: group.name,
              required: group.required,
              multiple_selection: group.multipleSelection
            })
            .select();
          
          if (!groupError && groupData) {
            // Salvar opções de variação
            for (const option of group.options) {
              await supabase
                .from('product_variation_options')
                .insert({
                  id: option.id,
                  group_id: group.id,
                  name: option.name,
                  price_modifier: option.priceModifier
                });
            }
          }
        }
        
        toast.success('Produto adicionado com sucesso!');
      }
      
      return id;
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast.error('Erro ao adicionar produto');
      throw error;
    }
  };
  
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const updatedProduct = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Atualizar no estado local
      setProducts(prev => prev.map(product => 
        product.id === id
          ? { ...product, ...updatedProduct }
          : product
      ));
      
      // Atualizar no Supabase
      const { error } = await supabase
        .from('products')
        .update({
          name: updates.name,
          description: updates.description,
          price: updates.price,
          category_id: updates.categoryId,
          stock_control: updates.stockControl,
          stock_quantity: updates.stockQuantity,
          auto_stock_reduction: updates.autoStockReduction,
          active: updates.active,
          updated_at: updatedProduct.updatedAt
        })
        .eq('id', id);
      
      if (error) {
        console.error(`Erro ao atualizar produto ${id} no Supabase:`, error);
        toast.error('Erro ao salvar alterações no banco de dados');
      } else {
        toast.success('Produto atualizado com sucesso!');
      }
    } catch (error) {
      console.error(`Erro ao atualizar produto ${id}:`, error);
      toast.error('Erro ao atualizar produto');
      throw error;
    }
  };
  
  const deleteProduct = async (id: string) => {
    try {
      // Remover do estado local
      setProducts(prev => prev.filter(product => product.id !== id));
      
      // Remover do Supabase
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Erro ao excluir produto ${id} do Supabase:`, error);
        toast.error('Erro ao excluir produto do banco de dados');
      } else {
        toast.success('Produto removido com sucesso!');
      }
    } catch (error) {
      console.error(`Erro ao excluir produto ${id}:`, error);
      toast.error('Erro ao remover produto');
      throw error;
    }
  };
  
  const toggleProductStatus = async (id: string) => {
    try {
      const product = products.find(p => p.id === id);
      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }
      
      const newStatus = !product.active;
      const now = new Date().toISOString();
      
      // Atualizar no estado local
      setProducts(prev => prev.map(product => 
        product.id === id
          ? { ...product, active: newStatus, updatedAt: now }
          : product
      ));
      
      // Atualizar no Supabase
      const { error } = await supabase
        .from('products')
        .update({
          active: newStatus,
          updated_at: now
        })
        .eq('id', id);
      
      if (error) {
        console.error(`Erro ao alterar status do produto ${id} no Supabase:`, error);
        toast.error('Erro ao salvar alterações no banco de dados');
      } else {
        toast.success(`Produto ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
      }
    } catch (error) {
      console.error(`Erro ao alterar status do produto ${id}:`, error);
      toast.error('Erro ao alterar status do produto');
      throw error;
    }
  };

  // Product image operations
  const addProductImage = async (productId: string, url: string, isMain: boolean = false) => {
    try {
      const productIndex = findProductIndex(productId);
      const productCopy = [...products];
      const product = { ...productCopy[productIndex] };
      
      const newImage: ProductImage = {
        id: crypto.randomUUID(),
        url,
        isMain: isMain || product.images.length === 0, // First image is main by default
        order: product.images.length
      };
      
      // If the new image is main, make all others not main
      let updatedImages = [...product.images];
      if (newImage.isMain) {
        updatedImages = updatedImages.map(img => ({ ...img, isMain: false }));
      }
      
      product.images = [...updatedImages, newImage];
      productCopy[productIndex] = product;
      
      setProducts(productCopy);
      
      // Salvar no Supabase
      const { error } = await supabase
        .from('product_images')
        .insert({
          id: newImage.id,
          product_id: productId,
          url: newImage.url,
          is_main: newImage.isMain,
          order_position: newImage.order
        });
        
      if (error) {
        console.error('Erro ao salvar imagem no Supabase:', error);
      }
      
      toast.success('Imagem adicionada com sucesso!');
    } catch (error) {
      console.error(`Error adding image to product ${productId}:`, error);
      toast.error('Erro ao adicionar imagem');
    }
  };
  
  const updateProductImage = async (productId: string, imageId: string, updates: Partial<Omit<ProductImage, 'id'>>) => {
    try {
      const productIndex = findProductIndex(productId);
      const productCopy = [...products];
      const product = { ...productCopy[productIndex] };
      
      product.images = product.images.map(img => 
        img.id === imageId ? { ...img, ...updates } : img
      );
      
      productCopy[productIndex] = product;
      setProducts(productCopy);
      toast.success('Imagem atualizada com sucesso!');
    } catch (error) {
      console.error(`Error updating image ${imageId} for product ${productId}:`, error);
      toast.error('Erro ao atualizar imagem');
    }
  };
  
  const removeProductImage = async (productId: string, imageId: string) => {
    try {
      const productIndex = findProductIndex(productId);
      const productCopy = [...products];
      const product = { ...productCopy[productIndex] };
      
      const removedImage = product.images.find(img => img.id === imageId);
      product.images = product.images.filter(img => img.id !== imageId);
      
      // If removed image was main, set the first remaining image as main
      if (removedImage?.isMain && product.images.length > 0) {
        product.images[0].isMain = true;
      }
      
      // Update order of remaining images
      product.images = product.images.map((img, index) => ({
        ...img,
        order: index
      }));
      
      productCopy[productIndex] = product;
      setProducts(productCopy);
      toast.success('Imagem removida com sucesso!');
    } catch (error) {
      console.error(`Error removing image ${imageId} from product ${productId}:`, error);
      toast.error('Erro ao remover imagem');
    }
  };
  
  const reorderProductImages = async (productId: string, imageIds: string[]) => {
    try {
      const productIndex = findProductIndex(productId);
      const productCopy = [...products];
      const product = { ...productCopy[productIndex] };
      
      const imageMap = new Map(product.images.map(img => [img.id, img]));
      
      product.images = imageIds.map((id, index) => ({
        ...imageMap.get(id)!,
        order: index
      }));
      
      productCopy[productIndex] = product;
      setProducts(productCopy);
      toast.success('Ordem das imagens atualizada com sucesso!');
    } catch (error) {
      console.error(`Error reordering images for product ${productId}:`, error);
      toast.error('Erro ao reordenar imagens');
    }
  };
  
  const setMainProductImage = async (productId: string, imageId: string) => {
    try {
      const productIndex = findProductIndex(productId);
      const productCopy = [...products];
      const product = { ...productCopy[productIndex] };
      
      product.images = product.images.map(img => ({
        ...img,
        isMain: img.id === imageId
      }));
      
      productCopy[productIndex] = product;
      setProducts(productCopy);
      toast.success('Imagem principal definida com sucesso!');
    } catch (error) {
      console.error(`Error setting main image ${imageId} for product ${productId}:`, error);
      toast.error('Erro ao definir imagem principal');
    }
  };
  
  // Variation group operations
  const addVariationGroup = async (productId: string, group: Omit<ProductVariationGroup, 'id'>) => {
    try {
      const productIndex = findProductIndex(productId);
      const productCopy = [...products];
      const product = { ...productCopy[productIndex] };
      
      const newGroup: ProductVariationGroup = {
        ...group,
        id: crypto.randomUUID()
      };
      
      product.variationGroups = [...product.variationGroups, newGroup];
      productCopy[productIndex] = product;
      
      setProducts(productCopy);
      toast.success('Grupo de variação adicionado com sucesso!');
      return newGroup.id;
    } catch (error) {
      console.error(`Error adding variation group to product ${productId}:`, error);
      toast.error('Erro ao adicionar grupo de variação');
      return '';
    }
  };
  
  const updateVariationGroup = async (productId: string, groupId: string, updates: Partial<Omit<ProductVariationGroup, 'id'>>) => {
    try {
      const productIndex = findProductIndex(productId);
      const productCopy = [...products];
      const product = { ...productCopy[productIndex] };
      
      product.variationGroups = product.variationGroups.map(group => 
        group.id === groupId ? { ...group, ...updates } : group
      );
      
      productCopy[productIndex] = product;
      setProducts(productCopy);
      toast.success('Grupo de variação atualizado com sucesso!');
    } catch (error) {
      console.error(`Error updating variation group ${groupId} for product ${productId}:`, error);
      toast.error('Erro ao atualizar grupo de variação');
    }
  };
  
  const removeVariationGroup = async (productId: string, groupId: string) => {
    try {
      const productIndex = findProductIndex(productId);
      const productCopy = [...products];
      const product = { ...productCopy[productIndex] };
      
      product.variationGroups = product.variationGroups.filter(group => group.id !== groupId);
      productCopy[productIndex] = product;
      
      setProducts(productCopy);
      toast.success('Grupo de variação removido com sucesso!');
    } catch (error) {
      console.error(`Error removing variation group ${groupId} from product ${productId}:`, error);
      toast.error('Erro ao remover grupo de variação');
    }
  };
  
  // Variation option operations
  const addVariationOption = async (productId: string, groupId: string, option: Omit<ProductVariationOption, 'id'>) => {
    try {
      const productIndex = findProductIndex(productId);
      const productCopy = [...products];
      const product = { ...productCopy[productIndex] };
      
      const groupIndex = product.variationGroups.findIndex(g => g.id === groupId);
      if (groupIndex === -1) {
        throw new Error(`Variation group ${groupId} not found for product ${productId}`);
      }
      
      const newOption: ProductVariationOption = {
        ...option,
        id: crypto.randomUUID()
      };
      
      product.variationGroups[groupIndex].options = [...product.variationGroups[groupIndex].options, newOption];
      productCopy[productIndex] = product;
      
      setProducts(productCopy);
      toast.success('Op��ão de variação adicionada com sucesso!');
      return newOption.id;
    } catch (error) {
      console.error(`Error adding variation option to group ${groupId} for product ${productId}:`, error);
      toast.error('Erro ao adicionar opção de variação');
      return '';
    }
  };
  
  const updateVariationOption = async (productId: string, groupId: string, optionId: string, updates: Partial<Omit<ProductVariationOption, 'id'>>) => {
    try {
      const productIndex = findProductIndex(productId);
      const productCopy = [...products];
      const product = { ...productCopy[productIndex] };
      
      const groupIndex = product.variationGroups.findIndex(g => g.id === groupId);
      if (groupIndex === -1) {
        throw new Error(`Variation group ${groupId} not found for product ${productId}`);
      }
      
      product.variationGroups[groupIndex].options = product.variationGroups[groupIndex].options.map(option => 
        option.id === optionId ? { ...option, ...updates } : option
      );
      
      productCopy[productIndex] = product;
      setProducts(productCopy);
      toast.success('Opção de variação atualizada com sucesso!');
    } catch (error) {
      console.error(`Error updating variation option ${optionId} in group ${groupId} for product ${productId}:`, error);
      toast.error('Erro ao atualizar opção de variação');
    }
  };
  
  const removeVariationOption = async (productId: string, groupId: string, optionId: string) => {
    try {
      const productIndex = findProductIndex(productId);
      const productCopy = [...products];
      const product = { ...productCopy[productIndex] };
      
      const groupIndex = product.variationGroups.findIndex(g => g.id === groupId);
      if (groupIndex === -1) {
        throw new Error(`Variation group ${groupId} not found for product ${productId}`);
      }
      
      product.variationGroups[groupIndex].options = product.variationGroups[groupIndex].options.filter(option => option.id !== optionId);
      productCopy[productIndex] = product;
      
      setProducts(productCopy);
      toast.success('Opção de variação removida com sucesso!');
    } catch (error) {
      console.error(`Error removing variation option ${optionId} from group ${groupId} for product ${productId}:`, error);
      toast.error('Erro ao remover opção de variação');
    }
  };
  
  // Query operations
  const getProductById = (id: string) => {
    return products.find(product => product.id === id);
  };
  
  const getProductsByCategory = (categoryId: string) => {
    return products.filter(product => product.categoryId === categoryId);
  };
  
  const getActiveProducts = () => {
    return products.filter(product => product.active);
  };

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
