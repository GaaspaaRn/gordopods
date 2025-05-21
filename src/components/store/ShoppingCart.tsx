import React, { useState, useEffect } from 'react';
import {
  Sheet,
  // SheetClose, // Não é necessário importar se o X padrão for usado
  SheetContent,
  // SheetFooter, // Usaremos nossa própria div para o footer fixo
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart as CartIcon, Plus, Minus, Trash2, ArrowRight, Send, ChevronLeft } from "lucide-react";
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

enum CheckoutStep {
  CART_REVIEW,
  DELIVERY_OPTIONS,
  CUSTOMER_INFO
}

const customerFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  phone: z.string()
    .min(14, { message: "Telefone inválido. Use (XX) XXXXX-XXXX" })
    .max(15, { message: "Telefone inválido." })
    .refine((val) => /^\(\d{2}\) \d{5}-\d{4}$/.test(val), {
      message: "Formato inválido. Use (XX) XXXXX-XXXX",
    }),
  deliveryOption: z.string({ required_error: "Selecione uma opção de entrega."}).min(1, "Selecione uma opção de entrega."),
  neighborhood: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  district: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

const ShoppingCart = () => {
  const { cart, isCartOpen, toggleCart, closeCart, updateQuantity, removeItem, saveOrderToDatabase, clearCart } = useCart();
  const { deliverySettings, storeConfig, storeSettings } = useStoreSettings();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.CART_REVIEW);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);

  const defaultDeliveryOption = 
    deliverySettings?.pickup?.enabled ? "pickup" : 
    deliverySettings?.fixedRate?.enabled ? "fixedRate" : 
    deliverySettings?.neighborhoodRates?.enabled ? "neighborhood" : "";
  
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { name: "", phone: "", deliveryOption: defaultDeliveryOption, neighborhood: "", street: "", number: "", complement: "", district: "", notes: "" },
  });

  useEffect(() => {
    if (deliverySettings && form.getValues("deliveryOption") === "") { 
      const newDefaultDeliveryOption = 
        deliverySettings.pickup?.enabled ? "pickup" : 
        deliverySettings.fixedRate?.enabled ? "fixedRate" : 
        deliverySettings.neighborhoodRates?.enabled ? "neighborhood" : "";
      if (newDefaultDeliveryOption){
        form.setValue("deliveryOption", newDefaultDeliveryOption);
        handleDeliveryOptionChange(newDefaultDeliveryOption); // Atualiza custo
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliverySettings, form.setValue, form.getValues]);

  const { field: phoneFormField } = form.register("phone");

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    
    let formattedValue = "";
    if (value.length > 0) formattedValue = `(${value.slice(0, 2)}`;
    if (value.length > 2) formattedValue += `) ${value.slice(2, 7)}`;
    if (value.length > 7) formattedValue += `-${value.slice(7, 11)}`;
    
    phoneFormField.onChange(formattedValue);
  };
  
  const calculateTotal = () => cart.subtotal + deliveryCost;
  
  const handleDeliveryOptionChange = (value: string) => {
    form.setValue("deliveryOption", value);
    let cost = 0;
    if (value === "fixedRate" && deliverySettings?.fixedRate?.enabled) {
      cost = deliverySettings.fixedRate.fee;
    } else if (value === "neighborhood") {
      const currentNeighborhoodId = form.getValues("neighborhood");
      if (currentNeighborhoodId) {
        const neighborhood = deliverySettings?.neighborhoodRates?.neighborhoods.find(n => n.id === currentNeighborhoodId);
        if (neighborhood) cost = neighborhood.fee;
      }
    }
    setDeliveryCost(cost);
    if (value !== "neighborhood") {
      setSelectedNeighborhood(null);
      form.setValue("neighborhood", "");
    }
  };
  
  const handleNeighborhoodChange = (neighborhoodId: string) => {
    form.setValue("neighborhood", neighborhoodId);
    if (!deliverySettings?.neighborhoodRates?.neighborhoods) return;
    const neighborhood = deliverySettings.neighborhoodRates.neighborhoods.find(n => n.id === neighborhoodId);
    if (neighborhood) {
      setSelectedNeighborhood(neighborhood);
      setDeliveryCost(neighborhood.fee);
    } else {
      setSelectedNeighborhood(null);
      setDeliveryCost(0);
    }
  };
  
  const nextStep = () => {
    if (currentStep === CheckoutStep.CART_REVIEW) {
      if (cart.items.length === 0) { toast.error("Seu carrinho está vazio."); return; }
      setCurrentStep(CheckoutStep.DELIVERY_OPTIONS);
    } else if (currentStep === CheckoutStep.DELIVERY_OPTIONS) {
      const deliveryOption = form.getValues("deliveryOption");
      if (!deliveryOption) { toast.error("Por favor, selecione uma opção de entrega."); return; }
      if (deliveryOption === "neighborhood" && !form.getValues("neighborhood")) {
        toast.error("Por favor, selecione um bairro para entrega.");
        return;
      }
      setCurrentStep(CheckoutStep.CUSTOMER_INFO);
    }
  };
  
  const prevStep = () => {
    if (currentStep === CheckoutStep.CUSTOMER_INFO) setCurrentStep(CheckoutStep.DELIVERY_OPTIONS);
    else if (currentStep === CheckoutStep.DELIVERY_OPTIONS) setCurrentStep(CheckoutStep.CART_REVIEW);
  };
  
  const generateOrderNumber = () => Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  const onSubmit = async (data: CustomerFormValues) => {
    if (isProcessingOrder) return;
    setIsProcessingOrder(true);
    try {
      if (cart.items.length === 0) { toast.error('Seu carrinho está vazio.'); setIsProcessingOrder(false); return; }
      const orderNumber = generateOrderNumber();
      let address = '';
      if (data.deliveryOption !== "pickup") {
        if (!data.street || !data.number || !data.district) { toast.error('Preencha todos os campos de endereço obrigatórios (*).'); setIsProcessingOrder(false); return; }
        address = `${data.street}, ${data.number}${data.complement ? `, ${data.complement}` : ''} - ${data.district}`;
      }
      let deliveryMethod = '';
      let deliveryOptionType: Order['deliveryOption']['type'] = 'pickup';
      let neighborhoodDetails: Order['deliveryOption']['neighborhoodIdName'] = undefined;

      if (data.deliveryOption === "pickup") { deliveryMethod = "Retirada no Local"; deliveryOptionType = "pickup"; }
      else if (data.deliveryOption === "fixedRate" && deliverySettings?.fixedRate) { deliveryMethod = `Entrega Taxa Fixa: ${formatCurrency(deliverySettings.fixedRate.fee)}`; deliveryOptionType = "fixedRate"; }
      else if (data.deliveryOption === "neighborhood" && selectedNeighborhood) { deliveryMethod = `Entrega ${selectedNeighborhood.name}: ${formatCurrency(selectedNeighborhood.fee)}`; deliveryOptionType = "neighborhood"; neighborhoodDetails = { id: selectedNeighborhood.id, name: selectedNeighborhood.name };}
      
      const orderItemsText = cart.items.map(item => `\n- ${item.quantity}x ${item.productName}${item.selectedVariations.length > 0 ? ` (${item.selectedVariations.map(v => `${v.groupName}: ${v.optionName}`).join(', ')})` : ''} - ${formatCurrency(item.totalPrice / item.quantity)} cada = ${formatCurrency(item.totalPrice)}`).join('');
      const total = calculateTotal();
      const orderForDb: Order = { id: crypto.randomUUID(), orderNumber, customer: { name: data.name, phone: data.phone, address: data.deliveryOption !== "pickup" ? { street: data.street || '', number: data.number || '', complement: data.complement, district: data.district || ''} : undefined }, items: cart.items, subtotal: cart.subtotal, deliveryOption: { type: deliveryOptionType, name: deliveryMethod, fee: deliveryCost, neighborhoodId: neighborhoodDetails?.id, neighborhoodName: neighborhoodDetails?.name }, total, notes: data.notes, status: 'new', createdAt: new Date().toISOString(), whatsappSent: false };
      let message = `*Pedido Loja ${storeSettings?.storeName || 'Gordopods'}!*\n*Pedido:* #${orderNumber}\n\n*Cliente:* ${data.name}\n*Telefone:* ${data.phone}${address ? `\n*Endereço:* ${address}` : ''}\n\n*Itens:*${orderItemsText}\n\n*Subtotal:* ${formatCurrency(cart.subtotal)}\n*Entrega:* ${formatCurrency(deliveryCost)}\n*Total:* ${formatCurrency(total)}${data.notes ? `\n\n*Obs:* ${data.notes}` : ''}`;
      const whatsappNumber = storeConfig?.whatsappNumber?.replace(/\D/g, '') || '';
      if (!whatsappNumber || whatsappNumber.length < 10) { toast.error('WhatsApp da loja não configurado.'); setIsProcessingOrder(false); return; }
      
      await saveOrderToDatabase({ ...orderForDb, whatsappSent: true }); // Marcar como enviado
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      // Ações de sucesso
      toast.success('Redirecionando para o WhatsApp...');
      setTimeout(() => {
        window.location.href = whatsappUrl;
        // Após redirecionar (ou se o usuário voltar), fechar e resetar o carrinho.
        // É melhor resetar ANTES do redirecionamento para garantir.
        closeCart(); 
        setCurrentStep(CheckoutStep.CART_REVIEW); 
        form.reset({ deliveryOption: defaultDeliveryOption, name: "", phone: "", notes: "", street: "", number: "", complement: "", district: "", neighborhood: "" });
        clearCart(); 
      }, 1000);
      
    } catch (error) { console.error('Error processing order:', error); toast.error('Erro ao processar pedido.');
    } finally { setIsProcessingOrder(false); }
  };
  
  const handleSheetOpenChange = (open: boolean) => {
    if (!open && isCartOpen) { // Apenas se estiver fechando
      setCurrentStep(CheckoutStep.CART_REVIEW);
    }
    if (isCartOpen !== open) {
        toggleCart();
    }
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 dark:bg-slate-950"> {/* MODIFICADO: p-0 e flex flex-col */}
        <SheetHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b dark:border-slate-800 shrink-0 bg-background dark:bg-slate-900 sticky top-0 z-10"> {/* Adicionado sticky, bg e z-index */}
          <SheetTitle className="flex items-center text-base sm:text-lg">
            <CartIcon className="mr-2" size={20} />
            {currentStep === CheckoutStep.CART_REVIEW && "Carrinho de Compras"}
            {currentStep === CheckoutStep.DELIVERY_OPTIONS && "Opções de Entrega"}
            {currentStep === CheckoutStep.CUSTOMER_INFO && "Seus Dados e Pagamento"}
          </SheetTitle>
          {/* O X de fechar é renderizado aqui pelo SheetContent */}
        </SheetHeader>
        
        {/* Conteúdo Principal Rolável */}
        <ScrollArea className="flex-grow"> {/* ScrollArea em volta do conteúdo dinâmico */}
          <div className="p-4 sm:p-6"> {/* Padding interno para o conteúdo */}
            {cart.items.length === 0 && currentStep === CheckoutStep.CART_REVIEW ? (
              <div className="flex flex-col items-center justify-center text-center py-12 min-h-[calc(100vh-250px)] sm:min-h-[auto]">
                  <CartIcon size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium">Seu carrinho está vazio</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Adicione produtos para continuar</p>
                  <Button className="mt-6" onClick={() => { closeCart(); setCurrentStep(CheckoutStep.CART_REVIEW); }}>Continuar Comprando</Button>
              </div>
            ) : (
              <>
                {/* CONTEÚDO DA ETAPA 1: CART_REVIEW */}
                {currentStep === CheckoutStep.CART_REVIEW && (
                  <div className="space-y-3">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex gap-3 py-3 border-b dark:border-slate-700 last:border-b-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-slate-800 rounded overflow-hidden flex-shrink-0">
                          {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" onError={(e: React.SyntheticEvent<HTMLImageElement>) => {e.currentTarget.src = "https://via.placeholder.com/100?text=Item";}}/> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sem img</div>}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <h4 className="font-medium text-sm sm:text-base truncate">{item.productName}</h4>
                          {item.selectedVariations.length > 0 && ( <div className="mt-1 space-y-0.5"> {item.selectedVariations.map((variation) => ( <div key={`${variation.groupId}-${variation.optionId}`} className="flex text-xs sm:text-sm text-gray-600 dark:text-gray-400"> <span className="shrink-0">{variation.groupName}: </span> <span className="ml-1 font-medium truncate">{variation.optionName}</span> {variation.priceModifier !== 0 && ( <span className="text-xs ml-1 whitespace-nowrap">({variation.priceModifier > 0 ? "+" : ""}{formatCurrency(variation.priceModifier)})</span> )} </div> ))} </div> )}
                          <div className="mt-auto pt-1 sm:pt-2 flex items-center justify-between">
                            <div className="font-medium text-sm sm:text-base">{formatCurrency(item.totalPrice / item.quantity)}</div>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <=1}><Minus className="h-3 w-3" /></Button>
                              <span className="w-6 sm:w-8 text-center text-sm sm:text-base">{item.quantity}</span>
                              <Button variant="outline" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 shrink-0" onClick={() => removeItem(item.id)}><Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CONTEÚDO DA ETAPA 2: DELIVERY_OPTIONS */}
                {currentStep === CheckoutStep.DELIVERY_OPTIONS && (
                  <div className="py-2 space-y-3">
                    <h3 className="text-lg font-medium mb-4">Escolha a forma de entrega</h3>
                    <RadioGroup value={form.watch("deliveryOption")} onValueChange={handleDeliveryOptionChange} className="flex flex-col gap-3">
                      {deliverySettings?.pickup?.enabled && ( <div className="flex items-start space-x-3 border dark:border-slate-700 p-3 rounded-md hover:border-primary dark:hover:border-primary transition-colors cursor-pointer" onClick={() => handleDeliveryOptionChange('pickup')}> <RadioGroupItem value="pickup" id="pickup" className="mt-1" /> <div className="w-full"> <Label htmlFor="pickup" className="font-medium cursor-pointer">Retirada no Local</Label> <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{deliverySettings.pickup.instructions}</p> <p className="text-xs sm:text-sm font-medium mt-2">R$ 0,00</p> </div> </div> )}
                      {deliverySettings?.fixedRate?.enabled && ( <div className="flex items-start space-x-3 border dark:border-slate-700 p-3 rounded-md hover:border-primary dark:hover:border-primary transition-colors cursor-pointer" onClick={() => handleDeliveryOptionChange('fixedRate')}> <RadioGroupItem value="fixedRate" id="fixedRate" className="mt-1" /> <div className="w-full"> <Label htmlFor="fixedRate" className="font-medium cursor-pointer">Entrega com Taxa Fixa</Label> <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{deliverySettings.fixedRate.description}</p> <p className="text-xs sm:text-sm font-medium mt-2">{formatCurrency(deliverySettings.fixedRate.fee)}</p> </div> </div> )}
                      {deliverySettings?.neighborhoodRates?.enabled && deliverySettings.neighborhoodRates.neighborhoods.length > 0 && ( <div className="flex items-start space-x-3 border dark:border-slate-700 p-3 rounded-md hover:border-primary dark:hover:border-primary transition-colors cursor-pointer" onClick={() => handleDeliveryOptionChange('neighborhood')}> <RadioGroupItem value="neighborhood" id="neighborhoodRadio" className="mt-1" /> <div className="w-full"> <Label htmlFor="neighborhoodRadio" className="font-medium cursor-pointer">Entrega por Bairro</Label> {form.watch("deliveryOption") === "neighborhood" && ( <div className="mt-2"> <Label htmlFor="neighborhoodSelect" className="text-xs">Selecione o bairro</Label> <select id="neighborhoodSelect" className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:border-slate-600 dark:bg-slate-800" value={form.watch("neighborhood")} onChange={(e) => handleNeighborhoodChange(e.target.value)} onClick={(e) => e.stopPropagation()} > <option value="">Selecione...</option> {deliverySettings.neighborhoodRates.neighborhoods.map((n) => ( <option key={n.id} value={n.id}>{n.name} - {formatCurrency(n.fee)}</option> ))} </select> <FormMessage>{form.formState.errors.neighborhood?.message}</FormMessage></div> )} </div> </div> )}
                    </RadioGroup>
                    <FormMessage>{form.formState.errors.deliveryOption?.message}</FormMessage>
                  </div>
                )}

                {/* CONTEÚDO DA ETAPA 3: CUSTOMER_INFO */}
                {currentStep === CheckoutStep.CUSTOMER_INFO && (
                  <div className="py-2">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3"> {/* Não precisa do onSubmit aqui, será chamado pelo botão no footer */}
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel className="text-xs sm:text-sm">Nome Completo*</FormLabel> <FormControl><Input placeholder="Digite seu nome" {...field} className="text-sm sm:text-base"/></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField control={form.control} name="phone" render={({ field: currentPhoneField }) => ( <FormItem> <FormLabel className="text-xs sm:text-sm">Telefone/WhatsApp*</FormLabel> <FormControl><Input placeholder="(XX) XXXXX-XXXX" {...currentPhoneField} value={form.watch('phone')} onChange={(e) => handlePhoneInput(e)} className="text-sm sm:text-base"/></FormControl> <FormMessage /> </FormItem> )}/>
                        {form.watch("deliveryOption") !== "pickup" && ( <div className="space-y-3 border-t dark:border-slate-700 pt-3 mt-3"> <h3 className="font-medium text-sm sm:text-base">Endereço de Entrega</h3> <FormField control={form.control} name="street" render={({ field }) => ( <FormItem> <FormLabel className="text-xs sm:text-sm">Rua/Avenida*</FormLabel> <FormControl><Input placeholder="Ex: Rua das Flores" {...field} className="text-sm sm:text-base"/></FormControl> <FormMessage /> </FormItem> )}/> <div className="grid grid-cols-2 gap-3"> <FormField control={form.control} name="number" render={({ field }) => ( <FormItem> <FormLabel className="text-xs sm:text-sm">Número*</FormLabel> <FormControl><Input placeholder="Ex: 123" {...field} className="text-sm sm:text-base"/></FormControl> <FormMessage /> </FormItem> )}/> <FormField control={form.control} name="complement" render={({ field }) => ( <FormItem> <FormLabel className="text-xs sm:text-sm">Complemento</FormLabel> <FormControl><Input placeholder="Ex: Apto 101" {...field} className="text-sm sm:text-base"/></FormControl> <FormMessage /> </FormItem> )}/> </div> <FormField control={form.control} name="district" render={({ field }) => ( <FormItem> <FormLabel className="text-xs sm:text-sm">Bairro*</FormLabel> <FormControl><Input placeholder="Ex: Centro" {...field} className="text-sm sm:text-base"/></FormControl> <FormMessage /> </FormItem> )}/> </div> )}
                         {/* O botão de submit foi movido para o footer global */}
                      </form>
                    </Form>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer Fixo com Ações e Resumo */}
        {cart.items.length > 0 && (
          <div className="p-4 sm:p-6 border-t dark:border-slate-700 shrink-0 bg-background dark:bg-slate-900 space-y-3">
            {/* Resumo Financeiro */}
            <div className="text-xs sm:text-sm space-y-1">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(cart.subtotal)}</span>
                </div>
                {(currentStep === CheckoutStep.DELIVERY_OPTIONS || currentStep === CheckoutStep.CUSTOMER_INFO) && (
                    <div className="flex justify-between">
                        <span>Entrega:</span>
                        <span className="font-medium">{formatCurrency(deliveryCost)}</span>
                    </div>
                )}
                {(currentStep === CheckoutStep.DELIVERY_OPTIONS || currentStep === CheckoutStep.CUSTOMER_INFO) && (
                    <div className="flex justify-between font-semibold text-sm sm:text-base mt-1">
                        <span>Total:</span>
                        <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                )}
            </div>

            {currentStep === CheckoutStep.CART_REVIEW && (
              <Textarea 
                placeholder="Observações sobre o pedido..." 
                className="text-sm"
                rows={2}
                {...form.register("notes")} // Registrar com react-hook-form
              />
            )}

            {/* Botões Condicionais por Etapa */}
            <div className="flex flex-col sm:flex-row gap-2">
              {currentStep === CheckoutStep.CART_REVIEW && (
                <>
                  <Button variant="outline" className="w-full order-2 sm:order-1" onClick={() => { closeCart(); setCurrentStep(CheckoutStep.CART_REVIEW); }}>
                    Continuar Comprando
                  </Button>
                  <Button className="w-full order-1 sm:order-2" onClick={nextStep} style={{backgroundColor: 'var(--primary-color)', color: 'white'}}>
                    Opções de Entrega <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
              {currentStep === CheckoutStep.DELIVERY_OPTIONS && (
                <>
                  <Button variant="outline" onClick={prevStep} className="w-full sm:flex-1">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Voltar Itens
                  </Button>
                  <Button 
                    onClick={nextStep} 
                    className="w-full sm:flex-1"
                    style={{backgroundColor: 'var(--primary-color)', color: 'white'}}
                    disabled={form.watch("deliveryOption") === "neighborhood" && !form.watch("neighborhood")}
                  >
                    Dados Pessoais <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
              {currentStep === CheckoutStep.CUSTOMER_INFO && (
                <>
                  <Button variant="outline" type="button" onClick={prevStep} className="w-full sm:flex-1">
                     <ChevronLeft className="mr-1 h-4 w-4" /> Voltar Entrega
                  </Button>
                  <Button 
                    type="button" 
                    onClick={form.handleSubmit(onSubmit)} // Aciona a submissão do formulário
                    className="w-full sm:flex-1"
                    style={{backgroundColor: 'var(--primary-color)', color: 'white'}}
                    disabled={isProcessingOrder || (form.formState.isSubmitted && !form.formState.isValid)}
                  >
                    {isProcessingOrder ? 
                        <span className="animate-pulse">Processando...</span> : 
                        <>Finalizar Pedido <Send className="ml-2 h-4 w-4" /></>
                    }
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ShoppingCart;