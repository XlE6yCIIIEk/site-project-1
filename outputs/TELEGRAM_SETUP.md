# Telegram-уведомления о новых заказах

Уведомление отправляет Supabase Edge Function `submit-application` после успешного сохранения заказа. Токен бота не попадает в браузер или frontend-сборку.

## 1. Создать бота

1. Откройте в Telegram `@BotFather`.
2. Выполните команду `/newbot` и сохраните полученный токен.
3. Откройте созданного бота со своего аккаунта и нажмите **Start**.

## 2. Узнать chat ID менеджера

После нажатия **Start** откройте в браузере:

```text
https://api.telegram.org/bot<ТОКЕН>/getUpdates
```

В ответе найдите `message.chat.id`. Для уведомлений в группу сначала добавьте бота в группу, отправьте там сообщение и возьмите ID группы из того же ответа (обычно он отрицательный).

## 3. Добавить секреты Supabase

Из корня проекта выполните:

```bash
npx supabase secrets set TELEGRAM_BOT_TOKEN="токен_от_BotFather"
npx supabase secrets set TELEGRAM_CHAT_ID="chat_id_менеджера"
```

Также функции нужны уже используемые секреты:

```bash
npx supabase secrets set ALLOWED_ORIGIN="https://ваш-домен.kz"
npx supabase secrets set TURNSTILE_SECRET_KEY="секретный_ключ_Cloudflare_Turnstile"
```

`SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` Supabase предоставляет Edge Function автоматически.

## 4. Развернуть функцию

```bash
npx supabase functions deploy submit-application
```

После отправки формы заказ сохранится в таблице `applications`, а менеджер получит номер заказа, имя, телефон, адреса, дату, объём и комментарий. Если Telegram временно недоступен, заказ всё равно сохранится; причина ошибки будет доступна в логах Edge Function.
