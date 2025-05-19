
import React, { useState } from 'react';
import { ProductImage } from '@/types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  className?: string;
}

const ProductImageGallery = ({ 
  images, 
  productName,
  className 
}: ProductImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  
  if (!images || images.length === 0) {
    return (
      <div className={cn("bg-gray-200 aspect-square flex items-center justify-center", className)}>
        <span className="text-gray-400">Sem imagem</span>
      </div>
    );
  }
  
  // Sort images by order property
  const sortedImages = [...images].sort((a, b) => a.order - b.order);
  
  // Make sure main image is first
  const mainImage = sortedImages.find(img => img.isMain);
  if (mainImage) {
    const mainIndex = sortedImages.indexOf(mainImage);
    if (mainIndex > 0) {
      sortedImages.splice(mainIndex, 1);
      sortedImages.unshift(mainImage);
    }
  }
  
  const handlePrevImage = () => {
    setActiveIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };
  
  const handleNextImage = () => {
    setActiveIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Main image */}
      <div 
        className="aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <img
          src={sortedImages[activeIndex].url}
          alt={`${productName} - Imagem ${activeIndex + 1}`}
          className="w-full h-full object-cover"
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = "https://via.placeholder.com/400?text=Imagem";
          }}
        />
      </div>
      
      {/* Thumbnails */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto py-1">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              className={cn(
                "w-16 h-16 rounded border-2 overflow-hidden flex-shrink-0",
                index === activeIndex 
                  ? "border-primary" 
                  : "border-transparent hover:border-gray-300"
              )}
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver imagem ${index + 1}`}
            >
              <img
                src={image.url}
                alt={`${productName} - Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = "https://via.placeholder.com/100?text=Miniatura";
                }}
              />
            </button>
          ))}
        </div>
      )}
      
      {/* Modal for image zoom */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[80vw] p-1 md:p-2 max-h-[90vh]">
          <div className="relative h-full max-h-[80vh]">
            <img
              src={sortedImages[activeIndex].url}
              alt={`${productName} - Imagem ampliada ${activeIndex + 1}`}
              className="w-full h-full object-contain"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = "https://via.placeholder.com/800?text=Imagem";
              }}
            />
            
            {sortedImages.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductImageGallery;
