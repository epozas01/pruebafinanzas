export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar ($)',        symbol: '$'   },
  { code: 'EUR', label: 'Euro (€)',             symbol: '€'   },
  { code: 'GBP', label: 'British Pound (£)',    symbol: '£'   },
  { code: 'JPY', label: 'Japanese Yen (¥)',     symbol: '¥'   },
  { code: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$'  },
  { code: 'AUD', label: 'Australian Dollar',    symbol: 'A$'  },
  { code: 'MXN', label: 'Mexican Peso (MX$)',   symbol: 'MX$' },
  { code: 'BRL', label: 'Brazilian Real (R$)',  symbol: 'R$'  },
  { code: 'COP', label: 'Colombian Peso',       symbol: 'COP' },
  { code: 'CLP', label: 'Chilean Peso',         symbol: 'CLP' },
  { code: 'ARS', label: 'Argentine Peso',       symbol: 'ARS' },
  { code: 'CHF', label: 'Swiss Franc',          symbol: 'CHF' },
  { code: 'CNY', label: 'Chinese Yuan (¥)',     symbol: 'CN¥' },
  { code: 'INR', label: 'Indian Rupee (₹)',     symbol: '₹'   },
  { code: 'KRW', label: 'Korean Won (₩)',       symbol: '₩'   },
]

export const ACCOUNT_TYPES = [
  { id: 'checking',   label: 'Checking',     icon: '🏦', isAsset: true  },
  { id: 'savings',    label: 'Savings',      icon: '💰', isAsset: true  },
  { id: 'investment', label: 'Investment',   icon: '📈', isAsset: true  },
  { id: 'cash',       label: 'Cash',         icon: '💵', isAsset: true  },
  { id: 'crypto',     label: 'Crypto',       icon: '₿',  isAsset: true  },
  { id: 'credit',     label: 'Credit Card',  icon: '💳', isAsset: false },
  { id: 'loan',       label: 'Loan',         icon: '📋', isAsset: false },
]
