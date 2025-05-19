
/**
 * Formata um valor para o formato de moeda brasileiro
 * @param value Valor a ser formatado
 * @returns String formatada (ex: R$ 10,50)
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/**
 * Formata um número de telefone para o formato brasileiro
 * @param phone Número de telefone (apenas dígitos)
 * @returns String formatada (ex: (11) 98765-4321)
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}
