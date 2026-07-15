'use client'

import { useState } from 'react'
import { Loader2, LockKeyhole } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

/**
 * Centered login card. On success calls onLoggedIn().
 */
export function AdminLogin({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        toast({ title: 'Welcome back', description: 'You are now signed in.' })
        onLoggedIn()
        return
      }
      const msg = 'Incorrect password. Please try again.'
      setError(msg)
      toast({ title: 'Sign-in failed', description: msg, variant: 'destructive' })
    } catch {
      const msg = 'Network error. Please try again.'
      setError(msg)
      toast({ title: 'Sign-in failed', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
            <LockKeyhole className="size-5" />
          </div>
          <CardTitle className="font-serif text-2xl">rathin.</CardTitle>
          <CardDescription>Sign in to the admin panel</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button
              type="submit"
              className="w-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90"
              disabled={loading || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Signing in…
                </>
              ) : (
                'Log in'
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Default password: <code className="font-mono">admin123</code> — change it via the{' '}
              <code className="font-mono">ADMIN_PASSWORD</code> environment variable.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
