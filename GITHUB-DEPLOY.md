# 🚀 Деплой VX School через GitHub

## 📋 Пошаговая инструкция:

### 1. Создание репозитория на GitHub

#### На сайте GitHub:
1. Зайди на [github.com](https://github.com)
2. Нажми "New repository" (зеленая кнопка)
3. Название: `vxschool-landing`
4. Описание: `VX School - Music Production Landing Page with Admin Panel`
5. Выбери "Private" (для безопасности)
6. НЕ добавляй README, .gitignore, license (у нас уже есть)
7. Нажми "Create repository"

### 2. Загрузка кода на GitHub

#### В терминале (в папке vxschool):
```bash
# Инициализация git репозитория
git init

# Добавление всех файлов
git add .

# Первый коммит
git commit -m "Initial commit: VX School landing with admin panel"

# Добавление удаленного репозитория (замени USERNAME на свой)
git remote add origin https://github.com/USERNAME/vxschool-landing.git

# Отправка кода на GitHub
git push -u origin main
```

### 3. Деплой на сервер через git

#### На сервере REG.RU (через SSH):
```bash
# Клонирование репозитория
git clone https://github.com/USERNAME/vxschool-landing.git vxschool

# Переход в папку проекта
cd vxschool

# Создание .env файла с реальными данными
nano .env
```

#### Содержимое .env файла на сервере:
```env
NODE_ENV=production
PORT=3000

# Telegram Bot Configuration (РЕАЛЬНЫЕ ДАННЫЕ!)
TELEGRAM_BOT_TOKEN=7813770954:AAEfWfVmagJ7cT7H75joxgIh08IEU6RnA0A
TELEGRAM_CHAT_ID=279655008

# Admin Configuration (БЕЗОПАСНЫЕ ПАРОЛИ!)
ADMIN_USERNAME=vxschool_admin
ADMIN_PASSWORD=VXMusic2024!Secure#Admin
JWT_SECRET=vx-school-jwt-production-key-2024-secure-random-string-32chars
ADMIN_SESSION_SECRET=vx-admin-session-production-secret-key-2024-secure-random
```

#### Установка и запуск:
```bash
# Установка зависимостей
npm install

# Запуск автоматического деплоя
chmod +x deploy.sh
./deploy.sh

# Запуск сервера
npm start
```

### 4. Настройка автоматического деплоя (опционально)

#### Создай скрипт обновления на сервере:
```bash
nano update.sh
```

#### Содержимое update.sh:
```bash
#!/bin/bash
echo "🔄 Обновление VX School..."
git pull origin main
npm install
echo "✅ Обновление завершено!"
echo "🔄 Перезапустите сервер: npm start"
```

```bash
chmod +x update.sh
```

#### Теперь для обновления сайта:
1. Внеси изменения в код локально
2. Загрузи на GitHub: `git push`
3. На сервере выполни: `./update.sh`

## 🔐 Безопасность:

### ✅ Что защищено:
- `.env` файл НЕ загружается на GitHub
- Секретные ключи остаются только на сервере
- Репозиторий приватный

### ⚠️ Важно:
- НИКОГДА не коммить .env с реальными данными
- Используй сильные пароли
- Регулярно меняй секретные ключи

## 📋 Команды для работы:

### Обновление кода:
```bash
# Локально
git add .
git commit -m "Описание изменений"
git push

# На сервере
./update.sh
npm start
```

### Проверка статуса:
```bash
# Проверка процессов
ps aux | grep node

# Проверка логов
npm start
```

## 🎯 Результат:

После выполнения всех шагов:
- **Сайт:** https://vxschool.ru
- **Админка:** https://vxschool.ru/admin/
- **Логин:** vxschool_admin
- **Пароль:** VXMusic2024!Secure#Admin

## 🆘 Помощь:

### Если что-то не работает:
1. Проверь .env файл на сервере
2. Убедись что все зависимости установлены
3. Проверь логи: `npm start`
4. Проверь права доступа к файлам

**Готов помочь на каждом шаге! 🚀**