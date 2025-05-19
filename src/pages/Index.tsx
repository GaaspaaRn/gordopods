
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Settings } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-brand-light-purple to-white p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl md:text-5xl font-bold text-brand-dark-purple">
          Gordopods
        </h1>
        
        <p className="text-lg text-gray-700">
          Os melhores pods da região! Loja virtual com checkout via WhatsApp.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center pt-4">
          <Link to="/z1k4adm">
            <Button className="w-full md:w-auto">
              <Settings size={18} className="mr-2" />
              Acessar Painel Admin
            </Button>
          </Link>
          
          <Link to="/">
            <Button variant="outline" className="w-full md:w-auto">
              <ShoppingCart size={18} className="mr-2" />
              Ver Loja
            </Button>
          </Link>
        </div>
        
        <div className="text-sm text-gray-500 pt-6">
          <p>
            Credenciais de acesso ao painel administrativo:
            <br />
            Email: admin@gordopods.com
            <br />
            Senha: admin123
          </p>
        </div>
      </div>
    </div>
  );
}
