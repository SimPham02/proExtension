export const FEATURES = [
  {
    key: 'currency-convert',
    name: 'currency-convert',
    ui: 'features/currency-convert/ui.html',
    logic: async () => (await import('./features/currency-convert/logic.js'))
  },
  {
    key: 'gmail-generator',
    name: 'gmail-generator',
    ui: 'features/gmail-generator/ui.html',
    logic: async () => (await import('./features/gmail-generator/logic.js'))
  },
  {
    key: 'mailtm',
    name: 'mailtm',
    ui: 'features/mailtm/ui.html',
    logic: async () => (await import('./features/mailtm/logic.js'))
  },
  {
    key: 'random-pass',
    name: 'random-pass',
    ui: 'features/random-pass/ui.html',
    logic: async () => (await import('./features/random-pass/logic.js'))
  },
  {
    key: 'yaytext',
    name: 'yaytext',
    ui: 'features/yaytext/ui.html',
    logic: async () => (await import('./features/yaytext/logic.js'))
  }
];
