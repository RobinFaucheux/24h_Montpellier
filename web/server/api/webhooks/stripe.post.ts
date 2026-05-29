import type Stripe from 'stripe'

const TC_PER_PAYMENT = 10

export default defineEventHandler(async (event) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    throw createError({ statusCode: 500, message: 'Webhook secret not configured' })
  }

  const stripe = useStripe()

  const signature = getHeader(event, 'stripe-signature')
  if (!signature) {
    throw createError({ statusCode: 400, message: 'Missing stripe-signature header' })
  }

  const rawBody = await readRawBody(event, false)
  if (!rawBody) {
    throw createError({ statusCode: 400, message: 'Empty body' })
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody as string),
      signature,
      webhookSecret
    )
  } catch (err) {
    console.error('Stripe signature verification failed:', (err as Error).message)
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
