import { NextResponse } from 'next/server'
import { getLastRateLimit } from '@/lib/card-api'

export const runtime = 'nodejs'

/** Developer/admin endpoint: last-seen Card API rate-limit headers. */
export async function GET() {
  return NextResponse.json({ rateLimit: getLastRateLimit() })
}
