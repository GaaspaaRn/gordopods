import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Category } from '../types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext'; // 1. Importe useAuth

interface CategoryContextType {
  categories: Category[];
  isLoading: boolean;
  createCategory: (name: string) => Promise<void>; // Funções CRUD agora são async
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (newOrder: Category[]) => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

// Mock inicial (mantenha sua lógica de fallback se desejar)
const initialCategories: Category[] = [
  { 
    id: '1', 
    name: 'Pods de Fruta', 
    description: '',
    imageUrl: '',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: 0 
  },
  // ... seus outros mocks ...
];

export function CategoryProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth(); // 2. Use o estado de autenticação
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Loading do próprio CategoryContext

  useEffect(() => {
    const loadCategories = async () => {
      // 3. Adicione a condição para buscar dados
      if (isAuthenticated && !authIsLoading) {
        setIsLoading(true);
        try {
          console.log('[CategoryContext] Usuário autenticado, buscando categorias do Supabase...');
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('updated_at', { ascending: false }); // Considere order 'order' ou 'name' se relevante
          
          if (error) {
            console.error('Erro ao carregar categorias do Supabase:', error);
            toast.error(`Erro Supabase: ${error.message}`);
            const storedCategories = localStorage.getItem('gordopods-categories');
            setCategories(storedCategories ? JSON.parse(storedCategories) : initialCategories);
          } else {
            const categoriesData = data.map((item, index) => ({
              id: item.id,
              name: item.name,
              description: item.description || '',
              imageUrl: item.image_url || '', // Ajuste se o nome da coluna for diferente
              active: item.active === undefined ? true : item.active,
              createdAt: item.created_at,
              updatedAt: item.updated_at,
              order: item.order_position === undefined ? index : item.order_position, // Ajuste se o nome da coluna for diferente
            })) as Category[];
            
            setCategories(categoriesData);
            localStorage.setItem('gordopods-categories', JSON.stringify(categoriesData));
            console.log('[CategoryContext] Categorias carregadas do Supabase:', categoriesData);
          }
        } catch (error: any) {
          console.error('Erro ao carregar categorias (bloco catch):', error);
          toast.error(`Erro inesperado: ${error.message}`);
          const storedCategories = localStorage.getItem('gordopods-categories');
          setCategories(storedCategories ? JSON.parse(storedCategories) : initialCategories);
        } finally {
          setIsLoading(false);
        }
      } else if (!authIsLoading && !isAuthenticated) {
        // Usuário não está autenticado e o auth já carregou.
        console.log('[CategoryContext] Usuário não autenticado. Carregando do localStorage ou iniciais.');
        const storedCategories = localStorage.getItem('gordopods-categories');
        setCategories(storedCategories ? JSON.parse(storedCategories) : initialCategories);
        setIsLoading(false);
      } else if (authIsLoading) {
        console.log('[CategoryContext] Aguardando status de autenticação...');
        // Mantém isLoading como true ou o estado atual, dependendo da sua preferência
        // Pode ser útil setar setIsLoading(true) aqui se quiser um feedback de loading mais explícito
      }
    };
    
    loadCategories();
  }, [isAuthenticated, authIsLoading]); // 4. Adicione isAuthenticated e authIsLoading como dependências

  // Save categories to localStorage whenever they change (esta parte parece OK)
  useEffect(() => {
    if (!isLoading && categories.length > 0) { // Só salva se não estiver carregando e tiver categorias
      localStorage.setItem('gordopods-categories', JSON.stringify(categories));
    }
  }, [categories, isLoading]);

  // Funções CRUD (create, update, delete, reorder) - já parecem OK em termos de Supabase
  // Apenas certifique-se que as chamadas ao Supabase estão corretas e
  // que as RLS no Supabase permitem essas operações para usuários autenticados.
  // Adicionei async/await e retornos de Promise para consistência.

  const createCategory = async (name: string) => {
    try {
      setIsLoading(true);
      // ... (sua lógica de validação e criação) ...
       const now = new Date().toISOString();
       const newId = crypto.randomUUID();
       // Use a ordem atual + 1 ou busque a maior ordem do banco
       const newOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 1 : 0;
      
      const newCategoryData = { // Dados para o Supabase
        id: newId,
        name: name.trim(),
        description: '',
        active: true,
        created_at: now,
        updated_at: now,
        // order_position: newOrder, // Se você tiver essa coluna no Supabase
      };

      const { error } = await supabase
        .from('categories')
        .insert(newCategoryData);
      
      if (error) {
        console.error('Erro ao criar categoria no Supabase:', error);
        toast.error(`Erro Supabase: ${error.message}`);
        return;
      }
      
      const appCategory: Category = { // Dados para o estado local
        ...newCategoryData,
        imageUrl: '', // Adicione campos que faltam para o tipo Category local
        order: newOrder,
        createdAt: newCategoryData.created_at, // Garanta consistência
        updatedAt: newCategoryData.updated_at,
      };

      setCategories(prev => [...prev, appCategory].sort((a,b) => a.order - b.order));
      toast.success('Categoria criada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      toast.error(`Erro inesperado: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategory = async (id: string, name: string) => {
    try {
      setIsLoading(true);
      // ... (sua lógica de validação e atualização) ...
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('categories')
        .update({ name: name.trim(), updated_at: now })
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao atualizar categoria no Supabase:', error);
        toast.error(`Erro Supabase: ${error.message}`);
        return;
      }
      
      setCategories(
        categories.map(category => 
          category.id === id ? { ...category, name: name.trim(), updatedAt: now } : category
        )
      );
      toast.success('Categoria atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar categoria:', error);
      toast.error(`Erro inesperado: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      setIsLoading(true);
      // ... (sua lógica de verificação e exclusão) ...
      const { data: productsWithCategory, error: checkError } = await supabase
        .from('products')
        .select('id', { count: 'exact' }) // Usar count para eficiência
        .eq('category_id', id);
        
      if (checkError) {
        console.error('Erro ao verificar produtos da categoria:', checkError);
        toast.error(`Erro Supabase: ${checkError.message}`);
        return;
      }
      
      if (productsWithCategory && productsWithCategory.length > 0) {
        toast.error(`Não é possível excluir: categoria possui ${productsWithCategory.length} produtos associados.`);
        return;
      }
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir categoria do Supabase:', error);
        toast.error(`Erro Supabase: ${error.message}`);
        return;
      }
      
      const updatedCategories = categories.filter(category => category.id !== id);
      // Reordenar não é estritamente necessário no cliente após deleção,
      // a menos que sua UI dependa de uma sequência 'order' contínua.
      // A ordem ao buscar do Supabase (ex: por nome ou created_at) pode ser mais confiável.
      setCategories(updatedCategories);
      toast.success('Categoria excluída com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      toast.error(`Erro inesperado: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const reorderCategories = async (newOrder: Category[]) => {
    try {
      setIsLoading(true);
      const updatedCategories = newOrder.map((category, index) => ({
        ...category,
        order: index, // Atualiza a ordem local
        updatedAt: new Date().toISOString()
      }));
      
      // Atualizar a ordem (order_position) e updated_at no Supabase
      // Idealmente, fazer isso em uma transação ou batch se o Supabase JS suportar facilmente
      for (const category of updatedCategories) {
        const { error } = await supabase
          .from('categories')
          .update({ 
            // order_position: category.order, // Se você tem esta coluna no Supabase
            updated_at: category.updatedAt 
          })
          .eq('id', category.id);
        if (error) throw error; // Lança o erro para ser pego pelo catch
      }
      
      setCategories(updatedCategories);
      toast.success('Ordem das categorias atualizada!');
    } catch (error: any) {
      console.error('Erro ao reordenar categorias:', error);
      toast.error(error.message || 'Ocorreu um erro ao reordenar as categorias');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        isLoading,
        createCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}
