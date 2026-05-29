import bcrypt from 'bcrypt'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = registerSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0].message })
  }

  const { email, password, name, phone } = result.data

  // Reject duplicate emails before trying to insert (avoids a DB unique-constraint crash).
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw createError({ statusCode: 409, message: 'Un compte avec cet email existe déjà' })
  }

  // bcrypt cost factor 12 — slow enough to resist brute-force, fast enough for UX.
  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { email, name, passwordHash, phone }
  })

  // Log the user in immediately after registration.
  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name }
  })

  return { id: user.id, email: user.email, name: user.name }
})
