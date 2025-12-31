export const FEATURES = [
  {
    key: 'save-bookmark',
    name: 'Save Bookmark',
    icon: 'fa-solid fa-plus-circle',
    ui: 'features/save-bookmark/ui.html',
    logic: async () => (await import('./features/save-bookmark/logic.js'))
  },
  {
    key: 'currency-convert',
    name: 'Đổi tiền tệ',
    icon: 'fa-solid fa-money-bill-transfer',
    ui: 'features/currency-convert/ui.html',
    logic: async () => (await import('./features/currency-convert/logic.js'))
  },
  {
    key: 'gmail-generator',
    name: 'Tạo Gmail',
    icon: 'fa-solid fa-envelope-open-text',
    ui: 'features/gmail-generator/ui.html',
    logic: async () => (await import('./features/gmail-generator/logic.js'))
  },
  {
    key: 'mailtm',
    name: 'Temp Mail (Mail.tm)',
    icon: 'fa-solid fa-user-secret',
    ui: 'features/mailtm/ui.html',
    logic: async () => (await import('./features/mailtm/logic.js'))
  },
  {
    key: 'random-pass',
    name: 'Password Generator',
    icon: 'fa-solid fa-key',
    ui: 'features/random-pass/ui.html',
    logic: async () => (await import('./features/random-pass/logic.js'))
  },
  {
    key: 'yaytext',
    name: 'YayText Styles',
    icon: 'fa-solid fa-font',
    ui: 'features/yaytext/ui.html',
    logic: async () => (await import('./features/yaytext/logic.js'))
  },
  {
    key: 'translate',
    name: 'Dịch nhanh',
    icon: 'fa-solid fa-language',
    ui: 'features/translate/ui.html',
    logic: async () => (await import('./features/translate/logic.js'))
  },
  {
    key: 'studocu',
    name: 'Studocu Cleaner',
    icon: 'fa-solid fa-file-shield',
    ui: 'features/studocu/ui.html',
    logic: async () => (await import('./features/studocu/logic.js'))
  }
];
