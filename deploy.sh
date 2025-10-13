#!/bin/bash

echo "🚀 VX School - Автоматический деплой"
echo "=================================="

# Проверка Node.js
echo "📋 Проверка Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден! Установите Node.js версии 18+"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js версия: $NODE_VERSION"

# Проверка npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не найден!"
    exit 1
fi

echo "✅ npm найден"

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Зависимости установлены успешно"
else
    echo "❌ Ошибка установки зависимостей"
    exit 1
fi

# Проверка .env файла
if [ ! -f ".env" ]; then
    echo "❌ Файл .env не найден!"
    echo "📋 Создайте .env файл из .env.example"
    exit 1
fi

echo "✅ Файл .env найден"

# Создание папки data если не существует
if [ ! -d "data" ]; then
    mkdir -p data
    echo "✅ Создана папка data"
fi

# Проверка безопасности
echo "🔒 Проверка безопасности..."
if command -v node &> /dev/null; then
    node security-check.js
fi

# Тестовый запуск
echo "🧪 Тестовый запуск сервера..."
timeout 10s npm start &
SERVER_PID=$!

sleep 5

if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Сервер запускается успешно"
    kill $SERVER_PID 2>/dev/null
else
    echo "❌ Ошибка запуска сервера"
    exit 1
fi

echo ""
echo "🎉 Деплой завершен успешно!"
echo "=================================="
echo "📋 Следующие шаги:"
echo "1. Запустите сервер: npm start"
echo "2. Откройте сайт: https://vxschool.ru"
echo "3. Админ панель: https://vxschool.ru/admin/"
echo ""
echo "🔐 Данные для входа в админку:"
echo "Логин: vxschool_admin"
echo "Пароль: VXMusic2024!Secure#Admin"
echo ""
echo "📖 Документация: ADMIN.md"