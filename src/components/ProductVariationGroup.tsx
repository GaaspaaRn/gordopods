// src/components/ProductVariationGroup.tsx
import React from 'react';
import { ProductVariationGroup as VariationGroupType, ProductVariationOption } from '../types';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { formatCurrency } from '../utils/format';

interface ProductVariationGroupProps {
  group: VariationGroupType;
  selectedOptions: string | string[];
  onChange: (groupId: string, optionId: string | string[]) => void;
}

export function ProductVariationGroup({ 
  group, 
  selectedOptions, 
  onChange 
}: ProductVariationGroupProps) {
  // Manipular seleção de variação única
  const handleSingleSelection = (value: string) => {
    onChange(group.id, value);
  };

  // Manipular seleção de variação múltipla
  const handleMultipleSelection = (optionId: string, checked: boolean) => {
    const currentSelections = Array.isArray(selectedOptions) ? selectedOptions : [];
    
    if (checked) {
      onChange(group.id, [...currentSelections, optionId]);
    } else {
      onChange(group.id, currentSelections.filter(id => id !== optionId));
    }
  };

  return (
    <div className="variation-group">
      <h3 className="text-lg font-medium mb-2">
        {group.name}
        {group.required && <span className="text-red-500 ml-1">*</span>}
      </h3>
      
      {group.multipleSelection ? (
        // Checkbox para seleção múltipla
        <div className="space-y-2">
          {group.options.map(option => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={`option-${option.id}`}
                checked={
                  Array.isArray(selectedOptions) && 
                  selectedOptions.includes(option.id)
                }
                onCheckedChange={(checked) => 
                  handleMultipleSelection(option.id, checked as boolean)
                }
              />
              <Label htmlFor={`option-${option.id}`} className="flex-1">
                {option.name}
                {option.priceModifier > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (+{formatCurrency(option.priceModifier)})
                  </span>
                )}
              </Label>
            </div>
          ))}
        </div>
      ) : (
        // Radio para seleção única
        <RadioGroup
          value={selectedOptions as string}
          onValueChange={handleSingleSelection}
          className="space-y-2"
        >
          {group.options.map(option => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.id} id={`option-${option.id}`} />
              <Label htmlFor={`option-${option.id}`} className="flex-1">
                {option.name}
                {option.priceModifier > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (+{formatCurrency(option.priceModifier)})
                  </span>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </div>
  );
}
