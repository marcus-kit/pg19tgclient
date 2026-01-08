// POST /api/community/upload/image
// Загрузка изображения в Supabase Storage

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseServer()

  // Авторизация
  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  // Читаем multipart form data
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'Файл не найден' })
  }

  const fileField = formData.find(f => f.name === 'file')
  if (!fileField || !fileField.data) {
    throw createError({ statusCode: 400, message: 'Файл не найден' })
  }

  const file = fileField.data
  const filename = fileField.filename || 'image.jpg'
  const mimeType = fileField.type || 'image/jpeg'

  // Валидация размера (5 MB max)
  if (file.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 400, message: 'Максимальный размер файла: 5 МБ' })
  }

  // Валидация типа
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(mimeType)) {
    throw createError({ statusCode: 400, message: 'Разрешены только изображения (JPEG, PNG, GIF, WebP)' })
  }

  // Генерируем уникальное имя файла
  const ext = filename.split('.').pop() || 'jpg'
  const uniqueName = `${sessionUser.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

  // Загружаем в Supabase Storage
  const { data, error } = await supabase.storage
    .from('community-images')
    .upload(uniqueName, file, {
      contentType: mimeType,
      upsert: false
    })

  if (error) {
    console.error('Upload error:', error)
    throw createError({ statusCode: 500, message: 'Ошибка загрузки файла' })
  }

  // Получаем публичный URL
  const { data: { publicUrl } } = supabase.storage
    .from('community-images')
    .getPublicUrl(data.path)

  return {
    url: publicUrl,
    width: 0,  // TODO: получить размеры через sharp если нужно
    height: 0
  }
})
