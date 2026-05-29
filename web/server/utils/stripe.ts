import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function useStripe(): Stripe {
  if (!_stripe) {
    const config = useRuntimeConfig()
    _stripe = new Stripe(config.stripeSecretKey, { apiVersion: '2025-05-28.basil' })
  }
  return _stripe
}
