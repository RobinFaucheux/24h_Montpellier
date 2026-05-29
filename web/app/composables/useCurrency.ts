export const CURRENCY_SYMBOL = 'TC'
export const CURRENCY_NAME = 'TrocCoins'

export function useCurrency() {
  function formatPrice(amount: number): string {
    return (
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount) +
      ' ' +
      CURRENCY_SYMBOL
    )
  }

  return { formatPrice, CURRENCY_SYMBOL, CURRENCY_NAME }
}
