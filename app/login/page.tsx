'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Field, inputClass } from '@/components/ui'
import { isSupabaseConfigured } from '@/lib/data/types'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!isSupabaseConfigured()) {
    return (
      <main className="px-3.5 pt-16">
        <Card>
          <h1 className="mb-2 text-lg font-black text-ink">Accounts are off in Local Mode</h1>
          <p className="text-[14px] font-medium text-ink-soft">
            This install stores data on-device and doesn&apos;t need a login. To enable
            multi-user sync with Supabase auth, set NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY (see README).
          </p>
        </Card>
      </main>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const supabase = createClient()
    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) {
      setMessage(error.message)
    } else if (mode === 'signup') {
      setMessage('Account created — check your email if confirmation is required.')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <main className="px-3.5 pt-16">
      <Card>
        <h1 className="mb-4 text-lg font-black text-ink">
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </h1>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </Field>
          {message && (
            <p className="rounded-xl bg-surface-muted px-3 py-2 text-[13px] font-medium text-ink">
              {message}
            </p>
          )}
          <button
            disabled={busy}
            className="w-full rounded-2xl bg-ink py-3 text-[15px] font-black tracking-wide text-white uppercase disabled:opacity-50"
          >
            {mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="mt-3 w-full text-center text-[13px] font-bold text-accent"
        >
          {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
        </button>
      </Card>
    </main>
  )
}
