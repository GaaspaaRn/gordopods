
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Category } from '../types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CategoryContextType {
  categories: Category[];
  isLoading: boolean;
  createCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (newOrder: Category[]) => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

// Initial mock categories with propriedades obrigatórias completas
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
  { 
    id: '2', 
    name: 'Pods de Sobremesa', 
    description: '',
    imageUrl: '',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: 1 
  },
  { 
    id: '3', 
    name: 'Pods Especiais',
    description: '',
    imageUrl: '',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(), 
    order: 2 
  },
];

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar categorias do Supabase
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        
        // Tentar carregar do Supabase
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (error) {
          console.error('Erro ao carregar categorias do Supabase:', error);
          
          // Carregar do localStorage como fallback
          const storedCategories = localStorage.getItem('categories');
          if (storedCategories) {
            setCategories(JSON.parse(storedCategories));
          } else {
            setCategories(initialCategories);
            
            // Tentar salvar as categorias iniciais no Supabase
            initialCategories.forEach(async (category) => {
              await supabase
                .from('categories')
                .insert({
                  id: category.id,
                  name: category.name,
                  description: category.description,
                  active: category.active,
                  created_at: category.createdAt,
                  updated_at: category.updatedAt
                })
                .then(({ error }) => {
                  if (error) console.error('Erro ao inserir categoria inicial:', error);
                });
            });
          }
        } else {
          // Mapear os dados do Supabase para o formato Category
          const categoriesData = data.map((item, index) => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            imageUrl: '',
            active: item.active || true,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            order: index // Definir a ordem baseado na posição no array
          })) as Category[];
          
          setCategories(categoriesData);
          
          // Salvar no localStorage como backup
          localStorage.setItem('categories', JSON.stringify(categoriesData));
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        
        // Tentar carregar do localStorage como último recurso
        const storedCategories = localStorage.getItem('categories');
        if (storedCategories) {
          setCategories(JSON.parse(storedCategories));
        } else {
          setCategories(initialCategories);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCategories();
  }, []);

  // Save categories to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('categories', JSON.stringify(categories));
    }
  }, [categories, isLoading]);

  const createCategory = async (name: string) => {
    try {
      setIsLoading(true);
      
      if (!name.trim()) {
        toast.error('O nome da categoria é obrigatório');
        return;
      }
      
      const now = new Date().toISOString();
      const newId = crypto.randomUUID();
      const newOrder = categories.length;
      
      const newCategory: Category = {
        id: newId,
        name: name.trim(),
        description: '',
        imageUrl: '',
        active: true,
        createdAt: now,
        updatedAt: now,
        order: newOrder,
      };
      
      // Inserir no Supabase
      const { error } = await supabase
        .from('categories')
        .insert({
          id: newId,
          name: name.trim(),
          description: '',
          active: true,
          created_at: now,
          updated_at: now
        });
      
      if (error) {
        console.error('Erro ao criar categoria no Supabase:', error);
        toast.error('Erro ao salvar categoria no banco de dados');
        return;
      }
      
      // Atualizar estado local após sucesso no Supabase
      setCategories(prev => [...prev, newCategory]);
      toast.success('Categoria criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast.error('Ocorreu um erro ao criar a categoria');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategory = async (id: string, name: string) => {
    try {
      setIsLoading(true);
      
      if (!name.trim()) {
        toast.error('O nome da categoria é obrigatório');
        return;
      }
      
      const now = new Date().toISOString();
      
      // Atualizar no Supabase
      const { error } = await supabase
        .from('categories')
        .update({
          name: name.trim(),
          updated_at: now
        })
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao atualizar categoria no Supabase:', error);
        toast.error('Erro ao salvar alterações no banco de dados');
        return;
      }
      
      // Atualizar estado local após sucesso no Supabase
      setCategories(
        categories.map(category => 
          category.id === id ? { 
            ...category, 
            name: name.trim(),
            updatedAt: now
          } : category
        )
      );
      
      toast.success('Categoria atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      toast.error('Ocorreu um erro ao atualizar a categoria');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Verificar se existem produtos usando esta categoria
      const { data: productsWithCategory, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', id);
        
      if (checkError) {
        console.error('Erro ao verificar produtos da categoria:', checkError);
        toast.error('Erro ao verificar produtos associados à categoria');
        return;
      }
      
      if (productsWithCategory && productsWithCategory.length > 0) {
        toast.error(`Não é possível excluir: categoria possui ${productsWithCategory.length} produtos associados.`);
        return;
      }
      
      // Excluir a categoria do Supabase
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir categoria do Supabase:', error);
        toast.error('Erro ao excluir categoria do banco de dados');
        return;
      }
      
      // Remove the category and reorder remaining categories
      const updatedCategories = categories
        .filter(category => category.id !== id)
        .map((category, index) => ({
          ...category,
          order: index,
          updatedAt: new Date().toISOString()
        }));
      
      // Atualizar a ordem das categorias restantes no Supabase
      for (const category of updatedCategories) {
        await supabase
          .from('categories')
          .update({ updated_at: category.updatedAt })
          .eq('id', category.id);
      }
      
      setCategories(updatedCategories);
      toast.success('Categoria excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Ocorreu um erro ao excluir a categoria');
    } finally {
      setIsLoading(false);
    }
  };

  const reorderCategories = async (newOrder: Category[]) => {
    try {
      setIsLoading(true);
      
      // Update the order property based on the new array order
      const updatedCategories = newOrder.map((category, index) => ({
        ...category,
        order: index,
        updatedAt: new Date().toISOString()
      }));
      
      // Atualizar a ordem no Supabase
      for (const category of updatedCategories) {
        await supabase
          .from('categories')
          .update({ 
            updated_at: category.updatedAt 
          })
          .eq('id', category.id);
      }
      
      setCategories(updatedCategories);
      toast.success('Ordem das categorias atualizada!');
    } catch (error) {
      console.error('Erro ao reordenar categorias:', error);
      toast.error('Ocorreu um erro ao reordenar as categorias');
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
