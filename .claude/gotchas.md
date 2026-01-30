# Gotchas — pg19v3tgclient

Подводные камни и особенности проекта. Claude обновляет этот файл при обнаружении новых.

---

## Dependencies

- **vue-router** — встроен в Nuxt, не добавлять в dependencies

## Auth Store

- **НЕ нужен** pinia-plugin-persistedstate — используется manual persist
- Ключ localStorage: `pg19_lk_auth`

## Telegram SDK

- **useTwa()** — единственный способ доступа к Telegram API
- **НЕ использовать:** vue-tg, @tma.js/sdk-vue (устаревшие)
- SPA режим (`ssr: false`) — правильно для TWA

## Performance

- `useFetch` с `lazy: true` — не блокирует навигацию
- KeepAlive включен для основных страниц
