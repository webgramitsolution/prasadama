type RecipientInput = {
  isAdmin: boolean
  override?: string
  ownerEmail?: string | null
  ownerConfirmedAt?: string | null
}

const SAFE_EMAIL = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/

// Customer order emails go only to the order owner's verified account email.
// The billing email typed at checkout is never used as a delivery target.
export function resolveOrderRecipient({ isAdmin, override, ownerEmail, ownerConfirmedAt }: RecipientInput): string {
  if (override) {
    if (!isAdmin) throw new Error('Forbidden')
    if (!SAFE_EMAIL.test(override)) throw new Error('Invalid recipient')
    return override
  }
  if (!ownerEmail || !ownerConfirmedAt || !SAFE_EMAIL.test(ownerEmail)) return ''
  return ownerEmail
}
