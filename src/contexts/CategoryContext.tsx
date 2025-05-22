import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Category } from '../types'; // Certifique-se que seu tipo Category reflita as colunas do DB
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface CategoryContextType {
  categories: Category[];
  isLoading: boolean;
  // Ajuste os parâmetros de createCategory se você não tiver imageUrl ou order
  createCategory: (name: string, description?: string, active?: boolean) => Promise<string | null>;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // reorderCategories pode não ser necessário se não houver coluna de ordem
  // Se você quiser ordenar por nome ou data no frontend, isso pode ser feito no momento da exibição.
  // Se precisar persistir uma ordem, você precisará de uma coluna 'order_position'
  // reorderCategories: (orderedCategories: Category[]) => Promise<void>; 
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

const initialCategories: Category[] = [];

export function CategoryProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(true);

  const loadCategories = async () => {
    console.log('[CategoryContext] (loadCategories) Tentando buscar categorias do Supabase...');
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        // Se não há 'order_position', ordene por 'name' ou 'created_at'
        .order('name', { ascending: true }); 

      console.log('[CategoryContext] (loadCategories) Resultado - Error:', error);

      if (error) {
        console.error('Erro ao carregar categorias (loadCategories):', error);
      }

      let currentCategories = initialCategories;
      if (data && data.length > 0) {
        const categoriesData = data.map((item) => ({ // Removido index se não usado para 'order'
          id: item.id,
          name: item.name,
          description: item.description || '',
          // imageUrl: item.image_url || '', // Removido se não existe
          active: item.active !== undefined ? item.active : true,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

        console.log('[CategoryContext] (loadCategories) Categorias carregadas/recarregadas do Supabase.');
        localStorage.setItem('gordopods-categories', JSON.stringify(currentCategories));
      } else if (!error) {
        console.log('[CategoryContext] (loadCategories) Nenhuma categoria no Supabase, tentando localStorage...');
        const storedCategories = localStorage.getItem('gordopods-categories');
        if (storedCategories) currentCategories = JSON.parse(storedCategories);
        else console.log('[CategoryContext] (loadCategories) Nenhuma categoria no localStorage.');
      } else {
          console.log('[CategoryContext] (loadCategories) Erro ao buscar do Supabase, tentando localStorage...');
          const storedCategories = localStorage.getItem('gordopods-categories');
          if (storedCategories) currentCategories = JSON.parse(storedCategories);
      }
      setCategories(currentCategories);
    } catch (error: any) {
      console.error('Erro crítico em loadCategories:', error);
      setCategories(initialCategories);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
        console.log('[CategoryContext] (useEffect) Iniciando fetch de categorias. Auth loading:', authIsLoading);
        setIsLoading(true);
        await loadCategories();
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
      if (categories.length > 0 || localStorage.getItem('gordopods-categories')) {
        localStorage.setItem('gordopods-categories', JSON.stringify(categories));
      }
    }
  }, [categories, isLoading, authIsLoading]);

  const createCategory = async (
    name: string,
    description: string = '',
    active: boolean = true
  ): Promise<string | null> => {
    if (!isAuthenticated) { toast.error("Login necessário para criar categoria."); return null; }
    setIsLoading(true);
    try {
      const newId = crypto.randomUUID();
      const categoryToInsert = {
        id: newId,
        name: name.trim(),
        description,
        active,
        // Removido image_url e order_position se não existem no DB
      };
      console.log('Dados enviados para criar categoria:', JSON.stringify(categoryToInsert, null, 2));
      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert(categoryToInsert)
        .select()
        .single();
      if (error || !newCategory) throw error || new Error("Falha ao criar categoria");
      await loadCategories();
      toast.success('Categoria criada com sucesso!');
      setIsLoading(false);
      return newCategory.id;
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      toast.error(`Erro ao criar categoria: ${error.message}`);
      setIsLoading(false);
      return null;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'imageUrl'>>) => {
    if (!isAuthenticated) { toast.error("Login necessário para atualizar categoria."); return; }
    setIsLoading(true);
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) dbUpdates.name = updates.name.trim();
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.active !== undefined) dbUpdates.active = updates.active;
      // Removido image_url e order_position
      console.log(`Dados enviados para atualizar categoria (ID: ${id}):`, JSON.stringify(dbUpdates, null, 2));
      const { error } = await supabase
        .from('categories')
        .update(dbUpdates)
        .eq('id', id);
      if (error) throw error;
      await loadCategories();
      toast.success('Categoria atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar categoria:', error);
      toast.error(`Erro ao atualizar categoria: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!isAuthenticated) { toast.error("Login necessário para excluir categoria."); return; }
    setIsLoading(true);
    try {
      const { count, error: checkError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);
      if (checkError) throw checkError;
      if (count !== null && count > 0) {
        toast.error(`Não é possível excluir: categoria possui ${count} produtos associados.`);
        setIsLoading(false);
        return;
      }
      console.log(`Tentando deletar categoria com ID: ${id}`);
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      await loadCategories();
      toast.success('Categoria excluída com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      toast.error(`Erro ao excluir categoria: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Se você não tem uma coluna 'order_position' no DB, a função reorderCategories
  // não tem como persistir a ordem no backend. Você pode removê-la do contexto
  // ou implementá-la apenas para reordenar no frontend se for necessário para a UI,
  // mas a ordem não será salva. Vou comentá-la por enquanto.
  /*
  const reorderCategories = async (orderedCategories: Category[]) => {
    if (!isAuthenticated) { toast.error("Login necessário para reordenar categorias."); return; }
    // Se não houver coluna de ordem no DB, esta função não pode persistir a ordem.
    // Você pode atualizar o estado local para refletir a nova ordem na UI,
    // mas ela será perdida no próximo carregamento.
    setCategories(orderedCategories.map((cat, index) => ({ ...cat, order: index })));
    toast.info('Ordem das categorias atualizada localmente (sem persistência no DB).');
  };
  */

  return (
    <CategoryContext.Provider
      value={{
        categories,
        isLoading,
        createCategory,
        updateCategory,
        deleteCategory,
        // reorderCategories, // Removido se não houver persistência de ordem
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
