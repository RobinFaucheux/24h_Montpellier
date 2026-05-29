// ScamCoins — the site's internal currency.
// All prices on the platform are displayed in SC, not real money.
export const CURRENCY_SYMBOL = 'SC'
export const CURRENCY_NAME = 'ScamCoins'

export function useCurrency() {
  // Formats a number as a French-locale SC amount, e.g. 1 234,50 SC.
  function formatPrice(amount: number): string {
    return (
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount) +
      ' ' +
      CURRENCY_SYMBOL
    )
  }

  return { formatPrice, CURRENCY_SYMBOL, CURRENCY_NAME }
}
