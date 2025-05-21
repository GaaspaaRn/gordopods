import React, { useEffect, useState } from 'react';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { useProducts } from '@/contexts/ProductContext';
import { useCategories } from '@/contexts/CategoryContext';
import { Link } from 'react-router-dom';
import { Home, ShoppingCart, Menu, X, Phone, Mail, ExternalLink, ChevronDown } from 'lucide-react'; // Adicionado ChevronDown
import { Button } from '@/components/ui/button';
import { SocialLink, Product } from '@/types';
// import CategoryNavigation from '@/components/store/CategoryNavigation'; // Vamos implementar diretamente ou você ajusta este
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
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  if (isLoadingSettings || isLoadingProducts || isLoadingCategories) {
    return ( /* ... seu loader ... */ );
  }

  const primaryColor = storeSettings.primaryColor || '#9b87f5';
  const secondaryColor = storeSettings.secondaryColor || '#6E59A5';

  const currentCategoryName = selectedCategoryId
    ? categories.find(c => c.id === selectedCategoryId)?.name
    : "Todos os Produtos";
  
  return (
    <div 
      className="min-h-screen flex flex-col bg-gray-100" // Fundo um pouco mais escuro para contraste dos cards
      style={{ 
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      {/* Header como antes - omitido para brevidade */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 md:justify-start md:space-x-10">
            <div className="flex items-center">
              {storeSettings.logo && (
                <img 
                  src={storeSettings.logo} 
                  alt={storeSettings.storeName} 
                  className="h-10 w-auto mr-3"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = "https://via.placeholder.com/150x80?text=Logo";
                  }}
                />
              )}
              <Link to="/" className="text-xl font-bold" style={{ color: primaryColor }}>
                {storeSettings.storeName}
              </Link>
            </div>
            <div className="flex md:hidden">
              <Button 
                variant="ghost"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              >
                <span className="sr-only">Abrir menu</span>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
            {/* Desktop Category Navigation (Movida para baixo do header/banner) */}
            <div className="hidden md:flex items-center ml-auto"> {/* ml-auto para empurrar para a direita */}
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
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden border-t border-gray-200`}>
          <div className="pt-2 pb-4 px-4 space-y-1 bg-white">
            <Button variant="ghost" className="w-full justify-start text-base font-medium" asChild>
              <Link to="/">
                <Home className="h-5 w-5 mr-3" />
                Início
              </Link>
            </Button>
            <div className="border-t my-2 pt-2">
              <p className="text-sm font-semibold text-gray-500 px-1 mb-1">Categorias</p>
              {/* Mobile Categories - Lista Vertical no Menu */}
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant="ghost"
                  className={`w-full justify-start text-base font-medium ${selectedCategoryId === category.id ? 'text-primary bg-primary-foreground' : ''}`}
                  onClick={() => {
                    setSelectedCategoryId(category.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  {category.name}
                </Button>
              ))}
               <Button
                  variant="ghost"
                  className={`w-full justify-start text-base font-medium ${selectedCategoryId === null ? 'text-primary bg-primary-foreground' : ''}`}
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setMobileMenuOpen(false);
                  }}
                >
                  Todas as Categorias
                </Button>
            </div>
            <div className="border-t my-2"></div>
            <Button 
              variant="outline" 
              className="w-full justify-start text-base font-medium mt-2"
              onClick={() => {
                toggleCart();
                setMobileMenuOpen(false);
              }}
            >
              <ShoppingCart className="h-5 w-5 mr-3" />
              Carrinho ({cart.items.reduce((sum, item) => sum + item.quantity, 0)})
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {storeSettings.banner && ( /* Banner mantido */
          <div className="relative">
            <img src={storeSettings.banner} alt="Banner" className="w-full h-40 sm:h-64 object-cover" onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.src = "https://via.placeholder.com/1200x400?text=Banner"; }}/>
          </div>
        )}
        
        {/* Store Description - Mais Compacta */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4"> {/* max-w-4xl para não ficar tão largo, py-4 */}
          <div className="bg-white rounded-lg shadow p-4 text-center md:text-left"> {/* Removido shadow-sm, padding menor, text-center */}
            <h1 className="text-xl md:text-2xl font-bold mb-2" style={{ color: primaryColor }}>
              Pods Descartáveis 
            </h1>
            {storeSettings.description && (
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 md:line-clamp-none"> {/* text-sm, line-clamp-2 para mobile */}
                {storeSettings.description}
              </p>
            )}
            {/* Links sociais e contato movidos para o footer ou um menu "Sobre" se desejar */}
          </div>
        </div>

        {/* Category Navigation - Otimizada */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sticky top-[calc(var(--header-height,64px)+0px)] bg-gray-100 z-40 md:relative md:top-0 md:bg-transparent md:z-auto"> {/* Header height pode precisar ser ajustado */}
            {/* Desktop: Barra de rolagem horizontal */}
            <div className="hidden md:flex items-center overflow-x-auto space-x-2 pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <h2 className="text-sm font-semibold whitespace-nowrap mr-2" style={{ color: secondaryColor }}>
                    Filtrar por:
                </h2>
                <Button
                    variant={selectedCategoryId === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategoryId(null)}
                    className="whitespace-nowrap rounded-full"
                    style={selectedCategoryId === null ? { backgroundColor: primaryColor, color: 'white', borderColor: primaryColor } : {}}
                >
                    Todas
                </Button>
                {categories.map(category => (
                    <Button
                        key={category.id}
                        variant={selectedCategoryId === category.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategoryId(category.id)}
                        className="whitespace-nowrap rounded-full"
                        style={selectedCategoryId === category.id ? { backgroundColor: primaryColor, color: 'white', borderColor: primaryColor } : {}}
                    >
                        {category.name}
                    </Button>
                ))}
            </div>

            {/* Mobile: Dropdown (Select) para categorias */}
            <div className="md:hidden relative">
                 <select
                    id="category-select-mobile"
                    value={selectedCategoryId || ''}
                    onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base appearance-none pr-8 bg-white"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em' }}
                >
                    <option value="">Todas as Categorias</option>
                    {categories.map(category => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        {/* Products Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Título da categoria selecionada (mais sutil) */}
          <h2 className="text-2xl font-bold mb-4 text-center md:text-left" style={{ color: secondaryColor }}>
            {currentCategoryName}
          </h2>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500">Não há produtos disponíveis nesta categoria ou filtro.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"> {/* Gap ajustado */}
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <ShoppingCartComponent />
      
      <footer /* ... seu footer ... */ >
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500"> {/* Tamanho de fonte menor */}
            <p className="mb-2">
              © {new Date().getFullYear()} {storeSettings.storeName} - Todos os direitos reservados
            </p>
            {/* Info de contato e social links podem vir aqui também de forma compacta */}
            <div className="flex justify-center space-x-4 mb-2">
              {storeSettings.contactInfo.phone && (<span><Phone size={14} className="inline mr-1" />{storeSettings.contactInfo.phone}</span>)}
              {storeSettings.contactInfo.email && (<span><Mail size={14} className="inline mr-1" />{storeSettings.contactInfo.email}</span>)}
            </div>
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-2">
                {storeSettings.socialLinks.map((social) => (
                  <a key={social.id} href={social.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{social.name}</a>
                ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// SocialButton não é mais usado diretamente aqui se os links sociais foram para o footer
// interface SocialButtonProps { social: SocialLink; }
// function SocialButton({ social }: SocialButtonProps) { /* ... */ }
