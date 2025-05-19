
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  BarChart2,
  Package,
  List,
  Palette,
  Settings,
} from 'lucide-react';

export default function Dashboard() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vendas Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 0,00</div>
              <p className="text-xs text-muted-foreground">
                Aguardando primeiros pedidos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pedidos Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Sem pedidos pendentes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Adicione produtos à loja
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
              <CardDescription>
                Produtos mais populares da sua loja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-40 border rounded-md border-dashed">
                <div className="text-center space-y-2">
                  <Package className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Sem dados de vendas ainda
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Visão Geral de Vendas</CardTitle>
              <CardDescription>
                Resumo de desempenho da sua loja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-40 border rounded-md border-dashed">
                <div className="text-center space-y-2">
                  <BarChart2 className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Aguardando dados de vendas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Ações Rápidas</h2>
        
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Link to="/z1k4adm/produtos/novo">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
            >
              <ShoppingCart size={24} />
              <span>Adicionar Produto</span>
            </Button>
          </Link>
          
          <Link to="/z1k4adm/categorias">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
            >
              <List size={24} />
              <span>Gerenciar Categorias</span>
            </Button>
          </Link>
          
          <Link to="/z1k4adm/pedidos">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
            >
              <Package size={24} />
              <span>Ver Pedidos</span>
            </Button>
          </Link>
          
          <Link to="/z1k4adm/personalizacao">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
            >
              <Palette size={24} />
              <span>Personalizar Loja</span>
            </Button>
          </Link>
          
          <Link to="/z1k4adm/configuracoes">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
            >
              <Settings size={24} />
              <span>Configurações</span>
            </Button>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
