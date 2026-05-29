import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const form = await readMultipartFormData(event)
  if (!form || form.length === 0) {
    throw createError({ statusCode: 400, message: 'Aucun fichier envoyé' })
  }

  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })

  const urls: string[] = []

  for (const file of form) {
    if (!file.filename || !file.data) continue

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (file.type && !allowedTypes.includes(file.type)) {
      throw createError({
        statusCode: 400,
        message: `Type de fichier non autorisé : ${file.type}`
      })
    }

    // Validate file size (max 5MB)
    if (file.data.length > 5 * 1024 * 1024) {
      throw createError({
        statusCode: 400,
        message: 'Le fichier dépasse la taille maximale de 5 Mo'
      })
    }

    const ext = file.filename.split('.').pop() || 'jpg'
    const filename = `${randomUUID()}.${ext}`
    const filePath = join(uploadDir, filename)

    await writeFile(filePath, file.data)
    urls.push(`/uploads/${filename}`)
  }

  return { urls }
})
