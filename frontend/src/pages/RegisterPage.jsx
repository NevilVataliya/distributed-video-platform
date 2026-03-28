import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { MonitorPlay, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { fullName, username, email, password } = form
    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setError('All fields are required'); return
    }
    setLoading(true)
    setError('')
    try {
      await register({ fullName: fullName.trim(), username: username.trim(), email: email.trim(), password })
      toast.success('Account created! Welcome to HexaNodes 🚀')
      navigate('/')
    } catch (err) {
      setError(err.message || 'Registration failed')
      toast.error('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[400px]"
      >
        <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-5 ring-4 ring-primary/10">
              <MonitorPlay className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">Create an account</h1>
            <p className="text-sm text-muted-foreground mt-2">Join the content revolution on HexaNodes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" placeholder="John Doe" value={form.fullName} onChange={set('fullName')} className="h-10" />
            <Input label="Username" placeholder="johndoe123" value={form.username} onChange={set('username')} autoComplete="username" className="h-10" />
            <Input label="Email" type="email" placeholder="john@example.com" value={form.email} onChange={set('email')} autoComplete="email" className="h-10" />
            
            <div className="relative">
              <Input
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="Secure password"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
                className="h-10 pr-10"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-[34px] p-1 text-muted-foreground hover:text-foreground transition-colors rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-sm text-destructive font-medium border-l-2 border-destructive pl-3 py-1">
                 {error}
               </motion.div>
            )}

            <Button type="submit" className="w-full h-11 mt-2 text-[15px] font-semibold tracking-wide" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm border-t border-border/60 pt-6">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="font-semibold text-foreground hover:text-primary transition-colors underline underline-offset-4 decoration-border hover:decoration-primary">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
