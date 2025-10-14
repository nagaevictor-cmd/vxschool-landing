# SSL Certificate Setup Guide

## Установка существующих SSL сертификатов

У вас уже есть SSL сертификаты. Следуйте этим шагам для их установки:

### 1. Директория для сертификатов уже создана

Вы уже создали директорию `/etc/ssl/vxschool` - это отлично! Установите правильные права доступа:

```bash
sudo chmod 700 /etc/ssl/vxschool
```

### 2. Скопируйте ваши сертификаты

Скопируйте ваши файлы сертификатов в созданную директорию:

```bash
# Скопируйте приватный ключ
sudo cp /path/to/your/certificate.key /etc/ssl/vxschool/
sudo chmod 600 /etc/ssl/vxschool/certificate.key

# Скопируйте сертификат
sudo cp /path/to/your/certificate.crt /etc/ssl/vxschool/
sudo chmod 644 /etc/ssl/vxschool/certificate.crt

# Если у вас есть CA bundle (certificate_ca.crt), скопируйте его тоже
sudo cp /path/to/your/certificate_ca.crt /etc/ssl/vxschool/
sudo chmod 644 /etc/ssl/vxschool/certificate_ca.crt
```

### 3. Обновите nginx конфигурацию

Отредактируйте файл `nginx-vxschool.conf` и замените пути к сертификатам:

```nginx
# SSL certificates
ssl_certificate /etc/ssl/vxschool/certificate.crt;
ssl_certificate_key /etc/ssl/vxschool/certificate.key;

# Если у вас есть CA bundle, раскомментируйте:
# ssl_trusted_certificate /etc/ssl/vxschool/certificate_ca.crt;
```

### 4. Создайте DH параметры (если еще не созданы)

```bash
sudo openssl dhparam -out /etc/nginx/dhparam.pem 2048
```

### 5. Установите nginx конфигурацию

```bash
# Скопируйте конфигурацию
sudo cp nginx-vxschool.conf /etc/nginx/sites-available/vxschool.ru

# Обновите путь к корневой директории в конфигурации
sudo sed -i 's|/path/to/vxschool|'$(pwd)'|g' /etc/nginx/sites-available/vxschool.ru

# Создайте символическую ссылку
sudo ln -sf /etc/nginx/sites-available/vxschool.ru /etc/nginx/sites-enabled/

# Удалите дефолтную конфигурацию (если есть)
sudo rm -f /etc/nginx/sites-enabled/default
```

### 6. Проверьте конфигурацию nginx

```bash
sudo nginx -t
```

### 7. Перезапустите nginx

```bash
sudo systemctl reload nginx
```

## Проверка SSL сертификата

После установки проверьте, что SSL работает корректно:

```bash
# Проверьте сертификат
openssl s_client -connect vxschool.ru:443 -servername vxschool.ru

# Или используйте curl
curl -I https://vxschool.ru
```

## Автоматическое обновление сертификатов

Если ваши сертификаты нужно обновлять периодически, создайте скрипт для автоматического обновления:

```bash
#!/bin/bash
# /usr/local/bin/update-ssl-certs.sh

# Скопируйте новые сертификаты
cp /path/to/new/certificate.key /etc/ssl/vxschool/
cp /path/to/new/certificate.crt /etc/ssl/vxschool/
cp /path/to/new/certificate_ca.crt /etc/ssl/vxschool/

# Установите правильные права доступа
chmod 600 /etc/ssl/vxschool/certificate.key
chmod 644 /etc/ssl/vxschool/certificate.crt
chmod 644 /etc/ssl/vxschool/certificate_ca.crt

# Проверьте конфигурацию и перезагрузите nginx
nginx -t && systemctl reload nginx
```

Сделайте скрипт исполняемым:
```bash
sudo chmod +x /usr/local/bin/update-ssl-certs.sh
```

## Мониторинг срока действия сертификата

Добавьте в crontab проверку срока действия сертификата:

```bash
# Проверка каждый день в 6:00
0 6 * * * /usr/bin/openssl x509 -checkend 2592000 -noout -in /etc/ssl/vxschool/certificate.crt || echo "Certificate expires in 30 days" | mail -s "SSL Certificate Warning" admin@vxschool.ru
```

## Troubleshooting

### Ошибка "SSL certificate problem"
- Проверьте, что файлы сертификатов существуют и имеют правильные права доступа
- Убедитесь, что пути в nginx конфигурации указаны правильно

### Ошибка "certificate verify failed"
- Убедитесь, что у вас есть полная цепочка сертификатов (certificate_ca.crt)
- Проверьте, что сертификат не истек

### Nginx не запускается
- Проверьте синтаксис конфигурации: `sudo nginx -t`
- Проверьте логи: `sudo tail -f /var/log/nginx/error.log`