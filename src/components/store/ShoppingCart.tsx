import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart as CartIcon, Plus, Minus, Trash2, Send } from "lucide-react"; // Removido ArrowRight e ChevronLeft
import { useCart } from "@/contexts/CartContext";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; // Adicionado FormDescription
import { useForm, Controller } from "react-hook-form"; // Adicionado Controller
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Neighborhood, Order } from "@/types";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format";

// Schema ÚNICO para todos os campos, endereço se torna opcional no schema base
const checkoutFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  phone: z.string()
    .min(14, { message: "Telefone inválido. Use (XX) XXXXX-XXXX" })
    .max(15, { message: "Telefone inválido." })
    .refine((val) => /^\(\d{2}\) \d{5}-\d{4}$/.test(val), {
      message: "Formato inválido. Use (XX) XXXXX-XXXX",
    }),
  deliveryOption: z.string({ required_error: "Selecione uma opção de entrega." }).min(1,"Selecione uma opção de entrega."),
  neighborhood: z.string().optional(), // ID do bairro
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  district: z.string().optional(), // Bairro (texto) para endereço
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

const ShoppingCart = () => {
  const { cart, isCartOpen, toggleCart, closeCart, updateQuantity, removeItem, saveOrderToDatabase, clearCart } = useCart();
  const { deliverySettings, storeConfig, storeSettings } = useStoreSettings();
  
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [selectedNeighborhoodInfo, setSelectedNeighborhoodInfo] = useState<Neighborhood | null>(null); // Para guardar o objeto Neighborhood

  const defaultDeliveryOption = 
    deliverySettings?.pickup?.enabled ? "pickup" : 
    deliverySettings?.fixedRate?.enabled ? "fixedRate" : 
    deliverySettings?.neighborhoodRates?.enabled ? "neighborhood" : "";

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { name: "", phone: "", deliveryOption: defaultDeliveryOption, notes: "", street: "", number: "", complement: "", district: "", neighborhood: "" },
    mode: "onChange", // Valida ao mudar
  });

  const watchedDeliveryOption = form.watch("deliveryOption");

  // Atualiza o custo de entrega quando a opção ou bairro muda
  useEffect(() => {
    let cost = 0;
    if (watchedDeliveryOption === "fixedRate" && deliverySettings?.fixedRate?.enabled) {
      cost = deliverySettings.fixedRate.fee;
    } else if (watchedDeliveryOption === "neighborhood") {
      const neighborhoodId = form.getValues("neighborhood");
      if (neighborhoodId && deliverySettings?.neighborhoodRates?.neighborhoods) {
        const neighborhood = deliverySettings.neighborhoodRates.neighborhoods.find(n => n.id === neighborhoodId);
        if (neighborhood) {
          cost = neighborhood.fee;
          setSelectedNeighborhoodInfo(neighborhood);
        } else {
          setSelectedNeighborhoodInfo(null);
        }
      } else {
        setSelectedNeighborhoodInfo(null); // Nenhum bairro selecionado
      }
    } else { // Pickup ou nenhuma opção válida
      setSelectedNeighborhoodInfo(null);
    }
    setDeliveryCost(cost);
  }, [watchedDeliveryOption, form, deliverySettings, setSelectedNeighborhoodInfo]);

  // Reset form e estado do carrinho ao abrir/fechar
  useEffect(() => {
    if (isCartOpen) {
      const newDefaultDeliveryOption = 
        deliverySettings?.pickup?.enabled ? "pickup" : 
        deliverySettings?.fixedRate?.enabled ? "fixedRate" : 
        deliverySettings?.neighborhoodRates?.enabled ? "neighborhood" : "";
      form.reset({ 
        name: "", phone: "", 
        deliveryOption: newDefaultDeliveryOption, 
        notes: "", street: "", number: "", complement: "", district: "", neighborhood: "" 
      });
      handleDeliveryOptionChange(newDefaultDeliveryOption); // Recalcula custo
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCartOpen, deliverySettings, form.reset]);


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
  const generateOrderNumber = () => Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  const onSubmit = async (data: CheckoutFormValues) => {
    if (isProcessingOrder) return;
    setIsProcessingOrder(true);
    try {
      if (cart.items.length === 0) { toast.error('Seu carrinho está vazio.'); setIsProcessingOrder(false); return; }
      
      // Validação condicional do endereço
      if (data.deliveryOption !== "pickup") {
        if (!data.street || !data.number || !data.district) {
          toast.error('Para entrega, preencha Rua, Número e Bairro.');
          form.setError("street", { type: "manual", message: !data.street ? "Campo obrigatório" : "" });
          form.setError("number", { type: "manual", message: !data.number ? "Campo obrigatório" : "" });
          form.setError("district", { type: "manual", message: !data.district ? "Campo obrigatório" : "" });
          setIsProcessingOrder(false);
          return;
        }
        if (data.deliveryOption === "neighborhood" && !data.neighborhood) {
            toast.error("Selecione um bairro para entrega.");
            form.setError("neighborhood", {type: "manual", message: "Selecione um bairro"});
            setIsProcessingOrder(false);
            return;
        }
      }

      const orderNumber = generateOrderNumber();
      const address = data.deliveryOption !== "pickup" ? `${data.street}, ${data.number}${data.complement ? `, ${data.complement}` : ''} - ${data.district}` : '';
      
      let deliveryMethod = '';
      let deliveryOptionType: Order['deliveryOption']['type'] = 'pickup';
      let neighborhoodDBInfo: Order['deliveryOption']['neighborhoodIdName'] = undefined;

      if (data.deliveryOption === "pickup") { deliveryMethod = "Retirada no Local"; deliveryOptionType = "pickup"; }
      else if (data.deliveryOption === "fixedRate" && deliverySettings?.fixedRate) { deliveryMethod = `Entrega Taxa Fixa: ${formatCurrency(deliverySettings.fixedRate.fee)}`; deliveryOptionType = "fixedRate"; }
      else if (data.deliveryOption === "neighborhood" && selectedNeighborhoodInfo) { deliveryMethod = `Entrega ${selectedNeighborhoodInfo.name}: ${formatCurrency(selectedNeighborhoodInfo.fee)}`; deliveryOptionType = "neighborhood"; neighborhoodDBInfo = { id: selectedNeighborhoodInfo.id, name: selectedNeighborhoodInfo.name };}
      else if (data.deliveryOption === "neighborhood" && !selectedNeighborhoodInfo) {
          toast.error("Bairro selecionado para entrega é inválido."); // Fallback
          setIsProcessingOrder(false);
          return;
      }


      const orderItemsText = cart.items.map(item => `\n- ${item.quantity}x ${item.productName}${item.selectedVariations.length > 0 ? ` (${item.selectedVariations.map(v => `${v.groupName}: ${v.optionName}`).join(', ')})` : ''} - ${formatCurrency(item.totalPrice / item.quantity)} cada = ${formatCurrency(item.totalPrice)}`).join('');
      const total = calculateTotal();
      const orderForDb: Order = { id: crypto.randomUUID(), orderNumber, customer: { name: data.name, phone: data.phone, address: data.deliveryOption !== "pickup" ? { street: data.street || '', number: data.number || '', complement: data.complement, district: data.district || ''} : undefined }, items: cart.items, subtotal: cart.subtotal, deliveryOption: { type: deliveryOptionType, name: deliveryMethod, fee: deliveryCost, neighborhoodId: neighborhoodDBInfo?.id, neighborhoodName: neighborhoodDBInfo?.name }, total, notes: data.notes, status: 'new', createdAt: new Date().toISOString(), whatsappSent: false };
      let message = `*Pedido Loja ${storeSettings?.storeName || 'Gordopods'}!*\n*Pedido:* #${orderNumber}\n\n*Cliente:* ${data.name}\n*Telefone:* ${data.phone}${address ? `\n*Endereço:* ${address}` : ''}\n\n*Itens:*${orderItemsText}\n\n*Subtotal:* ${formatCurrency(cart.subtotal)}\n*Entrega (${deliveryMethod.split(':')[0]}):* ${formatCurrency(deliveryCost)}\n*Total:* ${formatCurrency(total)}${data.notes ? `\n\n*Obs:* ${data.notes}` : ''}`;
      const whatsappNumber = storeConfig?.whatsappNumber?.replace(/\D/g, '') || '';
      if (!whatsappNumber || whatsappNumber.length < 10) { toast.error('WhatsApp da loja não configurado.'); setIsProcessingOrder(false); return; }
      
      await saveOrderToDatabase({ ...orderForDb, whatsappSent: true });
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      toast.success('Redirecionando para o WhatsApp...');
      setTimeout(() => {
        window.location.href = whatsappUrl;
        closeCart(); 
        form.reset({ deliveryOption: defaultDeliveryOption, name: "", phone: "", notes: "", street: "", number: "", complement: "", district: "", neighborhood: "" });
        clearCart();
      }, 1000);
      
    } catch (error) { console.error('Error processing order:', error); toast.error('Erro ao processar pedido.');
    } finally { setIsProcessingOrder(false); }
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={toggleCart}> {/* toggleCart lida com o estado de abertura */}
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 dark:bg-slate-950">
        <SheetHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b dark:border-slate-800 shrink-0 bg-background dark:bg-slate-900 sticky top-0 z-10">
          <SheetTitle className="flex items-center text-base sm:text-lg">
            <CartIcon className="mr-2" size={20} />
            Carrinho de Compras
          </SheetTitle>
        </SheetHeader>
        
        {/* Área Principal: Itens e Formulário (Rolável) */}
        <ScrollArea className="flex-grow">
          <div className="p-4 sm:p-6 space-y-4">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-12 min-h-[calc(100vh-250px)] sm:min-h-[auto]">
                <CartIcon size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium">Seu carrinho está vazio</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Adicione produtos para continuar</p>
                <Button className="mt-6" onClick={closeCart}>Continuar Comprando</Button>
              </div>
            ) : (
              <>
                {/* Lista de Itens do Carrinho */}
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3 py-3 border-b dark:border-slate-700 last:border-b-0">
                      {/* ... (JSX do item do carrinho como antes - omitido para brevidade) ... */}
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

                {/* Observações */}
                <Textarea 
                  placeholder="Observações sobre o pedido..." 
                  className="text-sm"
                  rows={2}
                  {...form.register("notes")}
                />

                {/* Formulário Integrado (Dados do Cliente, Entrega, Endereço) */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"> {/* onSubmit é do form, botão chamará form.handleSubmit */}
                    
                    {/* Dados do Cliente */}
                    <div className="border-t dark:border-slate-700 pt-4">
                        <h3 className="text-md font-semibold mb-2">Seus Dados</h3>
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel className="text-xs sm:text-sm">Nome Completo*</FormLabel> <FormControl><Input placeholder="Seu nome" {...field} className="text-sm"/></FormControl> <FormMessage /> </FormItem> )}/>
                        <div className="mt-3"> {/* Espaçamento para o telefone */}
                            <FormField control={form.control} name="phone" render={({ field: currentPhoneField }) => ( <FormItem> <FormLabel className="text-xs sm:text-sm">Telefone/WhatsApp*</FormLabel> <FormControl><Input placeholder="(XX) XXXXX-XXXX" {...currentPhoneField} value={form.watch('phone')} onChange={(e) => handlePhoneInput(e)} className="text-sm"/></FormControl> <FormMessage /> </FormItem> )}/>
                        </div>
                    </div>

                    {/* Opções de Entrega */}
                    <div className="border-t dark:border-slate-700 pt-4">
                        <h3 className="text-md font-semibold mb-2">Opções de Entrega</h3>
                        <FormField
                            control={form.control}
                            name="deliveryOption"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                <RadioGroup onValueChange={(value) => {field.onChange(value); handleDeliveryOptionChange(value);}} defaultValue={field.value} className="flex flex-col gap-2">
                                    {deliverySettings?.pickup?.enabled && ( <FormItem className="flex items-start space-x-3 border dark:border-slate-700 p-3 rounded-md hover:border-primary dark:hover:border-primary transition-colors cursor-pointer" onClick={() => form.setValue("deliveryOption", "pickup", { shouldValidate: true })}> <FormControl><RadioGroupItem value="pickup" /></FormControl> <div className="w-full grid gap-0.5"> <FormLabel className="font-medium cursor-pointer">Retirada no Local</FormLabel> <FormDescription className="text-xs">{deliverySettings.pickup.instructions}</FormDescription> <p className="text-xs sm:text-sm font-medium">R$ 0,00</p></div> </FormItem> )}
                                    {deliverySettings?.fixedRate?.enabled && ( <FormItem className="flex items-start space-x-3 border dark:border-slate-700 p-3 rounded-md hover:border-primary dark:hover:border-primary transition-colors cursor-pointer" onClick={() => form.setValue("deliveryOption", "fixedRate", { shouldValidate: true })}> <FormControl><RadioGroupItem value="fixedRate" /></FormControl> <div className="w-full grid gap-0.5"> <FormLabel className="font-medium cursor-pointer">Entrega com Taxa Fixa</FormLabel> <FormDescription className="text-xs">{deliverySettings.fixedRate.description}</FormDescription> <p className="text-xs sm:text-sm font-medium">{formatCurrency(deliverySettings.fixedRate.fee)}</p> </div> </FormItem> )}
                                    {deliverySettings?.neighborhoodRates?.enabled && deliverySettings.neighborhoodRates.neighborhoods.length > 0 && ( <FormItem className="flex items-start space-x-3 border dark:border-slate-700 p-3 rounded-md hover:border-primary dark:hover:border-primary transition-colors cursor-pointer" onClick={() => form.setValue("deliveryOption", "neighborhood", { shouldValidate: true })}> <FormControl><RadioGroupItem value="neighborhood" /></FormControl> <div className="w-full grid gap-0.5"> <FormLabel className="font-medium cursor-pointer">Entrega por Bairro</FormLabel> {form.watch("deliveryOption") === "neighborhood" && ( <div className="mt-1"> <Label htmlFor="neighborhoodSelectCart" className="text-xs">Selecione o bairro</Label> <select id="neighborhoodSelectCart" className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:border-slate-600 dark:bg-slate-800" {...form.register("neighborhood")} onChange={(e) => handleNeighborhoodChange(e.target.value)} onClick={(e) => e.stopPropagation()} > <option value="">Selecione...</option> {deliverySettings.neighborhoodRates.neighborhoods.map((n) => ( <option key={n.id} value={n.id}>{n.name} - {formatCurrency(n.fee)}</option> ))} </select> <FormMessage>{form.formState.errors.neighborhood?.message}</FormMessage></div> )} </div> </FormItem> )}
                                </RadioGroup>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Endereço (Condicional) */}
                    {form.watch("deliveryOption") && form.watch("deliveryOption") !== "pickup" && (
                      <div className="space-y-3 border-t dark:border-slate-700 pt-4">
                        <h3 className="text-md font-semibold">Endereço de Entrega</h3>
                        <FormField control={form.control} name="street" render={({ field }) => ( <FormItem> <FormLabel className="text-xs sm:text-sm">Rua/Avenida*</FormLabel> <FormControl><Input placeholder="Ex: Rua das Flores" {...field} className="text-sm"/></FormControl> <FormMessage /> </FormItem> )}/>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="number" render={({ field }) => ( <FormItem> <FormLabel className="text-xs sm:text-sm">Número*</FormLabel> <FormControl><Input placeholder="Ex: 123" {...field} className="text-sm"/></FormControl> <FormMessage /> </FormItem> )}/>
                          <FormField control={form.control} name="complement" render={({ field }) => ( <FormItem> <FormLabel className="text-xs sm:text-sm">Complemento</FormLabel> <FormControl><Input placeholder="Ex: Apto 101" {...field} className="text-sm"/></FormControl> <FormMessage /> </FormItem> )}/>
                        </div>
                        <FormField control={form.control} name="district" render={({ field }) => ( <FormItem> <FormLabel className="text-xs sm:text-sm">Bairro*</FormLabel> <FormControl><Input placeholder="Ex: Centro" {...field} className="text-sm"/></FormControl> <FormMessage /> </FormItem> )}/>
                      </div>
                    )}
                  </form>
                </Form>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer Fixo com Ações e Resumo */}
        {cart.items.length > 0 && (
          <div className="p-4 sm:p-6 border-t dark:border-slate-800 shrink-0 bg-background dark:bg-slate-900 space-y-3">
            <div className="text-xs sm:text-sm space-y-1">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(cart.subtotal)}</span>
                </div>
                {form.watch("deliveryOption") !== "pickup" && deliveryCost > 0 && ( // Mostrar apenas se houver custo de entrega
                    <div className="flex justify-between">
                        <span>Entrega:</span>
                        <span className="font-medium">{formatCurrency(deliveryCost)}</span>
                    </div>
                )}
                 {form.watch("deliveryOption") === "pickup" && (
                     <div className="flex justify-between">
                        <span>Entrega:</span>
                        <span className="font-medium">Retirada (R$ 0,00)</span>
                    </div>
                 )}
                <div className="flex justify-between font-semibold text-sm sm:text-base mt-1">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="w-full order-2 sm:order-1" onClick={closeCart}>
                Continuar Comprando
              </Button>
              <Button 
                type="button" // O submit é acionado pelo form.handleSubmit
                onClick={form.handleSubmit(onSubmit)}
                className="w-full order-1 sm:order-2 text-white" // Adicionado text-white
                style={{backgroundColor: 'var(--secondary-color)'}} // Cor secundária da loja
                disabled={isProcessingOrder || (form.formState.isSubmitted && !form.formState.isValid) || cart.items.length === 0}
              >
                {isProcessingOrder ? 
                    <span className="animate-pulse">Enviando...</span> : 
                    <>Enviar Pedido no WhatsApp <Send className="ml-2 h-4 w-4" /></>
                }
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ShoppingCart;