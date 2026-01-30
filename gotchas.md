# Gotchas

## Billing Integration Gotchas

### ❌ Старые таблицы переименованы

```typescript
// НЕПРАВИЛЬНО
.from('accounts')      // → accounts_backup
.from('subscriptions') // → subscriptions_backup

// ПРАВИЛЬНО
.from('contracts_view')
.from('subscriptions_view')
```

### ❌ Используй user_id вместо account_id

```typescript
// НЕПРАВИЛЬНО
.eq('account_id', ...)

// ПРАВИЛЬНО
.eq('user_id', authStore.user.id)
```

### Views добавляют user_id

Views в public схеме автоматически добавляют `user_id` через JOIN с `user_customer_links`. Это позволяет фильтровать данные по текущему пользователю.
