/**
 * Input Masks and Validators
 * For pharmaceutical company autocomplete, CPF, phone number, etc.
 */

/**
 * Mask CPF (11 digits): 000.000.000-00
 */
export function maskCPF(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  const limited = cleaned.slice(0, 11)
  
  if (limited.length <= 3) return limited
  if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`
  if (limited.length <= 9) return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`
  
  return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`
}

/**
 * Validate CPF (basic check, no digit verification for simplicity)
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.length === 11
}

/**
 * Mask Phone Number (international): +00 (00) 00000-0000
 */
export function maskPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  
  if (!cleaned) return ''
  if (cleaned.length <= 2) return `+${cleaned}`
  if (cleaned.length <= 4) return `+${cleaned.slice(0, 2)} (${cleaned.slice(2)}`
  if (cleaned.length <= 9) return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4)}`
  if (cleaned.length <= 13) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
  }
  
  return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9, 13)}`
}

/**
 * Validate Phone (basic check)
 */
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 15
}

/**
 * Validate Email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate Password
 * Requirements:
 * - At least 8 characters
 * - 1 uppercase letter
 * - 1 lowercase letter
 * - 1 number
 * - 1 special character
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Mínimo de 8 caracteres')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Uma letra maiúscula')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Uma letra minúscula')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Um número')
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Um caractere especial')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Top 50 Pharmaceutical Companies (for autocomplete)
 * Source: Fortune Global 500, Pharma sector
 */
export const PHARMA_COMPANIES = [
  'Pfizer',
  'Johnson & Johnson',
  'Roche',
  'Novartis',
  'Merck & Co.',
  'GSK (GlaxoSmithKline)',
  'Sanofi',
  'AbbVie',
  'Bristol Myers Squibb',
  'AstraZeneca',
  'Amgen',
  'Gilead Sciences',
  'Bayer',
  'Novo Nordisk',
  'Eli Lilly',
  'Boehringer Ingelheim',
  'Takeda',
  'Biogen',
  'Regeneron',
  'Grifols',
  'CSL',
  'Vertex Pharmaceuticals',
  'Alexion',
  'UCB',
  'Jazz Pharmaceuticals',
  'BioNTech',
  'Moderna',
  'Ipsen',
  'Astellas',
  'Daiichi Sankyo',
  'Otsuka',
  'Chugai',
  'Eisai',
  'Kyowa Kirin',
  'Teva',
  'Mylan',
  'Hikma',
  'Dr. Reddy\'s',
  'Sun Pharma',
  'Cipla',
  'Lupin',
  'Torrent',
  'Glenmark',
  'Aurobindo',
  'Biocon',
  'Eurofarma',
  'EMS',
  'Hypera',
  'Cristália',
  'Aché',
].sort()
