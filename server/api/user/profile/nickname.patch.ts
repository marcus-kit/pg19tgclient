// PATCH /api/user/profile/nickname
// Обновить никнейм пользователя (глобально уникальный)

import type { UpdateNicknameRequest, UpdateNicknameResponse } from '~/types/community'

export default defineEventHandler(async (event): Promise<UpdateNicknameResponse> => {
  const body = await readBody<UpdateNicknameRequest>(event)

  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Нормализация никнейма
  const nickname = body.nickname?.trim() || null

  // Валидация
  if (nickname !== null) {
    if (nickname.length < 2 || nickname.length > 30) {
      throw createError({ statusCode: 400, message: 'Никнейм должен быть от 2 до 30 символов' })
    }

    // Только буквы, цифры, пробелы, подчёркивания и дефисы
    if (!/^[\p{L}\p{N}\s_-]+$/u.test(nickname)) {
      throw createError({ statusCode: 400, message: 'Никнейм содержит недопустимые символы' })
    }

    // Проверка уникальности через функцию
    const { data: isAvailable, error: checkError } = await supabase.rpc('check_nickname_available', {
      p_nickname: nickname,
      p_user_id: sessionUser.id
    })

    if (checkError) {
      console.error('Error checking nickname:', checkError)
      throw createError({ statusCode: 500, message: 'Ошибка проверки никнейма' })
    }

    if (!isAvailable) {
      throw createError({ statusCode: 409, message: 'Этот никнейм уже занят' })
    }
  }

  // Обновляем пользователя
  const { data, error } = await supabase
    .from('users')
    .update({ nickname })
    .eq('id', sessionUser.id)
    .select('nickname')
    .single()

  if (error) {
    console.error('Error updating nickname:', error)

    // Специальная обработка уникальности (если constraint сработал)
    if (error.code === '23505') {
      throw createError({ statusCode: 409, message: 'Этот никнейм уже занят' })
    }

    throw createError({ statusCode: 500, message: 'Ошибка обновления никнейма' })
  }

  return { success: true, nickname: data.nickname }
})
