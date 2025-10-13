# Безопасность VX School Landing

## Настройка перед деплоем

### 1. Переменные окружения
Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Заполните реальные значения:
- `TELEGRAM_BOT_TOKEN` - токен вашего Telegram бота
- `TELEGRAM_CHAT_ID` - ID чата для получения уведомлений
- `NODE_ENV=production` - для продакшена

### 2. Права доступа к файлам
```bash
chmod 600 .env
chmod 755 data/
chmod 644 data/contacts.json
```

### 3. Обновление зависимостей
Регулярно обновляйте зависимости:
```bash
npm audit
npm update
```

## Реализованные меры безопасности

### Серверная часть
- ✅ Валидация и санитизация всех входных данных
- ✅ Rate limiting (3 запроса в 15 минут с одного IP)
- ✅ Security headers (XSS, CSRF, Clickjacking protection)
- ✅ Content Security Policy (CSP)
- ✅ Удаление чувствительных заголовков
- ✅ Ограничение размера запросов (10MB)
- ✅ Логирование IP адресов
- ✅ Graceful shutdown
- ✅ Глобальная обработка ошибок

### Клиентская часть
- ✅ Использование `textContent` вместо `innerHTML`
- ✅ Валидация форм на фронтенде
- ✅ Безопасная обработка пользовательского ввода

### Данные
- ✅ Токены вынесены в переменные окружения
- ✅ Экранирование HTML в Telegram сообщениях
- ✅ Валидация Telegram username
- ✅ Ограничение длины полей

## Рекомендации для продакшена

### 1. HTTPS
Обязательно используйте HTTPS в продакшене.

### 2. Reverse Proxy
Используйте Nginx или другой reverse proxy:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Firewall
Настройте firewall для ограничения доступа:
```bash
# Разрешить только HTTP/HTTPS и SSH
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

### 4. Мониторинг
- Настройте логирование
- Мониторьте необычную активность
- Регулярно проверяйте логи

### 5. Backup
Регулярно создавайте резервные копии:
- Файла `data/contacts.json`
- Конфигурации сервера
- SSL сертификатов

## Контакты
При обнаружении уязвимостей обращайтесь к администратору проекта.