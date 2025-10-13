#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 Проверка безопасности VX School Landing...\n');

const checks = [];

// Проверка .env файла
if (fs.existsSync('.env')) {
  checks.push({ name: '✅ .env файл существует', status: 'ok' });
  
  const envContent = fs.readFileSync('.env', 'utf8');
  if (envContent.includes('TELEGRAM_BOT_TOKEN=') && envContent.includes('TELEGRAM_CHAT_ID=')) {
    checks.push({ name: '✅ Переменные окружения настроены', status: 'ok' });
  } else {
    checks.push({ name: '❌ Переменные окружения не настроены', status: 'error' });
  }
} else {
  checks.push({ name: '❌ .env файл отсутствует', status: 'error' });
}

// Проверка .gitignore
if (fs.existsSync('.gitignore')) {
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  if (gitignoreContent.includes('.env')) {
    checks.push({ name: '✅ .env файл в .gitignore', status: 'ok' });
  } else {
    checks.push({ name: '❌ .env файл не в .gitignore', status: 'error' });
  }
} else {
  checks.push({ name: '❌ .gitignore файл отсутствует', status: 'error' });
}

// Проверка прав доступа к data директории
if (fs.existsSync('data')) {
  checks.push({ name: '✅ Директория data существует', status: 'ok' });
} else {
  checks.push({ name: '⚠️  Директория data будет создана при запуске', status: 'warning' });
}

// Проверка server.js на хардкод токенов
const serverContent = fs.readFileSync('server.js', 'utf8');
if (serverContent.includes('process.env.TELEGRAM_BOT_TOKEN') && !serverContent.includes('7813770954')) {
  checks.push({ name: '✅ Токены вынесены в переменные окружения', status: 'ok' });
} else {
  checks.push({ name: '❌ Обнаружены хардкод токены в коде', status: 'error' });
}

// Проверка наличия валидации
if (serverContent.includes('sanitizeInput') && serverContent.includes('validateTelegram')) {
  checks.push({ name: '✅ Валидация входных данных реализована', status: 'ok' });
} else {
  checks.push({ name: '❌ Валидация входных данных отсутствует', status: 'error' });
}

// Проверка rate limiting
if (serverContent.includes('contactAttempts') && serverContent.includes('RATE_LIMIT_WINDOW')) {
  checks.push({ name: '✅ Rate limiting реализован', status: 'ok' });
} else {
  checks.push({ name: '❌ Rate limiting отсутствует', status: 'error' });
}

// Проверка security headers
if (serverContent.includes('X-Content-Type-Options') && serverContent.includes('Content-Security-Policy')) {
  checks.push({ name: '✅ Security headers настроены', status: 'ok' });
} else {
  checks.push({ name: '❌ Security headers отсутствуют', status: 'error' });
}

// Вывод результатов
console.log('Результаты проверки:\n');
let hasErrors = false;
let hasWarnings = false;

checks.forEach(check => {
  console.log(check.name);
  if (check.status === 'error') hasErrors = true;
  if (check.status === 'warning') hasWarnings = true;
});

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ Обнаружены критические проблемы безопасности!');
  console.log('📖 Прочитайте SECURITY.md для исправления.');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Есть предупреждения, но проект готов к деплою.');
  process.exit(0);
} else {
  console.log('✅ Все проверки безопасности пройдены!');
  console.log('🚀 Проект готов к деплою.');
  process.exit(0);
}