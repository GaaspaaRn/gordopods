
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Loader2 } from 'lucide-react';

interface ImagePreviewProps {
  previewUrl: string | null;
  isUploading: boolean;
  onRemove: () => void;
  imageClassName?: string;
}

export function ImagePreview({
  previewUrl,
  isUploading,
  onRemove,
  imageClassName = 'max-h-40 object-contain'
}: ImagePreviewProps) {
  if (isUploading) {
    return (
      <div className="flex justify-center items-center h-40 border rounded bg-muted/20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Enviando imagem...</p>
        </div>
      </div>
    );
  }

  if (previewUrl) {
    return (
      <div className="relative border rounded overflow-hidden">
        <img
          src={previewUrl}
          alt="Preview"
          className={`w-full ${imageClassName}`}
          onError={(e) => {
            e.currentTarget.src = "https://via.placeholder.com/300x200?text=Erro+na+imagem";
          }}
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex justify-center items-center h-40 border rounded border-dashed bg-muted/20">
      <div className="text-center">
        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Selecione uma imagem para upload
        </p>
      </div>
    </div>
  );
}
