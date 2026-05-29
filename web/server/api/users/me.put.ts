import bcrypt from 'bcrypt'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional()
}).refine(
  (data) => {
    if (data.newPassword && !data.currentPassword) return false
    return true
  },
  { message: 'Le mot de passe actuel est requis pour changer de mot de passe' }
)

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody(event)

  const result = updateSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0].message
    })
  }

  const { name, phone, city, region, currentPassword, newPassword } = result.data

  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (phone !== undefined) updateData.phone = phone
  if (city !== undefined) updateData.city = city
  if (region !== undefined) updateData.region = region

  // Password change
  if (newPassword && currentPassword) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) throw createError({ statusCode: 404, message: 'Utilisateur non trouvé' })

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      throw createError({ statusCode: 400, message: 'Mot de passe actuel incorrect' })
    }

    updateData.passwordHash = await bcrypt.hash(newPassword, 12)
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      city: true,
      region: true
    }
  })

  // Update session with new name
  if (name) {
    await setUserSession(event, {
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name
      }
    })
  }

  return updated
})
