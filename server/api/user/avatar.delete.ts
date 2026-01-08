import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireUser(event)
  const userId = sessionUser.id

  const supabase = serverSupabaseServiceRole(event)

  // Get current avatar URL to extract filename
  const { data: user } = await supabase
    .from('users')
    .select('avatar')
    .eq('id', userId)
    .single()

  if (user?.avatar && user.avatar.includes('/avatars/')) {
    // Extract filename from URL
    const filename = user.avatar.split('/avatars/').pop()
    if (filename) {
      // Delete from storage
      await supabase.storage
        .from('avatars')
        .remove([filename])
    }
  }

  // Clear avatar in user record
  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar: null })
    .eq('id', userId)

  if (updateError) {
    console.error('Error clearing user avatar:', updateError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при удалении аватара'
    })
  }

  return { success: true }
})
