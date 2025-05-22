import React, { useState, useEffect, useCallback } from 'react'; // Adicionado useCallback
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart as CartIcon, Plus, Minus, Trash2, Send, ChevronLeft, ArrowRight } from "lucide-react"; // Adicionados ícones
import { useCart } from "@/contexts/CartContext";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form"; // Controller não é mais necessário com FormField
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Neighborhood, Order } from "@/types"; // Certifique-se que Order e suas sub-tipagens estão corretas
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format";

const checkoutFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  phone: z.string()
    .min(14, { message: "Telefone inválido. Use (XX) XXXXX-XXXX" })
    .max(15, { message: "Telefone inválido." })
    .refine((val) => /^\(\d{2}\) \d{5}-\d{4}$/.test(val), { // Regex corrigido para incluir parênteses
      message: "Formato inválido. Use (XX) XXXXX-XXXX",
    }),
  deliveryOption: z.string({ required_error: "Selecione uma opção de entrega." }).min(1,"Selecione uma opção de entrega."),
  neighborhood: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  district: z.string().optional(),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

const ShoppingCart = () => {
  const { cart, isCartOpen, toggleCart, closeCart, updateQuantity, removeItem, saveOrderToDatabase, clearCart } = useCart();
  // CORRIGIDO: Acessar deliverySettings de storeSettings
  const { storeSettings, storeConfig } = useStoreSettings();
  const deliverySettings = storeSettings.delivery_settings; 
  
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [selectedNeighborhoodInfo, setSelectedNeighborhoodInfo] = useState<Neighborhood | null>(null);

  const defaultDeliveryOption = 
    deliverySettings?.pickup?.enabled ? "pickup" : 
    deliverySettings?.fixedRate?.enabled ? "fixedRate" : 
    deliverySettings?.neighborhoodRates?.enabled ? "neighborhood" : "";

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { name: "", phone: "", deliveryOption: defaultDeliveryOption, notes: "", street: "", number: "", complement: "", district: "", neighborhood: "" },
    mode: "onChange",
  });

  const watchedDeliveryOption = form.watch("deliveryOption");
  const watchedNeighborhood = form.watch("neighborhood"); // Para observar mudanças no bairro

  // CORRIGIDO: handleDeliveryOptionChange e handleNeighborhoodChange com useCallback e dependências corretas
  const handleDeliveryOptionChange = useCallback((value: string) => {
    form.setValue("deliveryOption", value, { shouldValidate: true });
    let cost = 0;
    if (value === "fixedRate" && deliverySettings?.fixedRate?.enabled) {
      cost = deliverySettings.fixedRate.fee;
    } else if (value === "neighborhood") {
      const currentNeighborhoodId = form.getValues("neighborhood"); // Pega o valor atual do bairro
      if (currentNeighborhoodId && deliverySettings?.neighborhoodRates?.neighborhoods) {
        const neighborhood = deliverySettings.neighborhoodRates.neighborhoods.find(n => n.id === currentNeighborhoodId);
        if (neighborhood) {
            cost = neighborhood.fee;
            setSelectedNeighborhoodInfo(neighborhood);
        } else {
            setSelectedNeighborhoodInfo(null); // Bairro não encontrado ou inválido
        }
      } else {
        setSelectedNeighborhoodInfo(null); // Nenhum bairro selecionado para a opção "neighborhood"
        cost = 0; // Custo é zero até um bairro ser selecionado
      }
    } else { // Pickup
      setSelectedNeighborhoodInfo(null);
    }
    setDeliveryCost(cost);
    if (value !== "neighborhood") {
      form.setValue("neighborhood", "", { shouldValidate: true }); // Limpa o bairro se a opção não for "neighborhood"
    }
  }, [form, deliverySettings]); // Removido setSelectedNeighborhoodInfo, pois é estado local


  const handleNeighborhoodChange = useCallback((neighborhoodId: string) => {
    form.setValue("neighborhood", neighborhoodId, { shouldValidate: true }); // Atualiza o valor no form
    if (!deliverySettings?.neighborhoodRates?.neighborhoods) return;
    const neighborhood = deliverySettings.neighborhoodRates.neighborhoods.find(n => n.id === neighborhoodId);
    if (neighborhood) {
      setSelectedNeighborhoodInfo(neighborhood);
      setDeliveryCost(neighborhood.fee);
    } else {
      setSelectedNeighborhoodInfo(null);
      setDeliveryCost(0); // Reseta custo se nenhum bairro válido for selecionado
    }
  }, [form, deliverySettings]); // Removido setSelectedNeighborhoodInfo e setDeliveryCost da lista de dependências


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
      if (newDefaultDeliveryOption) {
          handleDeliveryOptionChange(newDefaultDeliveryOption);
      } else {
          setDeliveryCost(0);
      }
    }
  }, [isCartOpen, deliverySettings, form, handleDeliveryOptionChange]); // form.reset removido, pois ele próprio não deve ser dependência
                                                                   // handleDeliveryOptionChange adicionado

  const formatPhoneNumber = (value: string): string => {
    let v = value.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    let formatted = "";
    if (v.length > 0) formatted = `(${v.slice(0, 2)}`;
    if (v.length > 2) formatted += `) ${v.slice(2, 7)}`;
    if (v.length > 7) formatted += `-${v.slice(7, 11)}`;
    return formatted;
  };
  
  const calculateTotal = () => cart.subtotal + deliveryCost;
  const generateOrderNumber = () => Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  const onSubmit = async (data: CheckoutFormValues) => {
    // ... (Sua lógica onSubmit como antes)
    if (isProcessingOrder) return;
    setIsProcessingOrder(true);
    try {
      if (cart.items.length === 0) { toast.error('Seu carrinho está vazio.'); setIsProcessingOrder(false); return; }
      if (data.deliveryOption !== "pickup") {
        let addressError = false;
        if (!data.street) { form.setError("street", { type: "manual", message: "Rua é obrigatória." }); addressError = true; }
        if (!data.number) { form.setError("number", { type: "manual", message: "Número é obrigatório." }); addressError = true; }
        if (!data.district) { form.setError("district", { type: "manual", message: "Bairro (endereço) é obrigatório." }); addressError = true; }
        if (data.deliveryOption === "neighborhood" && !data.neighborhood) { form.setError("neighborhood", {type: "manual", message: "Selecione um bairro para entrega."}); addressError = true; }
        if (addressError) { toast.error('Preencha os campos de endereço obrigatórios.'); setIsProcessingOrder(false); return; }
      }

      const orderNumber = generateOrderNumber();
      const address = data.deliveryOption !== "pickup" ? `${data.street}, ${data.number}${data.complement ? `, ${data.complement}` : ''} - ${data.district}` : '';
      let deliveryMethod = '';
      let deliveryOptionType: Order['deliveryOption']['type'] = 'pickup';
      // CORRIGIDO: Uso de selectedNeighborhoodInfo
      let neighborhoodDBInfo: Pick<Neighborhood, 'id' | 'name'> | undefined = undefined; 
      if (data.deliveryOption === "pickup") { deliveryMethod = "Retirada no Local"; deliveryOptionType = "pickup"; }
      else if (data.deliveryOption === "fixedRate" && deliverySettings?.fixedRate) { deliveryMethod = `Entrega Taxa Fixa: ${formatCurrency(deliverySettings.fixedRate.fee)}`; deliveryOptionType = "fixedRate"; }
      else if (data.deliveryOption === "neighborhood" && selectedNeighborhoodInfo) { deliveryMethod = `Entrega ${selectedNeighborhoodInfo.name}: ${formatCurrency(selectedNeighborhoodInfo.fee)}`; deliveryOptionType = "neighborhood"; neighborhoodDBInfo = { id: selectedNeighborhoodInfo.id, name: selectedNeighborhoodInfo.name };}
      else if (data.deliveryOption === "neighborhood" && !selectedNeighborhoodInfo && data.neighborhood) {
          toast.error("Bairro selecionado para entrega é inválido ou não encontrado.");
          setIsProcessingOrder(false);
          return;
      }

      const orderItemsText = cart.items.map(item => `\n- ${item.quantity}x ${item.productName}${item.selectedVariations.length > 0 ? ` (${item.selectedVariations.map(v => `${v.groupName}: ${v.optionName}`).join(', ')})` : ''} - ${formatCurrency(item.totalPrice / item.quantity)} cada = ${formatCurrency(item.totalPrice)}`).join('');
      const total = calculateTotal();
      // CORRIGIDO: Tipagem de orderForDb.deliveryOption para corresponder a OrderDeliveryOption (que deve ter neighborhoodId e neighborhoodName opcionais)
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
  
  const handleSheetOpenChange = (open: boolean) => {
    if (!open && isCartOpen) { 
      // Manter o estado atual do formulário se o usuário apenas fechar
      // O reset agora ocorre no useEffect quando isCartOpen se torna true
    }
    if (isCartOpen !== open) {
        toggleCart();
    }
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 dark:bg-slate-950">
        <SheetHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b dark:border-slate-800 shrink-0 bg-background dark:bg-slate-900 sticky top-0 z-10">
          <SheetTitle className="flex items-center text-base sm:text-lg">
            <CartIcon className="mr-2" size={20} />
            Carrinho de Compras e Checkout
          </SheetTitle>
        </SheetHeader>
        
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

                {/* Formulário Integrado */}
                <Form {...form}>
                  <form className="space-y-4" noValidate> {/* Adicionado noValidate para deixar a validação apenas com Zod/RHF */}
                    <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel className="text-xs sm:text-sm">Observações</FormLabel><FormControl><Textarea placeholder="Alguma observação para o pedido?" className="text-sm" rows={2} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    
                    <div className="border-t dark:border-slate-700 pt-4">
                        <h3 className="text-md font-semibold mb-2">Seus Dados</h3>
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel className="text-xs sm:text-sm">Nome Completo*</FormLabel> <FormControl><Input placeholder="Seu nome" {...field} className="text-sm"/></FormControl> <FormMessage /> </FormItem> )}/>
                        <div className="mt-3">
                            {/* CORRIGIDO: Uso de FormField para o telefone */}
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs sm:text-sm">Telefone/WhatsApp*</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="(XX) XXXXX-XXXX" 
                                                {...field} // Espalha as props do field do Controller/FormField
                                                onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))} // Usa formatPhoneNumber
                                                className="text-sm"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="border-t dark:border-slate-700 pt-4">
                        <h3 className="text-md font-semibold mb-2">Opções de Entrega</h3>
                        <FormField control={form.control} name="deliveryOption" render={({ field }) => (
                            <FormItem className="space-y-2">
                                <RadioGroup onValueChange={(value) => {field.onChange(value); handleDeliveryOptionChange(value);}} value={field.value || ""} className="flex flex-col gap-2"> {/* Adicionado value || "" */}
                                    {deliverySettings?.pickup?.enabled && ( <FormItem className="flex items-start space-x-3 border dark:border-slate-700 p-3 rounded-md hover:border-primary dark:hover:border-primary transition-colors cursor-pointer" onClick={() => {form.setValue("deliveryOption", "pickup", { shouldValidate: true }); handleDeliveryOptionChange("pickup");}}> <FormControl><RadioGroupItem value="pickup" /></FormControl> <div className="w-full grid gap-0.5"> <FormLabel className="font-medium cursor-pointer">Retirada no Local</FormLabel> <FormDescription className="text-xs">{deliverySettings.pickup.instructions}</FormDescription> <p className="text-xs sm:text-sm font-medium">R$ 0,00</p></div> </FormItem> )}
                                    {deliverySettings?.fixedRate?.enabled && ( <FormItem className="flex items-start space-x-3 border dark:border-slate-700 p-3 rounded-md hover:border-primary dark:hover:border-primary transition-colors cursor-pointer" onClick={() => {form.setValue("deliveryOption", "fixedRate", { shouldValidate: true }); handleDeliveryOptionChange("fixedRate");}}> <FormControl><RadioGroupItem value="fixedRate" /></FormControl> <div className="w-full grid gap-0.5"> <FormLabel className="font-medium cursor-pointer">Entrega com Taxa Fixa</FormLabel> <FormDescription className="text-xs">{deliverySettings.fixedRate.description}</FormDescription> <p className="text-xs sm:text-sm font-medium">{formatCurrency(deliverySettings.fixedRate.fee)}</p> </div> </FormItem> )}
                                    {deliverySettings?.neighborhoodRates?.enabled && deliverySettings.neighborhoodRates.neighborhoods.length > 0 && ( <FormItem className="flex items-start space-x-3 border dark:border-slate-700 p-3 rounded-md hover:border-primary dark:hover:border-primary transition-colors cursor-pointer" onClick={() => {form.setValue("deliveryOption", "neighborhood", { shouldValidate: true }); handleDeliveryOptionChange("neighborhood");}}> <FormControl><RadioGroupItem value="neighborhood" /></FormControl> <div className="w-full grid gap-0.5"> <FormLabel className="font-medium cursor-pointer">Entrega por Bairro</FormLabel> {form.watch("deliveryOption") === "neighborhood" && ( <div className="mt-1"> <Label htmlFor="neighborhoodSelectCart" className="text-xs">Selecione o bairro</Label> <select id="neighborhoodSelectCart" className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:border-slate-600 dark:bg-slate-800" {...form.register("neighborhood")} onChange={(e) => handleNeighborhoodChange(e.target.value)} onClick={(e) => e.stopPropagation()} > <option value="">Selecione...</option> {deliverySettings.neighborhoodRates.neighborhoods.map((n) => ( <option key={n.id} value={n.id}>{n.name} - {formatCurrency(n.fee)}</option> ))} </select> <FormMessage>{form.formState.errors.neighborhood?.message}</FormMessage></div> )} </div> </FormItem> )}
                                </RadioGroup>
                                <FormMessage>{form.formState.errors.deliveryOption?.message}</FormMessage>
                                </FormItem>
                            )}
                        />
                    </div>

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
                    {/* O botão de submit está no footer global */}
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
                {form.watch("deliveryOption") !== "pickup" && deliveryCost >= 0 && ( // >=0 para mostrar mesmo se for 0 e não pickup
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
                type="button" 
                onClick={form.handleSubmit(onSubmit)}
                className="w-full order-1 sm:order-2 text-white" 
                style={{backgroundColor: 'var(--secondary-color)'}} 
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