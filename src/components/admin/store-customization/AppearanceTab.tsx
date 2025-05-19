
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StoreSettings } from '@/types';

interface AppearanceTabProps {
  storeSettings: StoreSettings;
  onSave: (settings: Partial<StoreSettings>) => void;
}

export function AppearanceTab({ storeSettings, onSave }: AppearanceTabProps) {
  const [primaryColor, setPrimaryColor] = useState(storeSettings.primaryColor || '#9b87f5');
  const [secondaryColor, setSecondaryColor] = useState(storeSettings.secondaryColor || '#6E59A5');

  // Update local state when storeSettings change (e.g., after saving)
  useEffect(() => {
    setPrimaryColor(storeSettings.primaryColor || '#9b87f5');
    setSecondaryColor(storeSettings.secondaryColor || '#6E59A5');
  }, [storeSettings]);

  const handleSaveColors = () => {
    onSave({
      primaryColor,
      secondaryColor,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
        <CardDescription>
          Personalize as cores da sua loja
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="primaryColor">Cor Primária</label>
            <div className="flex gap-2">
              <input
                type="color"
                id="primaryColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 border rounded"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="secondaryColor">Cor Secundária</label>
            <div className="flex gap-2">
              <input
                type="color"
                id="secondaryColor"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-12 h-10 border rounded"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium mb-3">Prévia das cores:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className="flex items-center justify-center p-6 rounded-md text-white"
              style={{backgroundColor: primaryColor}}
            >
              Cor Primária
            </div>
            <div 
              className="flex items-center justify-center p-6 rounded-md text-white"
              style={{backgroundColor: secondaryColor}}
            >
              Cor Secundária
            </div>
            <div 
              className="flex items-center justify-center p-6 rounded-md text-black"
              style={{backgroundColor: '#ffffff', border: `2px solid ${primaryColor}`}}
            >
              Borda Primária
            </div>
            <div 
              className="flex items-center justify-center p-6 rounded-md text-black"
              style={{backgroundColor: '#ffffff', border: `2px solid ${secondaryColor}`}}
            >
              Borda Secundária
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveColors}>
          Salvar Cores
        </Button>
      </CardFooter>
    </Card>
  );
}
