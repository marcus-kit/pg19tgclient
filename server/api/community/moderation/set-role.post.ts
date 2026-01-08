// POST /api/community/moderation/set-role
// Назначить роль участнику (только global admin)

import type { SetRoleRequest } from '~/types/community'

export default defineEventHandler(async (event) => {
  const body = await readBody<SetRoleRequest>(event)

  if (!body.roomId || !body.userId || !body.role) {
    throw createError({ statusCode: 400, message: 'roomId, userId и role обязательны' })
  }

  const validRoles = ['member', 'moderator', 'admin']
  if (!validRoles.includes(body.role)) {
    throw createError({ statusCode: 400, message: 'Недопустимая роль' })
  }

  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Нельзя менять свою роль
  if (body.userId === sessionUser.id) {
    throw createError({ statusCode: 400, message: 'Нельзя изменить свою роль' })
  }

  // Вызываем функцию БД для назначения роли
  const { data: success, error } = await supabase.rpc('set_community_member_role', {
    p_room_id: body.roomId,
    p_target_user_id: body.userId,
    p_new_role: body.role,
    p_actor_user_id: sessionUser.id
  })

  if (error) {
    console.error('Error setting role:', error)
    throw createError({ statusCode: 500, message: 'Ошибка изменения роли' })
  }

  if (!success) {
    throw createError({ statusCode: 403, message: 'Нет прав для изменения ролей (требуется global admin)' })
  }

  return { success: true }
})
