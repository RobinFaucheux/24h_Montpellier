import type Stripe from 'stripe'

const TC_PER_PAYMENT = 10

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = useStripe()

  const signature = getHeader(event, 'stripe-signature')
  if (!signature) {
    throw createError({ statusCode: 400, message: 'Missing stripe-signature header' })
  }

  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({ statusCode: 400, message: 'Empty body' })
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret)
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid Stripe signature' })
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const userId = session.client_reference_id

    if (!userId) {
      return { received: true }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: TC_PER_PAYMENT } }
    })
  }

  return { received: true }
})
