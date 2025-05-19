
import React from 'react';
import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CategoryNavigationProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  className?: string;
}

const CategoryNavigation = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  className
}: CategoryNavigationProps) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        variant={selectedCategoryId === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectCategory(null)}
        className="whitespace-nowrap"
      >
        Todas as Categorias
      </Button>
      
      {categories.map(category => (
        <Button
          key={category.id}
          variant={selectedCategoryId === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectCategory(category.id)}
          className="whitespace-nowrap"
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};

export default CategoryNavigation;
