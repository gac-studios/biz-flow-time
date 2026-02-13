/**
 * Validates a Brazilian CNPJ number (digits only).
 */
export function isValidCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (slice: string, weights: number[]) =>
    weights.reduce((sum, w, i) => sum + Number(slice[i]) * w, 0);

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let rem = calc(digits, w1) % 11;
  const d1 = rem < 2 ? 0 : 11 - rem;
  if (Number(digits[12]) !== d1) return false;

  rem = calc(digits, w2) % 11;
  const d2 = rem < 2 ? 0 : 11 - rem;
  return Number(digits[13]) === d2;
}

/**
 * Formats a CNPJ string as 00.000.000/0000-00
 */
export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Strips formatting from CNPJ, returning only digits.
 */
export function stripCnpj(value: string): string {
  return value.replace(/\D/g, "");
}
