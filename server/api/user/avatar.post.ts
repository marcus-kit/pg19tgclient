import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireUser(event)
  const userId = sessionUser.id

  // Read multipart form data
  const formData = await readFormData(event)
  const file = formData.get('file') as File

  if (!file || !(file instanceof File)) {
    throw createError({
      statusCode: 400,
      message: 'Файл не загружен'
    })
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw createError({
      statusCode: 400,
      message: 'Только изображения разрешены'
    })
  }

  // Validate file size (5 MB)
  if (file.size > 5 * 1024 * 1024) {
    throw createError({
      statusCode: 400,
      message: 'Размер файла не должен превышать 5 МБ'
    })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${userId}.${ext}`

  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  // Upload to Supabase Storage (overwrite if exists)
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: true
    })

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке файла'
    })
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filename)

  const avatarUrl = urlData.publicUrl

  // Update user record with avatar URL
  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar: avatarUrl })
    .eq('id', userId)

  if (updateError) {
    console.error('Error updating user avatar:', updateError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при сохранении аватара'
    })
  }

  return {
    success: true,
    avatar: avatarUrl
  }
})
