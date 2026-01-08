// POST /api/community/rooms/:id/join
// Добавляет пользователя в участники комнаты (если ещё не состоит)

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseServer()

  const roomId = getRouterParam(event, 'id')
  if (!roomId) {
    throw createError({ statusCode: 400, message: 'ID комнаты обязателен' })
  }

  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Проверяем, существует ли комната
  const { data: room, error: roomError } = await supabase
    .from('community_rooms')
    .select('id')
    .eq('id', roomId)
    .single()

  if (roomError || !room) {
    throw createError({ statusCode: 404, message: 'Комната не найдена' })
  }

  // Проверяем, состоит ли пользователь уже в комнате
  const { data: existingMember } = await supabase
    .from('community_members')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', sessionUser.id)
    .single()

  if (existingMember) {
    // Уже состоит в комнате
    return { success: true, alreadyMember: true }
  }

  // Добавляем в участники
  const { error: insertError } = await supabase
    .from('community_members')
    .insert({
      room_id: roomId,
      user_id: sessionUser.id,
      role: 'member'
    })

  if (insertError) {
    console.error('Error joining room:', insertError)
    throw createError({ statusCode: 500, message: 'Ошибка при вступлении в комнату' })
  }

  return { success: true, alreadyMember: false }
})
