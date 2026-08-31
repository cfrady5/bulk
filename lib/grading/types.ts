/** Future slab-scanning architecture: cert lookup behind a provider interface. */

export interface CertificationDetails {
  certNumber: string
  grader: string
  grade: string
  playerName?: string
  year?: string
  setName?: string
  cardNumber?: string
  parallel?: string
  labelText?: string
}

export interface GradingProvider {
  readonly name: string
  /** Returns true when credentials are configured and lookups can be attempted. */
  isConfigured(): boolean
  lookupCertification(certNumber: string): Promise<CertificationDetails | null>
}
