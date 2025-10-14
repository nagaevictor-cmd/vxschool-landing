# 🤖 Простая настройка Telegram бота

## Что нужно сделать (5 минут):

### 1️⃣ Проверьте токен бота
В файле `.env` должно быть:
```
TELEGRAM_BOT_TOKEN=7813770954:AAEfWfVmagJ7cT7H75joxgIh08IEU6RnA0A
TELEGRAM_CHAT_ID=ваш_chat_id
```

### 2️⃣ Узнайте свой Chat ID (если не знаете)

**Способ 1 - через браузер:**
1. Напишите боту любое сообщение (например "привет")
2. Откройте эту ссылку в браузере:
   ```
   https://api.telegram.org/bot7813770954:AAEfWfVmagJ7cT7H75joxgIh08IEU6RnA0A/getUpdates
   ```
3. Найдите число после `"chat":{"id":` - это ваш Chat ID

**Способ 2 - через @userinfobot:**
1. Напишите боту @userinfobot
2. Он пришлет ваш ID

### 3️⃣ Настройте webhook (ГЛАВНОЕ!)

**Просто откройте эту ссылку в браузере:**
```
https://api.telegram.org/bot7813770954:AAEfWfVmagJ7cT7H75joxgIh08IEU6RnA0A/setWebhook?url=https://vxschool.ru/webhook/telegram
```

Должны увидеть: `{"ok":true,"result":true,"description":"Webhook was set"}`

### 4️⃣ Проверьте, что все работает

**Откройте эту ссылку:**
```
https://api.telegram.org/bot7813770954:AAEfWfVmagJ7cT7H75joxgIh08IEU6RnA0A/getWebhookInfo
```

Должны увидеть что-то вроде:
```json
{
  "ok": true,
  "result": {
    "url": "https://vxschool.ru/webhook/telegram",
    "pending_update_count": 0
  }
}
```

### 5️⃣ Перезапустите сервер

```bash
cd /var/www/vxschool
pm2 restart vxschool
```

## 🎉 Готово! Теперь при новой заявке вы получите:

```
🎵 Новая заявка VX School

👤 Имя: Иван Петров
📱 Telegram: @ivan_petrov
📋 Тариф: Групповой
💬 Сообщение: Хочу научиться делать техно

🌐 IP: 192.168.1.100
⏰ Время: 14.10.2025, 15:30:25
ID заявки: abc123def456
```

**С кнопками:**
- [💬 Написать в Telegram] - откроет чат с клиентом
- [📊 Админ панель] - откроет админку
- [📋 Все заявки] - покажет статистику
- [✅ Обработано] - пометит заявку
- [❌ Спам] - удалит спам

## ❗ Если что-то не работает:

### Бот не присылает уведомления:
1. Проверьте, что Chat ID правильный в `.env`
2. Напишите боту сообщение первым
3. Перезапустите сервер: `pm2 restart vxschool`

### Кнопки не работают:
1. Убедитесь, что webhook установлен (шаг 3)
2. Проверьте, что сайт доступен по HTTPS
3. Посмотрите логи: `pm2 logs vxschool`

### Webhook не устанавливается:
1. Проверьте, что домен vxschool.ru доступен
2. Убедитесь, что SSL сертификат работает
3. Попробуйте через несколько минут

## 🔧 Дополнительно:

**Отключить webhook (если нужно):**
```
https://api.telegram.org/bot7813770954:AAEfWfVmagJ7cT7H75joxgIh08IEU6RnA0A/deleteWebhook
```

**Проверить статус бота:**
```
https://api.telegram.org/bot7813770954:AAEfWfVmagJ7cT7H75joxgIh08IEU6RnA0A/getMe
```