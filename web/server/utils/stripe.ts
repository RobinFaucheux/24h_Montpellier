import Stripe from 'stripe'

// Singleton — one Stripe client for the lifetime of the server process.
let _stripe: Stripe | null = null

export function useStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    // Fail loudly so misconfigured deployments are caught immediately.
    if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    _stripe = new Stripe(key, { apiVersion: '2025-05-28.basil' })
  }
  return _stripe
}
