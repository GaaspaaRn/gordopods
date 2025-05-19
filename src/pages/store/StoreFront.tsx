import React, { useEffect, useState } from 'react';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { useProducts } from '@/contexts/ProductContext';
import { useCategories } from '@/contexts/CategoryContext';
import { Link } from 'react-router-dom';
import { Home, ShoppingCart, Menu, X, Phone, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SocialLink, Product } from '@/types';
import CategoryNavigation from '@/components/store/CategoryNavigation';
import ProductCard from '@/components/store/ProductCard';
import ShoppingCartComponent from '@/components/store/ShoppingCart';
import { useCart } from '@/contexts/CartContext';

export default function StoreFront() {
  const { storeSettings, isLoading: isLoadingSettings } = useStoreSettings();
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { categories, isLoading: isLoadingCategories } = useCategories();
  const { cart, toggleCart } = useCart();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Filter products based on selected category
  useEffect(() => {
    if (!isLoadingProducts) {
      if (selectedCategoryId) {
        setFilteredProducts(products.filter(
          product => product.active && product.categoryId === selectedCategoryId
        ));
      } else {
        setFilteredProducts(products.filter(product => product.active));
      }
    }
  }, [selectedCategoryId, products, isLoadingProducts]);
  
  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  if (isLoadingSettings || isLoadingProducts || isLoadingCategories) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Carregando loja...</p>
        </div>
      </div>
    );
  }

  // Determine primary color with fallback
  const primaryColor = storeSettings.primaryColor || '#9b87f5';
  const secondaryColor = storeSettings.secondaryColor || '#6E59A5';
  
  return (
    <div 
      className="min-h-screen flex flex-col bg-gray-50"
      style={{ 
        /* Set CSS variables for the custom colors */
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      {/* Main Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 md:justify-start md:space-x-10">
            {/* Logo and store name */}
            <div className="flex items-center">
              {storeSettings.logo ? (
                <img 
                  src={storeSettings.logo} 
                  alt={storeSettings.storeName} 
                  className="h-10 w-auto mr-3"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = "https://via.placeholder.com/150x80?text=Logo";
                  }}
                />
              ) : null}
              
              <Link to="/" className="text-xl font-bold" style={{ color: primaryColor }}>
                {storeSettings.storeName}
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <Button 
                variant="ghost"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="inline-flex items-center justify-center"
              >
                <span className="sr-only">Abrir menu</span>
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-10">
              {/* Category navigation */}
              <div className="relative">
                <CategoryNavigation 
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={setSelectedCategoryId}
                />
              </div>
            </nav>
            
            {/* Desktop Cart Button */}
            <div className="hidden md:flex items-center">
              <Button 
                variant="outline" 
                className="ml-8 inline-flex items-center"
                onClick={toggleCart}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                <span>
                  Carrinho ({cart.items.reduce((sum, item) => sum + item.quantity, 0)})
                </span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div 
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } md:hidden`}
        >
          <div className="pt-2 pb-4 px-4 space-y-1 bg-white">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/">
                <Home className="h-5 w-5 mr-2" />
                <span>Início</span>
              </Link>
            </Button>
            
            {/* Mobile Categories */}
            <div className="border-t my-2 pt-2">
              <p className="text-sm font-medium text-gray-500 mb-2">Categorias</p>
              <CategoryNavigation 
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={(categoryId) => {
                  setSelectedCategoryId(categoryId);
                  setMobileMenuOpen(false);
                }}
                className="flex-col items-start gap-1"
              />
            </div>
            
            <div className="border-t my-2"></div>
            
            <Button 
              variant="outline" 
              className="w-full justify-start mt-2"
              onClick={() => {
                toggleCart();
                setMobileMenuOpen(false);
              }}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              <span>Carrinho ({cart.items.reduce((sum, item) => sum + item.quantity, 0)})</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {/* Hero Banner */}
        {storeSettings.banner && (
          <div className="relative">
            <img 
              src={storeSettings.banner} 
              alt="Banner" 
              className="w-full h-40 sm:h-64 object-cover"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = "https://via.placeholder.com/1200x400?text=Banner";
              }}
            />
          </div>
        )}
        
        {/* Store Description */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
            <h1 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>
              {storeSettings.storeName}
            </h1>
            
            {storeSettings.description && (
              <p className="text-gray-700 mb-6">
                {storeSettings.description}
              </p>
            )}
            
            {/* Social Links */}
            {storeSettings.socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                {storeSettings.socialLinks.map((social) => (
                  <SocialButton key={social.id} social={social} />
                ))}
              </div>
            )}
            
            {/* Contact Information */}
            <div className="space-y-2">
              {storeSettings.contactInfo.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{storeSettings.contactInfo.phone}</span>
                </div>
              )}
              
              {storeSettings.contactInfo.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{storeSettings.contactInfo.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Category Navigation (visible only on mobile) */}
        <div className="md:hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3" style={{ color: secondaryColor }}>
              Categorias
            </h2>
            <CategoryNavigation 
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              className="flex-wrap"
            />
          </div>
        </div>

        {/* Products */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Category Title */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold" style={{ color: secondaryColor }}>
              {selectedCategoryId 
                ? categories.find(c => c.id === selectedCategoryId)?.name || "Produtos"
                : "Todos os Produtos"}
            </h2>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-gray-500">
                Não há produtos disponíveis nesta categoria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Shopping Cart */}
      <ShoppingCartComponent />
      
      <footer className="bg-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">
              &copy; {new Date().getFullYear()} {storeSettings.storeName} - Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper component for social media buttons
interface SocialButtonProps {
  social: SocialLink;
}

function SocialButton({ social }: SocialButtonProps) {
  return (
    <a
      href={social.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-gray-100 hover:bg-gray-200 transition"
    >
      <span>{social.name}</span>
      <ExternalLink className="h-3.5 w-3.5 ml-1" />
    </a>
  );
}
