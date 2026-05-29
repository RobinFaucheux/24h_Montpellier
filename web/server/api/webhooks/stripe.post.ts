import type Stripe from 'stripe'

// ScamCoins credited to the user per successful payment.
const SC_PER_PAYMENT = 10

export default defineEventHandler(async (event) => {
  // Read directly from process.env — bypasses runtimeConfig caching which can
  // hold stale values across hot reloads in dev.
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

  // readRawBody(event, false) returns a Buffer — required by Stripe's signature check,
  // which computes an HMAC over the exact raw bytes. Parsing then re-serializing the body
  // would alter the bytes and break verification.
  const rawBody = await readRawBody(event, false)
  if (!rawBody) throw createError({ statusCode: 400, message: 'Empty body' })

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

    // client_reference_id is appended to the payment link URL by the frontend:
    // ?client_reference_id=<userId> — this is how we know who paid.
    const userId = session.client_reference_id

    if (!userId) {
      console.warn('Stripe webhook: no client_reference_id on session', session.id)
      return { received: true }
    }

    // Guard against stale user IDs (e.g. after a DB wipe).
    // Return 200 so Stripe stops retrying — we just can't credit a non-existent user.
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) {
      console.error(`Stripe webhook: user not found for id=${userId} (session=${session.id})`)
      return { received: true }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: SC_PER_PAYMENT } }
    })
    console.log(`Stripe webhook: +${SC_PER_PAYMENT} SC credited to user ${userId}`)
  }

  // Always return 200 for unhandled event types — Stripe retries on non-2xx responses.
  return { received: true }
})
