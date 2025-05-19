
import React, { useState } from 'react';
import { ProductVariationGroup, SelectedVariation } from '@/types';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface ProductVariationsProps {
  variationGroups: ProductVariationGroup[];
  onVariationsChange: (selectedVariations: SelectedVariation[]) => void;
  className?: string;
}

const ProductVariations = ({
  variationGroups,
  onVariationsChange,
  className
}: ProductVariationsProps) => {
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string[]>>({});
  
  const handleSingleSelection = (groupId: string, optionId: string) => {
    const updatedSelections = {
      ...selectedVariations,
      [groupId]: [optionId]
    };
    setSelectedVariations(updatedSelections);
    updateSelectedVariations(updatedSelections);
  };
  
  const handleMultipleSelection = (
    groupId: string, 
    optionId: string, 
    isChecked: boolean
  ) => {
    const currentSelections = selectedVariations[groupId] || [];
    
    let updatedOptions: string[];
    if (isChecked) {
      updatedOptions = [...currentSelections, optionId];
    } else {
      updatedOptions = currentSelections.filter(id => id !== optionId);
    }
    
    const updatedSelections = {
      ...selectedVariations,
      [groupId]: updatedOptions
    };
    
    setSelectedVariations(updatedSelections);
    updateSelectedVariations(updatedSelections);
  };
  
  const updateSelectedVariations = (selections: Record<string, string[]>) => {
    const formattedVariations: SelectedVariation[] = [];
    
    Object.entries(selections).forEach(([groupId, optionIds]) => {
      const group = variationGroups.find(g => g.id === groupId);
      if (!group) return;
      
      optionIds.forEach(optionId => {
        const option = group.options.find(o => o.id === optionId);
        if (!option) return;
        
        formattedVariations.push({
          groupId,
          groupName: group.name,
          optionId,
          optionName: option.name,
          priceModifier: option.priceModifier
        });
      });
    });
    
    onVariationsChange(formattedVariations);
  };
  
  const getIsOptionSelected = (groupId: string, optionId: string): boolean => {
    const groupSelections = selectedVariations[groupId] || [];
    return groupSelections.includes(optionId);
  };
  
  const formatPriceModifier = (modifier: number): string => {
    if (modifier === 0) return '';
    return modifier > 0 
      ? `+${modifier.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      : modifier.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (variationGroups.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {variationGroups.map(group => (
        <div key={group.id} className="space-y-2">
          <Label className="font-medium">
            {group.name} 
            {group.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          
          {group.multipleSelection ? (
            // Checkboxes for multiple selection
            <div className="grid grid-cols-2 gap-2">
              {group.options.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`${group.id}-${option.id}`}
                    checked={getIsOptionSelected(group.id, option.id)}
                    onCheckedChange={(checked) => 
                      handleMultipleSelection(group.id, option.id, Boolean(checked))
                    }
                  />
                  <Label 
                    htmlFor={`${group.id}-${option.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {option.name} 
                    {option.priceModifier !== 0 && (
                      <span className="text-xs ml-1 font-normal text-muted-foreground">
                        ({formatPriceModifier(option.priceModifier)})
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            // Radio buttons for single selection
            <RadioGroup 
              onValueChange={(value) => handleSingleSelection(group.id, value)}
              value={selectedVariations[group.id]?.[0] || ''}
            >
              <div className="grid grid-cols-2 gap-2">
                {group.options.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option.id} 
                      id={`${group.id}-${option.id}`} 
                    />
                    <Label 
                      htmlFor={`${group.id}-${option.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {option.name}
                      {option.priceModifier !== 0 && (
                        <span className="text-xs ml-1 font-normal text-muted-foreground">
                          ({formatPriceModifier(option.priceModifier)})
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProductVariations;
