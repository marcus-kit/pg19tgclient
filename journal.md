# pg19v3tgclient — Journal

## 2026-01-30: Интеграция с billing системой

### Изменения

**API обновлены для использования billing views:**
- `server/api/invoices/index.get.ts` → invoices_view
- `server/api/contracts/index.get.ts` → contracts_view

**Изменения в авторизации:**
- `server/api/auth/telegram-webapp.post.ts` → contracts_view
- `server/api/community/messages/index.get.ts` → contracts_view
- `server/api/community/rooms/index.get.ts` → contracts_view

### Архитектура

```
billing схема (источник истины)
    ↓ PostgreSQL Views
public схема (contracts_view, invoices_view, ...)
    ↓ Supabase API
pg19v3tgclient (Telegram Mini App)
```

### Commits
- `e47a536` — refactor: use billing views for data access
- `fix: use views instead of renamed tables`
