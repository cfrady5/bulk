import { NextResponse } from 'next/server'
import { psaProvider } from '@/lib/grading/psa-provider'

export const runtime = 'nodejs'

/** GET /api/grading/psa — whether PSA cert lookup is available. */
export async function GET() {
  return NextResponse.json({ configured: psaProvider.isConfigured() })
}

/**
 * POST /api/grading/psa  { certNumber: string }
 * Returns 501 until PSA_API_TOKEN is configured — the UI then falls back to
 * manual cert entry. Never returns fabricated cert data.
 */
export async function POST(request: Request) {
  let body: { certNumber?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const certNumber = typeof body.certNumber === 'string' ? body.certNumber.trim() : ''
  if (!certNumber) {
    return NextResponse.json({ error: 'certNumber is required' }, { status: 400 })
  }
  if (!psaProvider.isConfigured()) {
    return NextResponse.json(
      { error: 'PSA lookup is not configured yet. Enter the cert details manually.' },
      { status: 501 },
    )
  }
  try {
    const cert = await psaProvider.lookupCertification(certNumber)
    if (!cert) {
      return NextResponse.json({ error: 'Cert not found' }, { status: 404 })
    }
    return NextResponse.json({ cert })
  } catch {
    return NextResponse.json({ error: 'PSA lookup failed' }, { status: 502 })
  }
}
