import { H3Event, getCookie, setCookie, deleteCookie, createError } from 'h3'
import crypto from 'crypto'

const SESSION_COOKIE_NAME = 'pg19_session'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 дней в секундах

interface SessionUser {
  id: string
  accountId: string
}

/**
 * Генерирует криптографически безопасный токен сессии
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Устанавливает cookie сессии
 */
export function setSessionCookie(event: H3Event, token: string): void {
  setCookie(event, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true, // Требуется для sameSite: 'none'
    sameSite: 'none', // Для Telegram Web App (работает как webview)
    maxAge: SESSION_MAX_AGE,
    path: '/'
  })
}

/**
 * Удаляет cookie сессии
 */
export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE_NAME, {
    path: '/'
  })
}

/**
 * Получает токен сессии из cookie
 */
export function getSessionToken(event: H3Event): string | undefined {
  return getCookie(event, SESSION_COOKIE_NAME)
}

/**
 * Получает пользователя из сессии.
 * Возвращает null если сессия не валидна или истекла.
 */
export async function getUserFromSession(event: H3Event): Promise<SessionUser | null> {
  const token = getSessionToken(event)

  if (!token) {
    return null
  }

  const supabase = useSupabaseServer()

  // Ищем активную сессию по токену
  const { data: session, error } = await supabase
    .from('auth_sessions')
    .select('user_id, account_id, expires_at')
    .eq('session_token', token)
    .eq('verified', true)
    .single()

  if (error || !session) {
    return null
  }

  // Проверяем что сессия не истекла
  if (new Date(session.expires_at) < new Date()) {
    return null
  }

  return {
    id: session.user_id,
    accountId: session.account_id
  }
}

/**
 * Требует авторизованного пользователя.
 * Выбрасывает 401 ошибку если пользователь не авторизован.
 */
export async function requireUser(event: H3Event): Promise<SessionUser> {
  const user = await getUserFromSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Требуется авторизация'
    })
  }

  return user
}

/**
 * Создаёт новую сессию для пользователя
 */
export async function createUserSession(
  event: H3Event,
  userId: string,
  accountId: string,
  method: 'telegram' | 'contract',
  identifier: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const supabase = useSupabaseServer()
  const token = generateSessionToken()

  const sessionExpiry = new Date()
  sessionExpiry.setSeconds(sessionExpiry.getSeconds() + SESSION_MAX_AGE)

  const { error } = await supabase.from('auth_sessions').insert({
    session_token: token,
    method,
    identifier,
    verified: true,
    user_id: userId,
    account_id: accountId,
    verified_at: new Date().toISOString(),
    expires_at: sessionExpiry.toISOString(),
    metadata: metadata || {}
  })

  if (error) {
    console.error('Failed to create session:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка создания сессии'
    })
  }

  // Устанавливаем cookie
  setSessionCookie(event, token)

  return token
}

/**
 * Завершает текущую сессию пользователя
 */
export async function endUserSession(event: H3Event): Promise<void> {
  const token = getSessionToken(event)

  if (token) {
    const supabase = useSupabaseServer()

    // Помечаем сессию как истёкшую
    await supabase
      .from('auth_sessions')
      .update({ expires_at: new Date().toISOString() })
      .eq('session_token', token)
  }

  clearSessionCookie(event)
}
