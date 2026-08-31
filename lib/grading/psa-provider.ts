import 'server-only'
import type { CertificationDetails, GradingProvider } from './types'

/**
 * PSA cert lookup provider. Requires PSA_API_TOKEN; until credentials are
 * configured, lookups return null and the UI falls back to manual entry.
 * We never fabricate PSA data.
 */
export const psaProvider: GradingProvider = {
  name: 'psa',
  isConfigured(): boolean {
    return Boolean(process.env.PSA_API_TOKEN)
  },
  async lookupCertification(certNumber: string): Promise<CertificationDetails | null> {
    if (!this.isConfigured()) return null
    const res = await fetch(
      `https://api.psacard.com/publicapi/cert/GetByCertNumber/${encodeURIComponent(certNumber)}`,
      { headers: { authorization: `bearer ${process.env.PSA_API_TOKEN}` }, cache: 'no-store' },
    )
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
