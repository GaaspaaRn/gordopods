
import React, { useState } from 'react';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';

export function Settings() {
  const { storeSettings, deliverySettings, updateStoreSettings, updateDeliverySettings } = useStoreSettings();
  
  // Estado local para as configurações
  const [whatsappNumber, setWhatsappNumber] = useState(storeSettings.whatsappNumber || '');
  
  // Configurações de entrega
  const [pickup, setPickup] = useState({
    enabled: deliverySettings?.pickup?.enabled || false,
    instructions: deliverySettings?.pickup?.instructions || '',
  });
  
  const [fixedRate, setFixedRate] = useState({
    enabled: deliverySettings?.fixedRate?.enabled || false,
    fee: deliverySettings?.fixedRate?.fee || 0,
    description: deliverySettings?.fixedRate?.description || 'Taxa de entrega fixa',
  });
  
  const [neighborhood, setNeighborhood] = useState({
    enabled: deliverySettings?.neighborhoodRates?.enabled || false,
    neighborhoods: deliverySettings?.neighborhoodRates?.neighborhoods || [],
  });
  
  // Estado para o novo bairro
  const [newNeighborhood, setNewNeighborhood] = useState({
    name: '',
    fee: 0,
  });
  
  // Formatação de valores monetários
  const formatMoney = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  // Conversão de string para número (para campos de valor)
  const parseMoney = (value: string) => {
    // Remover caracteres não numéricos, exceto ponto decimal
    const numericValue = value.replace(/[^\d.]/g, '');
    return parseFloat(numericValue) || 0;
  };
  
  const handleSaveWhatsapp = () => {
    updateStoreSettings({ whatsappNumber });
    toast.success('Número de WhatsApp salvo com sucesso!');
  };
  
  const handleSavePickup = () => {
    const newDeliverySettings = {
      ...deliverySettings,
      pickup: {
        ...pickup
      }
    };
    updateDeliverySettings(newDeliverySettings);
    toast.success('Configurações de retirada salvas com sucesso!');
  };
  
  const handleSaveFixedRate = () => {
    const newDeliverySettings = {
      ...deliverySettings,
      fixedRate: {
        ...fixedRate
      }
    };
    updateDeliverySettings(newDeliverySettings);
    toast.success('Configurações de taxa fixa salvas com sucesso!');
  };
  
  const handleAddNeighborhood = () => {
    if (!newNeighborhood.name) {
      toast.error('Digite o nome do bairro');
      return;
    }
    
    const newNeighborhoods = [
      ...neighborhood.neighborhoods,
      {
        id: crypto.randomUUID(),
        name: newNeighborhood.name,
        fee: newNeighborhood.fee
      }
    ];
    
    setNeighborhood({
      ...neighborhood,
      neighborhoods: newNeighborhoods
    });
    
    setNewNeighborhood({
      name: '',
      fee: 0
    });
    
    // Salvar imediatamente
    const newDeliverySettings = {
      ...deliverySettings,
      neighborhoodRates: {
        ...neighborhood,
        neighborhoods: newNeighborhoods
      }
    };
    updateDeliverySettings(newDeliverySettings);
    toast.success('Bairro adicionado com sucesso!');
  };
  
  const handleRemoveNeighborhood = (id: string) => {
    const newNeighborhoods = neighborhood.neighborhoods.filter(n => n.id !== id);
    
    const newNeighborhoodState = {
      ...neighborhood,
      neighborhoods: newNeighborhoods
    };
    
    setNeighborhood(newNeighborhoodState);
    
    // Salvar imediatamente
    const newDeliverySettings = {
      ...deliverySettings,
      neighborhoodRates: newNeighborhoodState
    };
    updateDeliverySettings(newDeliverySettings);
    toast.success('Bairro removido com sucesso!');
  };
  
  const handleSaveNeighborhoods = () => {
    const newDeliverySettings = {
      ...deliverySettings,
      neighborhoodRates: neighborhood
    };
    updateDeliverySettings(newDeliverySettings);
    toast.success('Configurações de bairros salvas com sucesso!');
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      
      <Tabs defaultValue="whatsapp">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="delivery">Entrega</TabsTrigger>
          <TabsTrigger value="others">Outras Configurações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp da Loja</CardTitle>
              <CardDescription>
                Configure o número de WhatsApp que receberá os pedidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">Número do WhatsApp (com código do país)</Label>
                <Input 
                  id="whatsappNumber" 
                  placeholder="Ex: 5547999999999" 
                  value={whatsappNumber} 
                  onChange={(e) => setWhatsappNumber(e.target.value)} 
                />
                <p className="text-sm text-muted-foreground">
                  Digite o número com código do país (Ex: 5547999999999, sem espaços ou caracteres especiais)
                </p>
              </div>
              <Button onClick={handleSaveWhatsapp}>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="delivery">
          <div className="space-y-6">
            {/* Retirada no Local */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>Retirada no Local</CardTitle>
                  <Switch 
                    checked={pickup.enabled} 
                    onCheckedChange={(checked) => {
                      setPickup({ ...pickup, enabled: checked });
                    }} 
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pickupInstructions">Instruções para Retirada</Label>
                  <Input 
                    id="pickupInstructions" 
                    placeholder="Ex: Retirar na loja das 9h às 18h" 
                    value={pickup.instructions} 
                    onChange={(e) => setPickup({ ...pickup, instructions: e.target.value })} 
                    disabled={!pickup.enabled}
                  />
                </div>
                <Button onClick={handleSavePickup} disabled={!pickup.enabled}>Salvar</Button>
              </CardContent>
            </Card>
            
            {/* Taxa Fixa */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>Entrega com Taxa Fixa</CardTitle>
                  <Switch 
                    checked={fixedRate.enabled} 
                    onCheckedChange={(checked) => {
                      setFixedRate({ ...fixedRate, enabled: checked });
                    }} 
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fixedRateDescription">Descrição</Label>
                  <Input 
                    id="fixedRateDescription" 
                    placeholder="Ex: Taxa de entrega padrão" 
                    value={fixedRate.description} 
                    onChange={(e) => setFixedRate({ ...fixedRate, description: e.target.value })} 
                    disabled={!fixedRate.enabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fixedRateValue">Valor da Taxa (R$)</Label>
                  <Input 
                    id="fixedRateValue" 
                    placeholder="Ex: 5.00" 
                    value={formatMoney(fixedRate.fee)} 
                    onChange={(e) => setFixedRate({ 
                      ...fixedRate, 
                      fee: parseMoney(e.target.value)
                    })} 
                    disabled={!fixedRate.enabled}
                  />
                </div>
                <Button onClick={handleSaveFixedRate} disabled={!fixedRate.enabled}>Salvar</Button>
              </CardContent>
            </Card>
            
            {/* Entrega por Bairros */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>Entrega por Bairros</CardTitle>
                  <Switch 
                    checked={neighborhood.enabled} 
                    onCheckedChange={(checked) => {
                      setNeighborhood({ ...neighborhood, enabled: checked });
                      handleSaveNeighborhoods();
                    }} 
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-4">
                  <div className="border p-4 rounded-md space-y-4">
                    <h3 className="font-medium">Adicionar Novo Bairro</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="neighborhoodName">Nome do Bairro</Label>
                        <Input 
                          id="neighborhoodName" 
                          placeholder="Ex: Centro" 
                          value={newNeighborhood.name} 
                          onChange={(e) => setNewNeighborhood({ 
                            ...newNeighborhood, 
                            name: e.target.value 
                          })} 
                          disabled={!neighborhood.enabled}
                        />
                      </div>
                      <div>
                        <Label htmlFor="neighborhoodFee">Taxa (R$)</Label>
                        <Input 
                          id="neighborhoodFee" 
                          placeholder="Ex: 7.50" 
                          value={formatMoney(newNeighborhood.fee)} 
                          onChange={(e) => setNewNeighborhood({ 
                            ...newNeighborhood, 
                            fee: parseMoney(e.target.value) 
                          })} 
                          disabled={!neighborhood.enabled}
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleAddNeighborhood} 
                      disabled={!neighborhood.enabled || !newNeighborhood.name}
                    >
                      Adicionar Bairro
                    </Button>
                  </div>
                  
                  {/* Lista de Bairros */}
                  <div className="border rounded-md">
                    <h3 className="font-medium p-4 border-b">Bairros Cadastrados</h3>
                    <div className="divide-y">
                      {neighborhood.neighborhoods.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          Nenhum bairro cadastrado
                        </div>
                      ) : (
                        neighborhood.neighborhoods.map(item => (
                          <div key={item.id} className="p-4 flex justify-between items-center">
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="ml-2 text-muted-foreground">
                                (R$ {formatMoney(item.fee)})
                              </span>
                            </div>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleRemoveNeighborhood(item.id)}
                              disabled={!neighborhood.enabled}
                            >
                              Remover
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="others">
          <Card>
            <CardHeader>
              <CardTitle>Outras Configurações</CardTitle>
              <CardDescription>
                Configurações adicionais da loja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configurações adicionais serão implementadas em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Settings;
