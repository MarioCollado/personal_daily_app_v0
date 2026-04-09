'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2, Rocket } from 'lucide-react'
import { feedback } from '@/styles/components'
import { useI18n } from '@/contexts/I18nContext'

export default function LoginPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      } else {
        const redirectTo = `${window.location.origin}/auth/callback`
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        })
        if (error) throw error
        if (data.user && data.user.identities?.length === 0) {
          throw new Error(t('auth.already_registered'))
        }
        setMessage(t('auth.check_email'))
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
            <Rocket className="w-8 h-8 text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-main">VITAL</h1>
          <p className="text-muted text-sm mt-1">{t('auth.subtitle')}</p>
        </div>

        <div className="card p-6 space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="email"
                placeholder={t('auth.email')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field pl-10"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="password"
                placeholder={t('auth.password')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field pl-10"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          </div>

          {error && <p className={feedback.error}>{error}</p>}
          {message && <p className={feedback.success}>{message}</p>}

          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? t('auth.enter') : t('auth.signup')}
          </button>
        </div>

        <p className="text-center text-sm text-muted mt-4">
          {mode === 'login' ? t('auth.no_account') : t('auth.already_account')}{' '}
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-brand-400 hover:text-brand-300 transition-colors">
            {mode === 'login' ? t('auth.signup_action') : t('auth.login_action')}
          </button>
        </p>
      </div>
    </div>
  )
}
