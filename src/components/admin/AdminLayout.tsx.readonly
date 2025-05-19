
import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Tag,
  ShoppingCart, 
  Palette, 
  Settings, 
  Menu, 
  X, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';

type NavigationItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
};

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Categorias', href: '/admin/categorias', icon: Tag },
  { name: 'Produtos', href: '/admin/produtos', icon: ShoppingCart },
  { name: 'Personalização', href: '/admin/personalizacao', icon: Palette },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
  
  const currentPage = navigation.find(item => 
    item.href === location.pathname || 
    (item.href !== '/admin' && location.pathname.startsWith(item.href))
  );

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div 
        className={cn(
          "fixed inset-0 z-40 lg:hidden bg-black/80 transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link to="/admin" className="text-xl font-semibold text-brand-purple">
            Gordopods
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X size={20} />
          </Button>
        </div>
        
        <nav className="flex flex-col gap-1 p-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                item.href === location.pathname || 
                (item.href !== '/admin' && location.pathname.startsWith(item.href))
                  ? "bg-brand-light-purple text-brand-dark-purple"
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          ))}
          
          <Separator className="my-4" />
          
          <Button
            variant="ghost"
            className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut size={18} className="mr-2" />
            Sair
          </Button>
        </nav>
      </div>
      
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 bg-white border-b h-16 flex items-center px-4 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu size={20} />
          </Button>
          
          <div className="ml-4 lg:ml-0 font-medium">
            {currentPage?.name || 'Admin'}
          </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
