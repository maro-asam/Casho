/** paymentProvider values of orders paid on a hosted checkout. */
export const ONLINE_PAYMENT_PROVIDERS = ["PAYMOB", "KASHIER"];

/** Online orders only become real once the gateway confirms the payment. */
export function isOnlinePaymentProvider(provider: string | null | undefined) {
  return !!provider && ONLINE_PAYMENT_PROVIDERS.includes(provider);
}
