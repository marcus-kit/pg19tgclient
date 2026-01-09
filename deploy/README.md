# Настройка обработчика уведомлений

## Описание

Обработчик очереди отложенных уведомлений для community чата.
Вызывает `/api/internal/process-notifications` каждые 30 секунд.

## Установка на сервер

### 1. Скопировать файлы

```bash
sudo cp notification-processor.service /etc/systemd/system/pg19-notification-processor.service
sudo cp notification-processor.timer /etc/systemd/system/pg19-notification-processor.timer
```

### 2. Настроить секретный ключ

Отредактировать `/etc/systemd/system/pg19-notification-processor.service`:

```bash
sudo nano /etc/systemd/system/pg19-notification-processor.service
```

Заменить `your-secret-here` на реальный секрет (должен совпадать с `INTERNAL_API_SECRET` в docker-compose).

### 3. Добавить секрет в docker-compose

В `/opt/pg19-tgclient/docker-compose.yml` добавить:

```yaml
environment:
  - NUXT_INTERNAL_API_SECRET=your-secret-here
```

### 4. Перезапустить контейнер

```bash
cd /opt/pg19-tgclient
docker compose up -d --force-recreate
```

### 5. Запустить таймер

```bash
sudo systemctl daemon-reload
sudo systemctl enable pg19-notification-processor.timer
sudo systemctl start pg19-notification-processor.timer
```

### 6. Проверить статус

```bash
# Статус таймера
sudo systemctl status pg19-notification-processor.timer

# Логи
sudo journalctl -u pg19-notification-processor.service -f

# Ручной тест
curl -X POST https://pg19-tg.doka.team/api/internal/process-notifications \
  -H "Authorization: Bearer your-secret-here"
```

## Альтернатива: cron

Если systemd timer не подходит, можно использовать cron:

```bash
# Каждую минуту (cron не поддерживает 30 секунд)
* * * * * curl -s -X POST https://pg19-tg.doka.team/api/internal/process-notifications -H "Authorization: Bearer SECRET"

# Два раза в минуту (workaround)
* * * * * curl -s -X POST https://pg19-tg.doka.team/api/internal/process-notifications -H "Authorization: Bearer SECRET"
* * * * * sleep 30 && curl -s -X POST https://pg19-tg.doka.team/api/internal/process-notifications -H "Authorization: Bearer SECRET"
```

## Мониторинг

Логи в контейнере:

```bash
docker logs -f pg19-tgclient 2>&1 | grep ProcessNotifications
```
