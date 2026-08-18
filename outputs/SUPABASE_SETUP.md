# Подключение Supabase

1. Создайте проект в Supabase.
2. В **SQL Editor** выполните содержимое `supabase/schema.sql`.
3. В **Authentication → Users** нажмите **Add user** и создайте первого администратора с email и паролем. Не включайте публичную регистрацию.
4. Скопируйте `.env.example` в `.env` и заполните значения из **Project Settings → API**:

```env
VITE_SUPABASE_URL=https://zvcanjyiphfvvpgkramx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_UIrAod9DNxqQRQy7fnxESQ_oPpoOt7i
```

Используйте только `anon` key — не вставляйте `service_role` key во frontend.

5. Установите зависимости и запустите сайт:

```bash
npm install
npm run dev
```

Админка доступна по `/admin`. Незалогиненного пользователя страница отправит на экран входа.

Production-сборка:

```bash
npm run build
```

Настройка Telegram-уведомлений описана в `outputs/TELEGRAM_SETUP.md`. Токен бота храните только в Supabase Edge Function Secrets, а не в Vite-переменных.
