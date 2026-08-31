import 'server-only'
import type { CertificationDetails, GradingProvider } from './types'

/**
 * PSA cert lookup provider. Reads PSA_API_TOKEN (or PSA_API_KEY); until
 * credentials are configured, lookups return null and the UI falls back to
 * manual entry. We never fabricate PSA data.
 */

function psaToken(): string | undefined {
  return process.env.PSA_API_TOKEN ?? process.env.PSA_API_KEY
}

/** Thrown when PSA rejects the credentials/account rather than the cert. */
export class PsaAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PsaAccessError'
  }
}

export const psaProvider: GradingProvider = {
  name: 'psa',
  isConfigured(): boolean {
    return Boolean(psaToken())
  },
  async lookupCertification(certNumber: string): Promise<CertificationDetails | null> {
    const token = psaToken()
    if (!token) return null
    const res = await fetch(
      `https://api.psacard.com/publicapi/cert/GetByCertNumber/${encodeURIComponent(certNumber)}`,
      { headers: { authorization: `bearer ${token}` }, cache: 'no-store' },
    )
    if (res.status === 401 || res.status === 403) {
      let detail = ''
      try {
        detail = ((await res.json()) as { Message?: string }).Message ?? ''
      } catch {
        // non-JSON error body; generic message below is enough
      }
      throw new PsaAccessError(
        detail || 'PSA rejected the API credentials',
      )
    }
    if (!res.ok) return null
    const body = (await res.json()) as {
      PSACert?: {
        CertNumber?: string
        CardGrade?: string
        Subject?: string
        Year?: string
        Brand?: string
        CardNumber?: string
        Variety?: string
        LabelType?: string
      }
    }
    const cert = body.PSACert
    if (!cert?.CertNumber) return null
    return {
      certNumber: cert.CertNumber,
      grader: 'PSA',
      grade: cert.CardGrade ?? '',
      playerName: cert.Subject,
      year: cert.Year,
      setName: cert.Brand,
      cardNumber: cert.CardNumber,
      parallel: cert.Variety,
      labelText: cert.LabelType,
    }
  },
}
