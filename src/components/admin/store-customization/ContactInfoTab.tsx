
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StoreSettings } from '@/types';

interface ContactInfoTabProps {
  storeSettings: StoreSettings;
  onSave: (settings: Partial<StoreSettings>) => void;
}

export function ContactInfoTab({ storeSettings, onSave }: ContactInfoTabProps) {
  const [contactPhone, setContactPhone] = useState(storeSettings.contactInfo.phone || '');
  const [contactEmail, setContactEmail] = useState(storeSettings.contactInfo.email || '');
  const [whatsappNumber, setWhatsappNumber] = useState(storeSettings.whatsappNumber || '');
  
  // Update local state when storeSettings change (e.g., after saving)
  useEffect(() => {
    setContactPhone(storeSettings.contactInfo.phone || '');
    setContactEmail(storeSettings.contactInfo.email || '');
    setWhatsappNumber(storeSettings.whatsappNumber || '');
  }, [storeSettings]);

  const handleSaveContact = () => {
    onSave({
      contactInfo: {
        phone: contactPhone,
        email: contactEmail,
      },
      whatsappNumber: whatsappNumber,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações de Contato</CardTitle>
        <CardDescription>
          Adicione métodos de contato adicionais para exibir na loja
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Telefone para Exibição</Label>
            <Input
              id="contactPhone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="(47) 99999-9999"
            />
            <p className="text-xs text-muted-foreground">
              Este número será exibido para contato, diferente do WhatsApp para pedidos.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email para Contato</Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contato@gordopods.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp para Pedidos</Label>
            <Input
              id="whatsappNumber"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="5547999999999"
            />
            <p className="text-xs text-muted-foreground">
              Número internacional (com código do país) para receber pedidos no WhatsApp. Ex: 5547999999999
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveContact}>
          Salvar Informações de Contato
        </Button>
      </CardFooter>
    </Card>
  );
}
