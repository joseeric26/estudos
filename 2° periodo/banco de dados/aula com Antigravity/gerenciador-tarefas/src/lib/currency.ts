/**
 * Módulo de utilitários monetários para garantir precisão centesimal (integer cents).
 * Evita problemas de arredondamento inerentes a ponto flutuante em operações financeiras.
 */

/**
 * Converte centavos inteiros para string formatada em Real (BRL).
 * Exemplo: 125000 -> "R$ 1.250,00"
 */
export function centsToBRL(cents: number | undefined | null): string {
  if (typeof cents !== 'number' || isNaN(cents)) {
    cents = 0;
  }
  const reais = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reais);
}

/**
 * Converte centavos para formato numérico simples em string (ex: "1250,00" ou "50,00")
 * Ideal para preencher inputs controlados.
 */
export function centsToDecimalString(cents: number | undefined | null): string {
  if (typeof cents !== 'number' || isNaN(cents)) {
    return '0,00';
  }
  return (cents / 100).toFixed(2).replace('.', ',');
}

/**
 * Converte uma entrada em string (ex: "50,00", "50.00", "1.250,50") ou número para centavos inteiros.
 * Retorna número inteiro não-negativo.
 */
export function parseBRLToCents(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') {
    if (isNaN(value) || value < 0) return 0;
    return Math.round(value * 100);
  }

  const str = String(value).trim();
  if (!str) return 0;

  // Remove caracteres que não sejam dígitos, vírgula ou ponto
  const cleaned = str.replace(/[^\d.,]/g, '');

  // Detecta formato brasileiro (ex: 1.250,50 ou 50,00)
  let normalized = cleaned;
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // 1.250,50 -> remove ponto dos milhares e troca vírgula por ponto
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    // 50,00 -> 50.00
    normalized = cleaned.replace(',', '.');
  }

  const parsed = parseFloat(normalized);
  if (isNaN(parsed) || parsed < 0) return 0;

  return Math.round(parsed * 100);
}

/**
 * Formata um valor de entrada em tempo real para máscara monetária brasileira.
 */
export function formatCurrencyInput(val: string): string {
  // Mantém apenas dígitos
  const digits = val.replace(/\D/g, '');
  if (!digits) return '';

  const cents = parseInt(digits, 10);
  const reais = (cents / 100).toFixed(2);
  const [intPart, decPart] = reais.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedInt},${decPart}`;
}
