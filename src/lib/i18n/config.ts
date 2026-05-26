// =============================================================================
// GENIO CORE — Configuration i18n européenne
// Locales, pays, devises — sans dépendance externe
// =============================================================================

export const SUPPORTED_LOCALES = ['fr', 'en', 'de', 'es', 'it', 'nl', 'pt', 'pl'] as const
export type Locale = typeof SUPPORTED_LOCALES[number]

export const DEFAULT_LOCALE: Locale = 'fr'

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  nl: 'Nederlands',
  pt: 'Português',
  pl: 'Polski',
}

export const LOCALE_DATE_FORMATS: Record<Locale, string> = {
  fr: 'DD/MM/YYYY',
  en: 'MM/DD/YYYY',
  de: 'DD.MM.YYYY',
  es: 'DD/MM/YYYY',
  it: 'DD/MM/YYYY',
  nl: 'DD-MM-YYYY',
  pt: 'DD/MM/YYYY',
  pl: 'DD.MM.YYYY',
}

// ---------------------------------------------------------------------------
// Pays européens
// ---------------------------------------------------------------------------

export const EU_COUNTRIES = [
  'FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'AT', 'LU', 'IE',
  'PL', 'RO', 'SE', 'DK', 'FI', 'GR', 'CZ', 'HU', 'SK', 'BG',
  'HR', 'SI', 'EE', 'LV', 'LT', 'CY', 'MT',
] as const

export const NON_EU_EUROPEAN = ['GB', 'CH', 'NO', 'IS', 'LI'] as const

export type EUCountry = typeof EU_COUNTRIES[number]
export type EuropeanCountry = EUCountry | typeof NON_EU_EUROPEAN[number]

export const COUNTRY_NAMES: Record<EuropeanCountry, string> = {
  FR: 'France',      DE: 'Deutschland',  ES: 'España',      IT: 'Italia',
  BE: 'Belgique',    NL: 'Nederland',    PT: 'Portugal',    AT: 'Österreich',
  LU: 'Luxembourg',  IE: 'Ireland',      PL: 'Polska',      RO: 'România',
  SE: 'Sverige',     DK: 'Danmark',      FI: 'Suomi',       GR: 'Ελλάδα',
  CZ: 'Česko',       HU: 'Magyarország', SK: 'Slovensko',   BG: 'България',
  HR: 'Hrvatska',    SI: 'Slovenija',    EE: 'Eesti',       LV: 'Latvija',
  LT: 'Lietuva',     CY: 'Κύπρος',      MT: 'Malta',
  GB: 'United Kingdom', CH: 'Schweiz',   NO: 'Norge',       IS: 'Ísland',
  LI: 'Liechtenstein',
}

export const COUNTRY_LOCALE_DEFAULT: Partial<Record<EuropeanCountry, Locale>> = {
  FR: 'fr', BE: 'fr', LU: 'fr', CH: 'fr',
  DE: 'de', AT: 'de',
  ES: 'es',
  IT: 'it',
  NL: 'nl',
  PT: 'pt',
  PL: 'pl',
  GB: 'en', IE: 'en',
}

// ---------------------------------------------------------------------------
// Devises européennes
// ---------------------------------------------------------------------------

export const EU_CURRENCIES = ['EUR', 'GBP', 'CHF', 'NOK', 'SEK', 'DKK', 'PLN', 'RON', 'HUF', 'CZK'] as const
export type EUCurrency = typeof EU_CURRENCIES[number]

export const CURRENCY_SYMBOLS: Record<EUCurrency, string> = {
  EUR: '€', GBP: '£', CHF: 'Fr.', NOK: 'kr', SEK: 'kr',
  DKK: 'kr', PLN: 'zł', RON: 'lei', HUF: 'Ft', CZK: 'Kč',
}

export const CURRENCY_COUNTRY: Partial<Record<EuropeanCountry, EUCurrency>> = {
  FR: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR', BE: 'EUR', NL: 'EUR',
  PT: 'EUR', AT: 'EUR', LU: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR',
  CY: 'EUR', MT: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', SK: 'EUR',
  SI: 'EUR',
  GB: 'GBP', CH: 'CHF', NO: 'NOK', SE: 'SEK', DK: 'DKK',
  PL: 'PLN', RO: 'RON', HU: 'HUF', CZ: 'CZK',
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

export function formatCurrency(amount: number, currency: EUCurrency, locale: Locale): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${CURRENCY_SYMBOLS[currency] ?? currency}`
  }
}

export function formatDate(date: string | Date, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day:   '2-digit',
      month: '2-digit',
      year:  'numeric',
    }).format(typeof date === 'string' ? new Date(date) : date)
  } catch {
    return String(date)
  }
}

export function formatRelativeDate(date: string | Date, locale: Locale): string {
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    const diff = Math.floor((new Date(date).getTime() - Date.now()) / 86400000)
    if (Math.abs(diff) < 1) return rtf.format(0, 'day')
    if (Math.abs(diff) < 30) return rtf.format(diff, 'day')
    if (Math.abs(diff) < 365) return rtf.format(Math.floor(diff / 30), 'month')
    return rtf.format(Math.floor(diff / 365), 'year')
  } catch {
    return String(date)
  }
}
