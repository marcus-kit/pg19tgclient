import { setCookie, getCookie } from 'h3'
import crypto from 'crypto'
import type { Chat, SessionRequest } from '~/types/chat'

const CHAT_SESSION_COOKIE = 'pg19_chat_session'

export default defineEventHandler(async (event) => {
  const body = await readBody<SessionRequest>(event)
  const supabase = useSupabaseServer()

  // Проверяем авторизованного пользователя
  const sessionUser = await getUserFromSession(event)
  const chatSessionToken = getCookie(event, CHAT_SESSION_COOKIE)

  // Если есть chatId - пробуем восстановить существующий чат
  if (body.chatId) {
    const { data: existingChat } = await supabase
      .from('chats')
      .select('*')
      .eq('id', body.chatId)
      .in('status', ['active', 'waiting'])
      .single()

    if (existingChat) {
      // Проверяем ownership
      if (existingChat.user_id) {
        // Чат авторизованного пользователя
        if (!sessionUser || sessionUser.id !== existingChat.user_id) {
          throw createError({
            statusCode: 403,
            message: 'Нет доступа к этому чату'
          })
        }
      } else {
        // Гостевой чат - проверяем токен
        if (!chatSessionToken || chatSessionToken !== existingChat.session_token) {
          throw createError({
            statusCode: 403,
            message: 'Нет доступа к этому чату'
          })
        }
      }

      return {
        session: existingChat as Chat,
        isNew: false
      }
    }
    // Если чат не найден или закрыт - продолжаем создание нового
  }

  // Если есть авторизованный пользователь - ищем его активный чат
  if (sessionUser) {
    const { data: existingChat } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', sessionUser.id)
      .in('status', ['active', 'waiting'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingChat) {
      return {
        session: existingChat as Chat,
        isNew: false
      }
    }
  }

  // Создаём новый чат
  const chatData: Record<string, unknown> = {
    status: 'waiting'  // Сразу в ожидании оператора
  }

  if (sessionUser) {
    // Авторизованный пользователь
    chatData.user_id = sessionUser.id
  } else {
    // Гостевая сессия - нужны контактные данные
    if (!body.guestName?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Укажите имя'
      })
    }

    // Генерируем токен сессии для гостя
    const newSessionToken = crypto.randomBytes(32).toString('hex')
    chatData.guest_name = body.guestName.trim()
    chatData.guest_contact = body.guestContact?.trim() || null
    chatData.session_token = newSessionToken

    // Устанавливаем cookie
    setCookie(event, CHAT_SESSION_COOKIE, newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 дней
      path: '/'
    })
  }

  const { data: newChat, error } = await supabase
    .from('chats')
    .insert(chatData)
    .select()
    .single()

  if (error) {
    console.error('Error creating chat:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при создании чата'
    })
  }

  return {
    session: newChat as Chat,
    isNew: true
  }
})
