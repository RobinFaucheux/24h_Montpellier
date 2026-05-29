import bcrypt from 'bcrypt'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis')
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = loginSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0].message
    })
  }

  const { email, password } = result.data

  // Find user
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Email ou mot de passe incorrect'
    })
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    throw createError({
      statusCode: 401,
      message: 'Email ou mot de passe incorrect'
    })
  }

  // Set session
  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name
  }
})
