
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Order } from '@/types';
import { Search, Check, ArrowRight } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load orders from localStorage
  useEffect(() => {
    const loadOrders = () => {
      setIsLoading(true);
      try {
        const storedOrders = localStorage.getItem('gordopods-orders');
        if (storedOrders) {
          const parsedOrders = JSON.parse(storedOrders);
          setOrders(parsedOrders);
          setFilteredOrders(parsedOrders);
        }
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrders();
  }, []);
  
  // Filter orders when status filter or search term changes
  useEffect(() => {
    let filtered = [...orders];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        order => 
          order.orderNumber.includes(search) || 
          order.customer.name.toLowerCase().includes(search) ||
          order.customer.phone.includes(search)
      );
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm]);
  
  // Update order status
  const updateOrderStatus = (orderId: string, newStatus: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled') => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    
    setOrders(updatedOrders);
    
    // Update the selected order too if dialog is open
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    
    // Save to localStorage
    localStorage.setItem('gordopods-orders', JSON.stringify(updatedOrders));
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Novo</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">Em Preparo</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">Enviado</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Entregue</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };
  
  // Print order
  const printOrder = () => {
    if (!selectedOrder) return;
    
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    
    // Format delivery info for print
    const deliveryInfo = selectedOrder.deliveryOption.type === 'pickup'
      ? 'Retirada no Local'
      : `${selectedOrder.deliveryOption.name}`;
    
    // Format address for print
    const addressInfo = selectedOrder.customer.address
      ? `${selectedOrder.customer.address.street}, ${selectedOrder.customer.address.number}${selectedOrder.customer.address.complement ? `, ${selectedOrder.customer.address.complement}` : ''} - ${selectedOrder.customer.address.district}`
      : 'Retirada no Local';
    
    // Format variations for print
    const formatVariations = (item: any) => {
      if (!item.selectedVariations.length) return '';
      return `<br><small>(${item.selectedVariations.map((v: any) => `${v.groupName}: ${v.optionName}`).join(', ')})</small>`;
    };
    
    const printContent = `
      <html>
        <head>
          <title>Pedido #${selectedOrder.orderNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              line-height: 1.5;
            }
            h1, h2 {
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 1px solid #ccc;
            }
            .section {
              margin-bottom: 25px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .totals {
              margin-top: 20px;
              text-align: right;
            }
            .status {
              font-weight: bold;
              color: #333;
              margin-top: 20px;
            }
            .notes {
              background-color: #f9f9f9;
              padding: 10px;
              border-radius: 5px;
              margin-top: 20px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
              font-size: 0.9em;
              padding-top: 15px;
              border-top: 1px solid #ccc;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Pedido #${selectedOrder.orderNumber}</h1>
            <p>Data: ${formatDate(selectedOrder.createdAt)}</p>
            <p>Status: ${
              selectedOrder.status === 'new' ? 'Novo' :
              selectedOrder.status === 'processing' ? 'Em Preparo' :
              selectedOrder.status === 'shipped' ? 'Enviado' :
              selectedOrder.status === 'delivered' ? 'Entregue' :
              selectedOrder.status === 'cancelled' ? 'Cancelado' : 'Desconhecido'
            }</p>
          </div>
          
          <div class="section">
            <h2>Dados do Cliente</h2>
            <p><strong>Nome:</strong> ${selectedOrder.customer.name}</p>
            <p><strong>Telefone:</strong> ${selectedOrder.customer.phone}</p>
            <p><strong>Entrega:</strong> ${deliveryInfo}</p>
            <p><strong>Endereço:</strong> ${addressInfo}</p>
          </div>
          
          <div class="section">
            <h2>Itens do Pedido</h2>
            <table>
              <thead>
                <tr>
                  <th>Quantidade</th>
                  <th>Produto</th>
                  <th>Preço Unitário</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${selectedOrder.items.map(item => `
                  <tr>
                    <td>${item.quantity}</td>
                    <td>
                      ${item.productName}
                      ${formatVariations(item)}
                    </td>
                    <td>
                      ${(item.totalPrice / item.quantity).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </td>
                    <td>
                      ${item.totalPrice.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <p>
                <strong>Subtotal:</strong> 
                ${selectedOrder.subtotal.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </p>
              <p>
                <strong>Taxa de Entrega:</strong> 
                ${selectedOrder.deliveryOption.fee.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </p>
              <p>
                <strong>Total:</strong> 
                ${selectedOrder.total.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </p>
            </div>
          </div>
          
          ${selectedOrder.notes ? `
            <div class="notes">
              <h2>Observações</h2>
              <p>${selectedOrder.notes}</p>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Gordopods - ${new Date().getFullYear()}</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = function() {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pedidos</h1>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="new">Novos</SelectItem>
                  <SelectItem value="processing">Em Preparo</SelectItem>
                  <SelectItem value="shipped">Enviados</SelectItem>
                  <SelectItem value="delivered">Entregues</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-2/3 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Buscar por número, nome ou telefone"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Lista de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50" onClick={() => {
                      setSelectedOrder(order);
                      setIsDialogOpen(true);
                    }}>
                      <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                      <TableCell>
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>{order.customer.name}</TableCell>
                      <TableCell>{order.customer.phone}</TableCell>
                      <TableCell>
                        {order.total.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                            setIsDialogOpen(true);
                          }}
                        >
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="mt-2 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
              {/* Order Status */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500">Status: </span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => updateOrderStatus(
                      selectedOrder.id, 
                      value as 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
                    )}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Alterar Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="processing">Em Preparo</SelectItem>
                      <SelectItem value="shipped">Enviado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm" onClick={printOrder}>
                    Imprimir
                  </Button>
                </div>
              </div>
              
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Nome: </span>
                    <span>{selectedOrder.customer.name}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Telefone: </span>
                    <span>{selectedOrder.customer.phone}</span>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <span className="text-sm text-gray-500">Entrega: </span>
                    <span>{selectedOrder.deliveryOption.name}</span>
                  </div>
                  {selectedOrder.customer.address && (
                    <div className="col-span-1 md:col-span-2">
                      <span className="text-sm text-gray-500">Endereço: </span>
                      <span>
                        {selectedOrder.customer.address.street}, {selectedOrder.customer.address.number}
                        {selectedOrder.customer.address.complement ? `, ${selectedOrder.customer.address.complement}` : ''} - {selectedOrder.customer.address.district}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Order Items */}
              <div>
                <h3 className="font-medium mb-3">Itens do Pedido</h3>
                <div className="border rounded-md divide-y">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center p-3 gap-3">
                      {/* Product image */}
                      {item.imageUrl && (
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={item.imageUrl} 
                            alt={item.productName}
                            className="w-full h-full object-cover"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              e.currentTarget.src = "https://via.placeholder.com/100?text=Item";
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Product details */}
                      <div className="flex-1">
                        <div className="font-medium">{item.productName}</div>
                        
                        {/* Variations */}
                        {item.selectedVariations.length > 0 && (
                          <div className="text-sm text-gray-600">
                            {item.selectedVariations.map((variation) => (
                              <span key={`${variation.groupId}-${variation.optionId}`} className="mr-2">
                                {variation.groupName}: {variation.optionName}
                                {variation.priceModifier !== 0 && (
                                  <span className="text-xs ml-1">
                                    ({variation.priceModifier > 0 ? "+" : ""}
                                    {variation.priceModifier.toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    })})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Quantity and Price */}
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {item.quantity}x {" "}
                          {(item.totalPrice / item.quantity).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })}
                        </div>
                        <div className="font-medium">
                          {item.totalPrice.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Order Totals */}
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>
                    {selectedOrder.subtotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span>Taxa de Entrega:</span>
                  <span>
                    {selectedOrder.deliveryOption.fee.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between font-medium text-lg">
                  <span>Total:</span>
                  <span>
                    {selectedOrder.total.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
              </div>
              
              {/* Additional Information */}
              {selectedOrder.notes && (
                <div className="border p-4 rounded-md">
                  <h3 className="font-medium mb-2">Observações do Cliente</h3>
                  <p className="text-gray-700">{selectedOrder.notes}</p>
                </div>
              )}
              
              {/* Order Dates */}
              <div className="text-sm text-gray-500">
                <div>Data do pedido: {formatDate(selectedOrder.createdAt)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
