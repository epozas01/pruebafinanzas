export const EXPENSE_CATEGORIES = [
  { id: 'food',          label: 'Food & Dining',   icon: '🍽️' },
  { id: 'housing',       label: 'Housing',          icon: '🏠' },
  { id: 'transport',     label: 'Transport',        icon: '🚗' },
  { id: 'entertainment', label: 'Entertainment',    icon: '🎬' },
  { id: 'shopping',      label: 'Shopping',         icon: '🛍️' },
  { id: 'health',        label: 'Health',           icon: '💊' },
  { id: 'education',     label: 'Education',        icon: '📚' },
  { id: 'utilities',     label: 'Utilities',        icon: '⚡' },
  { id: 'travel',        label: 'Travel',           icon: '✈️' },
  { id: 'other',         label: 'Other',            icon: '📦' },
]

export const INCOME_CATEGORIES = [
  { id: 'salary',     label: 'Salary',      icon: '💼' },
  { id: 'freelance',  label: 'Freelance',   icon: '💻' },
  { id: 'investment', label: 'Investment',  icon: '📈' },
  { id: 'gift',       label: 'Gift',        icon: '🎁' },
  { id: 'refund',     label: 'Refund',      icon: '↩️' },
  { id: 'other_inc',  label: 'Other',       icon: '💰' },
]

export function getCategoryMeta(id, type) {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return list.find(c => c.id === id) || { label: id, icon: '📦' }
}

export const CATEGORY_COLORS = {
  food:          '#f59e0b',
  housing:       '#6366f1',
  transport:     '#3b82f6',
  entertainment: '#ec4899',
  shopping:      '#8b5cf6',
  health:        '#10b981',
  education:     '#14b8a6',
  utilities:     '#f97316',
  travel:        '#06b6d4',
  other:         '#6b7280',
  salary:        '#4ade80',
  freelance:     '#34d399',
  investment:    '#a3e635',
  gift:          '#fb7185',
  refund:        '#60a5fa',
  other_inc:     '#94a3b8',
}
