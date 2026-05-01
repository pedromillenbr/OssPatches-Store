export const CONFIG = {
  siteName: 'OssPatches',
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://osspatches.com',
  siteDescription: 'Faixas e patches premium de Jiu-Jitsu. Produção própria, padrão competição, envio mundial.',
  defaultCurrency: 'BRL',
  defaultCountry: 'BR',

  // Origin postal code (for shipping quotes)
  originCEP: '01310-100', // Replace with your actual CEP

  // Google Sheets
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',

  // Product dimensions for shipping calc (cm / kg)
  beltDimensions: { weight: 0.15, width: 25, height: 5, length: 30 },
  patchDimensions: { weight: 0.05, width: 12, height: 2, length: 12 },

  social: {
    instagram: 'https://instagram.com/osspatches',
    whatsapp: '', // intentionally empty — moving away from WhatsApp
  },

  colors: {
    beltColors: {
      white:  { label: 'Branca',          hex: '#F5F5F5', border: '#D4D4D4' },
      blue:   { label: 'Azul',            hex: '#1E40AF' },
      purple: { label: 'Roxa',            hex: '#7C3AED' },
      brown:  { label: 'Marrom',          hex: '#78350F' },
      black:  { label: 'Preta',           hex: '#171717' },
      'red-black': { label: 'Vermelha e Preta', hex: '#DC2626', hexSecondary: '#171717' },
      red:    { label: 'Vermelha',        hex: '#DC2626' },
      gray:   { label: 'Cinza',           hex: '#6B7280' },
      yellow: { label: 'Amarela',         hex: '#ffd000' },
      orange: { label: 'Laranja',         hex: '#EA580C' },
      green:  { label: 'Verde',           hex: '#0c632c' },
    },
  },
};

export const COUNTRIES = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
];
