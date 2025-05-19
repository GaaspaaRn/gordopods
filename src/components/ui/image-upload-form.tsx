
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';

interface ImageUploadFormProps {
  isUploading: boolean;
  uploadMode: 'file' | 'url';
  recommendedSize?: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlSubmit: () => void;
  urlInput: string;
  onUrlChange: (value: string) => void;
}

export function ImageUploadForm({
  isUploading,
  uploadMode,
  recommendedSize,
  onFileChange,
  onUrlSubmit,
  urlInput,
  onUrlChange
}: ImageUploadFormProps) {
  if (uploadMode === 'file') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input 
            type="file"
            accept="image/*"
            onChange={onFileChange}
            disabled={isUploading}
            className="flex-1"
          />
        </div>
        {recommendedSize && (
          <p className="text-xs text-muted-foreground">{recommendedSize}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="url"
        placeholder="https://exemplo.com/imagem.png"
        value={urlInput}
        onChange={(e) => onUrlChange(e.target.value)}
        className="flex-1"
      />
      <Button
        type="button"
        size="sm"
        onClick={onUrlSubmit}
      >
        <Upload className="h-4 w-4 mr-2" /> Definir
      </Button>
    </div>
  );
}
