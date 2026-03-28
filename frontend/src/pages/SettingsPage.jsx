import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Radio, RefreshCw, Loader2, Copy, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [streamKey, setStreamKey] = useState('')
  const [keyGenerating, setKeyGenerating] = useState(false)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  // Fetch the current user to get their stream key if it isn't loaded (user object from context might have it, but usually safest to pull it raw or just use user.streamKey if available)
  useEffect(() => {
    if (user && user.streamKey) {
      setStreamKey(user.streamKey)
    } else if (user && !user.streamKey) {
      api.auth.me().then(data => {
        const d = data.user || data
        if (d.streamKey) setStreamKey(d.streamKey)
      }).catch(() => {})
    }
  }, [user])

  const handleRegenerateKey = async () => {
    setKeyGenerating(true)
    try {
      const data = await api.users.regenerateStreamKey()
      setStreamKey(data.streamKey)
      toast.success('Stream key regenerated successfully')
    } catch (err) {
      toast.error('Failed to regenerate stream key')
    } finally {
      setKeyGenerating(false)
    }
  }

  const copyKey = () => {
    if (!streamKey) return
    navigator.clipboard.writeText(streamKey).then(() => {
      toast.success('Stream key copied to clipboard')
    }).catch(() => toast.error('Failed to copy'))
  }

  if (authLoading || !user) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-bold font-display text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Manage your account preferences and livestreaming keys</p>
      </div>

      <div className="space-y-6">
        {/* Stream Settings */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm relative overflow-hidden max-w-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-foreground pointer-events-none">
            <Radio className="w-32 h-32" />
          </div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
              <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Live Streaming</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6 relative z-10 max-w-xl leading-relaxed">
            Use this secure stream key to connect your broadcasting software (OBS Studio, XSplit, Streamlabs) to HexaNodes ingest servers. Keep this key secret to prevent unauthorized broadcasts on your channel.
          </p>
          
          <div className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                RTMP Stream Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={streamKey || ''}
                    readOnly
                    placeholder="Generating key..."
                    className="font-mono text-sm bg-muted/50 font-medium pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-[8px] p-1 text-muted-foreground hover:text-foreground transition-colors rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring bg-transparent"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <Button variant="secondary" onClick={copyKey} disabled={!streamKey} className="shrink-0 group">
                  <Copy className="w-4 h-4 mr-2 text-muted-foreground group-hover:text-foreground transition-colors" /> Copy
                </Button>
              </div>
            </div>
            
            <div className="pt-2 border-t border-border/50">
              <Button variant="outline" className="text-foreground hover:bg-muted" onClick={handleRegenerateKey} disabled={keyGenerating}>
                {keyGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Regenerate Key
              </Button>
              <p className="text-xs text-muted-foreground mt-2 inline-block ml-4 align-middle">
                Warning: Regenerating will invalidate your active stream key.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
