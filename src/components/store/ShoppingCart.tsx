
import React, { useState } from 'react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart as CartIcon, Plus, Minus, Trash2, ArrowRight, Send } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Neighborhood, Order } from "@/types";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format";

// Define checkout steps
enum CheckoutStep {
  CART_REVIEW,
  DELIVERY_OPTIONS,
  CUSTOMER_INFO
}

// Form schema for validation
const customerFormSchema = z.object({
  name: z.string().min(3, {
    message: "O nome deve ter pelo menos 3 caracteres.",
  }),
  phone: z.string()
    .min(14, { message: "Telefone inválido" })
    .max(15, { message: "Telefone inválido" })
    .refine((val) => /^\(\d{2}\) \d{5}-\d{4}$/.test(val), {
      message: "Formato inválido. Use (XX) XXXXX-XXXX",
    }),
  deliveryOption: z.string(),
  neighborhood: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  district: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

const ShoppingCart = () => {
  const { cart, isCartOpen, toggleCart, closeCart, updateQuantity, removeItem, saveOrderToDatabase } = useCart();
  const { deliverySettings, storeConfig, storeSettings } = useStoreSettings();
  
  // State for checkout steps
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.CART_REVIEW);
  
  // State for processing order
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  
  // Selected delivery option and cost
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);

  // Initialize form with react-hook-form and default delivery option
  // Garante que temos valores padrão seguros mesmo que deliverySettings esteja undefined temporariamente
  const defaultDeliveryOption = 
    deliverySettings?.pickup?.enabled ? "pickup" : 
    deliverySettings?.fixedRate?.enabled ? "fixedRate" : 
    deliverySettings?.neighborhoodRates?.enabled ? "neighborhood" : "pickup";
  
  // Initialize form with react-hook-form
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      deliveryOption: defaultDeliveryOption,
      neighborhood: "",
      street: "",
      number: "",
      complement: "",
      district: "",
      notes: "",
    },
  });
  
  // Phone input mask helper function
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      // Format as (XX) XXXXX-XXXX
      if (value.length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      }
      if (value.length > 9) {
        value = `${value.slice(0, 10)}-${value.slice(10)}`;
      }
      form.setValue("phone", value);
    }
  };
  
  // Calculate total with delivery
  const calculateTotal = () => {
    return cart.subtotal + deliveryCost;
  };
  
  // Handle delivery option change
  const handleDeliveryOptionChange = (value: string) => {
    form.setValue("deliveryOption", value);
    
    // Reset delivery cost
    setDeliveryCost(0);
    
    // Update delivery cost based on option
    if (value === "fixedRate" && deliverySettings?.fixedRate?.enabled) {
      setDeliveryCost(deliverySettings.fixedRate.fee);
    } else if (value === "neighborhood" && selectedNeighborhood) {
      setDeliveryCost(selectedNeighborhood.fee);
    }
    
    // Reset neighborhood if not using neighborhood delivery
    if (value !== "neighborhood") {
      setSelectedNeighborhood(null);
      form.setValue("neighborhood", "");
    }
  };
  
  // Handle neighborhood selection
  const handleNeighborhoodChange = (id: string) => {
    if (!deliverySettings?.neighborhoodRates?.neighborhoods) return;
    
    const neighborhood = deliverySettings.neighborhoodRates.neighborhoods.find(n => n.id === id);
    if (neighborhood) {
      setSelectedNeighborhood(neighborhood);
      setDeliveryCost(neighborhood.fee);
    }
  };
  
  // Go to next step
  const nextStep = () => {
    if (currentStep === CheckoutStep.CART_REVIEW) {
      setCurrentStep(CheckoutStep.DELIVERY_OPTIONS);
    } else if (currentStep === CheckoutStep.DELIVERY_OPTIONS) {
      setCurrentStep(CheckoutStep.CUSTOMER_INFO);
    }
  };
  
  // Go to previous step
  const prevStep = () => {
    if (currentStep === CheckoutStep.CUSTOMER_INFO) {
      setCurrentStep(CheckoutStep.DELIVERY_OPTIONS);
    } else if (currentStep === CheckoutStep.DELIVERY_OPTIONS) {
      setCurrentStep(CheckoutStep.CART_REVIEW);
    }
  };
  
  // Generate a unique order number
  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}${random}`;
  };
  
  // Handle form submission and WhatsApp checkout
  const onSubmit = async (data: CustomerFormValues) => {
    // Prevent multiple submissions
    if (isProcessingOrder) return;
    setIsProcessingOrder(true);
    
    try {
      // Validate that cart has items
      if (cart.items.length === 0) {
        toast.error('Seu carrinho está vazio. Adicione itens antes de finalizar.');
        setIsProcessingOrder(false);
        return;
      }
      
      // Generate unique order number
      const orderNumber = generateOrderNumber();
      
      // Format address based on delivery option
      let address = '';
      if (data.deliveryOption !== "pickup") {
        if (!data.street || !data.number || !data.district) {
          toast.error('Por favor, preencha todos os campos de endereço.');
          setIsProcessingOrder(false);
          return;
        }
        
        address = `${data.street}, ${data.number}`;
        if (data.complement) {
          address += `, ${data.complement}`;
        }
        address += ` - ${data.district}`;
      }
      
      // Format delivery method info
      let deliveryMethod = '';
      let deliveryOptionType: 'pickup' | 'fixedRate' | 'neighborhood' = 'pickup';
      let neighborhoodIdName = { id: '', name: '' };
      
      if (data.deliveryOption === "pickup") {
        deliveryMethod = "Retirada no Local";
        deliveryOptionType = "pickup";
      } else if (data.deliveryOption === "fixedRate" && deliverySettings?.fixedRate) {
        deliveryMethod = `Entrega com Taxa Fixa: ${formatCurrency(deliverySettings.fixedRate.fee)}`;
        deliveryOptionType = "fixedRate";
      } else if (data.deliveryOption === "neighborhood") {
        deliveryOptionType = "neighborhood";
        if (selectedNeighborhood) {
          deliveryMethod = `Entrega para ${selectedNeighborhood.name}: ${formatCurrency(selectedNeighborhood.fee)}`;
          neighborhoodIdName = { 
            id: selectedNeighborhood.id, 
            name: selectedNeighborhood.name 
          };
        }
      }
      
      // Format order items
      let orderItems = '';
      cart.items.forEach(item => {
        orderItems += `\n- ${item.quantity}x ${item.productName}`;
        
        // Add variations
        if (item.selectedVariations.length > 0) {
          orderItems += ' (';
          orderItems += item.selectedVariations.map(v => `${v.groupName}: ${v.optionName}`).join(', ');
          orderItems += ')';
        }
        
        // Add price
        orderItems += ` - ${formatCurrency(item.totalPrice / item.quantity)} cada = ${formatCurrency(item.totalPrice)}`;
      });
      
      // Calculate total
      const total = calculateTotal();
      
      // Create order object for database
      const order: Order = {
        id: crypto.randomUUID(),
        orderNumber,
        customer: {
          name: data.name,
          phone: data.phone,
          address: data.deliveryOption !== "pickup" ? {
            street: data.street || '',
            number: data.number || '',
            complement: data.complement,
            district: data.district || '',
          } : undefined,
        },
        items: cart.items,
        subtotal: cart.subtotal,
        deliveryOption: {
          type: deliveryOptionType,
          name: deliveryMethod,
          fee: deliveryCost,
          neighborhoodId: neighborhoodIdName.id,
          neighborhoodName: neighborhoodIdName.name,
        },
        total,
        notes: data.notes,
        status: 'new',
        createdAt: new Date().toISOString(),
        whatsappSent: false,
      };
      
      // Format WhatsApp message
      let message = `*Pedido Loja ${storeSettings?.storeName || 'Gordopods'}!*
*Número do Pedido:* #${orderNumber}

*Cliente:* ${data.name}
*Telefone:* ${data.phone}`;

      // Add address if not pickup
      if (data.deliveryOption !== "pickup") {
        message += `\n*Endereço:* ${address}`;
      }

      message += `\n\n*Itens do Pedido:*${orderItems}

*Subtotal:* ${formatCurrency(cart.subtotal)}
*${data.deliveryOption === "pickup" ? "Retirada no Local" : "Taxa de Entrega"}:* ${data.deliveryOption === "pickup" ? "R$ 0,00" : formatCurrency(deliveryCost)}
*Total Geral:* ${formatCurrency(total)}`;

      // Add notes if any
      if (data.notes) {
        message += `\n\n*Observações:* ${data.notes}`;
      }
      
      // Get WhatsApp number from store config
      // Remove all non-digits
      const whatsappNumber = storeConfig?.whatsappNumber?.replace(/\D/g, '') || '';
      
      // Ensure the WhatsApp number is valid
      if (!whatsappNumber || whatsappNumber.length < 10) {
        toast.error('Número de WhatsApp da loja não configurado corretamente.');
        setIsProcessingOrder(false);
        return;
      }
      
      // Save order to database before redirecting (in parallel)
      await saveOrderToDatabase({
        ...order,
        whatsappSent: true,
      });
      
      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      // Close cart
      closeCart();
      
      // Reset checkout step for next time
      setCurrentStep(CheckoutStep.CART_REVIEW);
      
      // Reset form
      form.reset();
      
      // Show success message
      toast.success('Redirecionando para o WhatsApp');
      
      // Redirect to WhatsApp with small delay to allow toast to be seen
      setTimeout(() => {
        window.location.href = whatsappUrl;
      }, 1000);
      
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.');
    } finally {
      setIsProcessingOrder(false);
    }
  };
  
  // Reset checkout when cart is closed
  const handleClose = () => {
    setCurrentStep(CheckoutStep.CART_REVIEW);
    closeCart();
  };
  
  // Render cart items or empty cart message
  const renderCartItems = () => {
    if (cart.items.length === 0) {
      return (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center py-12">
          <CartIcon size={48} className="text-gray-300 mb-4" />
          <h3 className="text-lg font-medium">Seu carrinho está vazio</h3>
          <p className="text-sm text-gray-500 mt-1">
            Adicione produtos para continuar com o pedido
          </p>
          <Button className="mt-6" onClick={handleClose}>
            Voltar às Compras
          </Button>
        </div>
      );
    }
    
    return (
      <>
        <ScrollArea className="flex-1 my-6 h-[60vh]">
          <div className="space-y-4 pr-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 py-3 border-b last:border-b-0"
              >
                {/* Product image */}
                <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = "https://via.placeholder.com/100?text=Item";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sem imagem
                    </div>
                  )}
                </div>
                
                {/* Product details */}
                <div className="flex flex-col flex-1">
                  <h4 className="font-medium">{item.productName}</h4>
                  
                  {/* Variations */}
                  {item.selectedVariations.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {item.selectedVariations.map((variation) => (
                        <div
                          key={`${variation.groupId}-${variation.optionId}`}
                          className="flex text-sm text-gray-600"
                        >
                          <span>{variation.groupName}: </span>
                          <span className="ml-1 font-medium">{variation.optionName}</span>
                          {variation.priceModifier !== 0 && (
                            <span className="text-xs ml-1">
                              ({variation.priceModifier > 0 ? "+" : ""}
                              {formatCurrency(variation.priceModifier)})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Price */}
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <div className="font-medium">
                      {formatCurrency(item.totalPrice / item.quantity)}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="w-8 text-center">{item.quantity}</span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="border-t pt-4">
          <div className="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span className="font-semibold">
              {formatCurrency(cart.subtotal)}
            </span>
          </div>
          
          <Textarea 
            placeholder="Observações sobre o pedido..." 
            className="mt-3 mb-3"
            value={form.watch("notes")}
            onChange={(e) => form.setValue("notes", e.target.value)}
          />
          
          <SheetFooter className="flex flex-col gap-3 sm:flex-row mt-6">
            <SheetClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Continuar Comprando
              </Button>
            </SheetClose>
            
            <Button className="w-full sm:w-auto" onClick={nextStep}>
              Opções de Entrega <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </SheetFooter>
        </div>
      </>
    );
  };
  
  // Render delivery options step
  const renderDeliveryOptions = () => {
    // Check if deliverySettings is defined and if any delivery option is available
    const hasDeliveryOptions = 
      deliverySettings?.pickup?.enabled || 
      deliverySettings?.fixedRate?.enabled || 
      deliverySettings?.neighborhoodRates?.enabled;
    
    if (!hasDeliveryOptions) {
      return (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center py-12">
          <h3 className="text-lg font-medium">Sem opções de entrega disponíveis</h3>
          <p className="text-sm text-gray-500 mt-1">
            Entre em contato com a loja para mais informações
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={prevStep}>Voltar ao Carrinho</Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="py-6">
        <h3 className="text-lg font-medium mb-4">Escolha a forma de entrega</h3>
        
        <RadioGroup 
          value={form.watch("deliveryOption")} 
          onValueChange={handleDeliveryOptionChange}
          className="flex flex-col gap-4"
        >
          {/* Pickup option */}
          {deliverySettings?.pickup?.enabled && (
            <div className="flex items-start space-x-3 border p-4 rounded-md">
              <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
              <div>
                <Label htmlFor="pickup" className="font-medium">Retirada no Local</Label>
                <p className="text-sm text-gray-500 mt-1">{deliverySettings.pickup.instructions}</p>
                <p className="text-sm font-medium mt-2">R$ 0,00</p>
              </div>
            </div>
          )}
          
          {/* Fixed rate delivery */}
          {deliverySettings?.fixedRate?.enabled && (
            <div className="flex items-start space-x-3 border p-4 rounded-md">
              <RadioGroupItem value="fixedRate" id="fixedRate" className="mt-1" />
              <div>
                <Label htmlFor="fixedRate" className="font-medium">Entrega com Taxa Fixa</Label>
                <p className="text-sm text-gray-500 mt-1">{deliverySettings.fixedRate.description}</p>
                <p className="text-sm font-medium mt-2">{formatCurrency(deliverySettings.fixedRate.fee)}</p>
              </div>
            </div>
          )}
          
          {/* Neighborhood delivery */}
          {deliverySettings?.neighborhoodRates?.enabled && deliverySettings.neighborhoodRates.neighborhoods.length > 0 && (
            <div className="flex items-start space-x-3 border p-4 rounded-md">
              <RadioGroupItem value="neighborhood" id="neighborhood" className="mt-1" />
              <div className="w-full">
                <Label htmlFor="neighborhood" className="font-medium">Entrega por Bairro</Label>
                
                {form.watch("deliveryOption") === "neighborhood" && (
                  <div className="mt-3">
                    <Label htmlFor="neighborhoodSelect" className="text-sm">Selecione o bairro</Label>
                    <select
                      id="neighborhoodSelect"
                      className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.watch("neighborhood")}
                      onChange={(e) => {
                        form.setValue("neighborhood", e.target.value);
                        handleNeighborhoodChange(e.target.value);
                      }}
                    >
                      <option value="">Selecione um bairro</option>
                      {deliverySettings.neighborhoodRates.neighborhoods.map((neighborhood) => (
                        <option key={neighborhood.id} value={neighborhood.id}>
                          {neighborhood.name} - {formatCurrency(neighborhood.fee)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </RadioGroup>
        
        {/* Summary with delivery */}
        <div className="border-t mt-8 pt-4">
          <div className="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span>
              {formatCurrency(cart.subtotal)}
            </span>
          </div>
          
          <div className="flex justify-between mb-2">
            <span>Taxa de Entrega:</span>
            <span>
              {formatCurrency(deliveryCost)}
            </span>
          </div>
          
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>
              {formatCurrency(calculateTotal())}
            </span>
          </div>
          
          <div className="flex justify-between gap-3 mt-8">
            <Button variant="outline" onClick={prevStep} className="w-full">
              Voltar
            </Button>
            <Button 
              onClick={nextStep} 
              className="w-full"
              disabled={form.watch("deliveryOption") === "neighborhood" && !selectedNeighborhood}
            >
              Continuar <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render customer info form
  const renderCustomerInfoForm = () => {
    return (
      <div className="py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo*</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite seu nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone/WhatsApp*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(XX) XXXXX-XXXX" 
                      value={field.value}
                      onChange={(e) => handlePhoneInput(e)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Address fields (only show if delivery is selected) */}
            {form.watch("deliveryOption") !== "pickup" && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Endereço de Entrega</h3>
                
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rua/Avenida*</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Rua das Flores" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número*</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="complement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Apto 101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro*</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {/* Order summary */}
            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>
                  {formatCurrency(cart.subtotal)}
                </span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span>
                  {form.watch("deliveryOption") === "pickup" 
                    ? "Retirada no Local:" 
                    : "Taxa de Entrega:"}
                </span>
                <span>
                  {formatCurrency(deliveryCost)}
                </span>
              </div>
              
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
              
              <div className="flex justify-between gap-3 mt-8">
                <Button variant="outline" type="button" onClick={prevStep} className="w-full">
                  Voltar
                </Button>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isProcessingOrder}
                >
                  {isProcessingOrder ? (
                    <>
                      <span className="mr-2">Processando...</span>
                      <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin"></div>
                    </>
                  ) : (
                    <>
                      Finalizar no WhatsApp <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    );
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={toggleCart}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <CartIcon className="mr-2" size={20} />
            {currentStep === CheckoutStep.CART_REVIEW && "Carrinho de Compras"}
            {currentStep === CheckoutStep.DELIVERY_OPTIONS && "Opções de Entrega"}
            {currentStep === CheckoutStep.CUSTOMER_INFO && "Seus Dados"}
          </SheetTitle>
        </SheetHeader>
        
        {/* Cart is empty or show current step */}
        {cart.items.length === 0 ? (
          renderCartItems()
        ) : (
          <>
            {currentStep === CheckoutStep.CART_REVIEW && renderCartItems()}
            {currentStep === CheckoutStep.DELIVERY_OPTIONS && renderDeliveryOptions()}
            {currentStep === CheckoutStep.CUSTOMER_INFO && renderCustomerInfoForm()}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ShoppingCart;
