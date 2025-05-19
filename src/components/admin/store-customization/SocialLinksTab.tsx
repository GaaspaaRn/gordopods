
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { StoreSettings, SocialLink } from '@/types';

interface SocialLinksTabProps {
  storeSettings: StoreSettings;
  onAdd: (name: string, url: string) => void;
  onUpdate: (id: string, name: string, url: string) => void;
  onRemove: (id: string) => void;
}

export function SocialLinksTab({ 
  storeSettings, 
  onAdd, 
  onUpdate, 
  onRemove 
}: SocialLinksTabProps) {
  const [newSocialName, setNewSocialName] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editSocialName, setEditSocialName] = useState('');
  const [editSocialUrl, setEditSocialUrl] = useState('');

  const handleAddSocialLink = () => {
    if (newSocialName && newSocialUrl) {
      onAdd(newSocialName, newSocialUrl);
      setNewSocialName('');
      setNewSocialUrl('');
    }
  };

  const handleEditLink = (link: SocialLink) => {
    setEditingLinkId(link.id);
    setEditSocialName(link.name);
    setEditSocialUrl(link.url);
  };

  const handleSaveEditLink = () => {
    if (editingLinkId && editSocialName && editSocialUrl) {
      onUpdate(editingLinkId, editSocialName, editSocialUrl);
      setEditingLinkId(null);
    }
  };

  const handleCancelEditLink = () => {
    setEditingLinkId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redes Sociais</CardTitle>
        <CardDescription>
          Adicione links para suas redes sociais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="socialName">Nome da Rede Social</Label>
            <Input
              id="socialName"
              value={newSocialName}
              onChange={(e) => setNewSocialName(e.target.value)}
              placeholder="Instagram, Facebook, etc."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="socialUrl">URL</Label>
            <div className="flex gap-2">
              <Input
                id="socialUrl"
                value={newSocialUrl}
                onChange={(e) => setNewSocialUrl(e.target.value)}
                placeholder="https://instagram.com/suaconta"
                className="flex-1"
              />
              <Button 
                onClick={handleAddSocialLink}
                disabled={!newSocialName || !newSocialUrl}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="font-medium mb-4">Links adicionados:</h3>
          
          {storeSettings.socialLinks.length === 0 ? (
            <div className="text-center py-6 border rounded-md border-dashed">
              <p className="text-muted-foreground">
                Nenhuma rede social adicionada
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {storeSettings.socialLinks.map((link) => (
                <div 
                  key={link.id}
                  className="flex items-center justify-between border rounded-md p-3"
                >
                  {editingLinkId === link.id ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        value={editSocialName}
                        onChange={(e) => setEditSocialName(e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        value={editSocialUrl}
                        onChange={(e) => setEditSocialUrl(e.target.value)}
                        className="flex-1"
                      />
                      <div className="flex gap-2 md:col-span-2">
                        <Button 
                          size="sm"
                          onClick={handleSaveEditLink}
                          className="flex-1"
                        >
                          Salvar
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEditLink}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="font-medium">{link.name}</div>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 flex items-center gap-1 hover:underline"
                        >
                          {link.url} <ExternalLink size={12} />
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditLink(link)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onRemove(link.id)}
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
