import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { motion } from 'motion/react'
import { Eye, Clock, Radio, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export function LivePage() {
  const { streamKey } = useParams()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const hlsUrl = `http://localhost:8080/live/${streamKey}/.m3u8`

  useEffect(() => {
    let interval
    const fetchStats = () => {
      api.videos.liveStats(streamKey)
        .then((data) => setStats(data))
        .catch(() => setStats(null))
        .finally(() => setLoading(false))
    }
    fetchStats()
    interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [streamKey])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full min-h-[85vh] max-w-[1800px] mx-auto">
      {/* Main Stream Area */}
      <div className="xl:col-span-3 space-y-4 flex flex-col">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl overflow-hidden shadow-md bg-black border border-border">
          <VideoPlayer src={hlsUrl} live={true} autoPlay={true} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-5 flex flex-col sm:flex-row gap-5 justify-between items-start sm:items-center shadow-sm flex-shrink-0"
        >
          <div className="flex gap-4 items-center">
            <Avatar alt="Streamer" size="lg" className="border-2 border-primary/20" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-[20px] font-bold text-foreground leading-none">Live Broadcast</h1>
                <Badge variant="live" className="text-[10px] px-1.5 py-0">LIVE</Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground mt-1">@{streamKey}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-foreground bg-secondary/50 py-2 px-4 rounded-lg border border-border">
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="w-4 h-4 text-red-500" /> {stats?.viewerCount || 0}
            </span>
            <span className="text-border mx-1">|</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-muted-foreground" /> {stats?.uptime || '0m'}
            </span>
            <span className="text-border mx-1">|</span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Radio className="w-4 h-4 text-green-500" /> {stats?.isLive ? 'Online' : 'Offline'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Chat Area */}
      <div className="bg-card rounded-xl border border-border flex flex-col h-[600px] xl:h-[calc(100vh-8rem)] shadow-sm">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30 rounded-t-xl">
          <h3 className="font-semibold text-foreground text-sm tracking-wide uppercase">Live Chat</h3>
          <Users className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col justify-end">
          <div className="text-center space-y-1 mb-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Welcome to Chat Room</p>
            <p className="text-[13px] text-muted-foreground">Connecting to persistent server socket...</p>
          </div>
        </div>
        <div className="p-3 border-t border-border bg-muted/10 rounded-b-xl">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Send a message..."
              className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring focus:border-ring placeholder:text-muted-foreground transition-colors disabled:opacity-50"
              disabled
            />
            <Button disabled>Chat</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
