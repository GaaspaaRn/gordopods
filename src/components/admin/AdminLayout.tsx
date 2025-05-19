
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Package,
  List,
  Palette,
  Settings,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  ChevronRight
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/z1k4adm' },
    { name: 'Categorias', icon: <List size={20} />, path: '/z1k4adm/categorias' },
    { name: 'Produtos', icon: <Package size={20} />, path: '/z1k4adm/produtos' },
    { name: 'Pedidos', icon: <ShoppingCart size={20} />, path: '/z1k4adm/pedidos' },
    { name: 'Personalização', icon: <Palette size={20} />, path: '/z1k4adm/personalizacao' },
    { name: 'Configurações', icon: <Settings size={20} />, path: '/z1k4adm/configuracoes' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Mobile menu button */}
              <div className="flex items-center md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-gray-500 hover:text-gray-800 p-2"
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
              
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link to="/z1k4adm" className="text-xl font-bold text-primary">
                  Gordopods Admin
                </Link>
              </div>
            </div>
            
            <div className="flex items-center">
              {/* Visit store button */}
              <Link to="/" className="hidden md:block mr-4">
                <Button variant="outline" size="sm">
                  Visitar Loja
                </Button>
              </Link>
              
              {/* User info and logout */}
              <div className="flex items-center">
                <span className="hidden md:block text-sm text-gray-700 mr-3">
                  {user?.name || user?.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut size={18} />
                  <span className="sr-only md:not-sr-only md:ml-2">Sair</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <nav className="bg-white shadow-inner px-4 py-2 space-y-1">
          <Link to="/" className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
            <ShoppingCart size={18} className="mr-2" />
            Visitar Loja
          </Link>
          
          <div className="border-t my-2"></div>
          
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-3 py-2 text-sm rounded ${
                isActive(item.path)
                  ? 'bg-primary text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {React.cloneElement(item.icon, {
                className: isActive(item.path) ? 'mr-2' : 'mr-2 text-gray-500',
              })}
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-col md:flex-row flex-1">
        {/* Sidebar (desktop only) */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 pt-16">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="flex-1 px-2 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center px-4 py-3 text-sm rounded-md ${
                      isActive(item.path)
                        ? 'bg-primary text-white font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {React.cloneElement(item.icon, {
                      className: isActive(item.path) ? 'mr-2' : 'mr-2 text-gray-500',
                    })}
                    {item.name}
                    {isActive(item.path) && <ChevronRight className="ml-auto" size={16} />}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 md:pl-64 pt-6 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
