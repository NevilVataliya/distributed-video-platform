import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router'
import { motion } from 'motion/react'
import { Eye, Calendar, Share2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { VideoCard } from '@/components/video/VideoCard'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatViews, timeAgo } from '@/lib/utils'

export function WatchPage() {
  const { id } = useParams()
  const [video, setVideo] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const viewRecorded = useRef(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.videos.getById(id),
      api.videos.getAll().catch(() => []),
    ]).then(([vid, all]) => {
      setVideo(vid)
      const list = Array.isArray(all) ? all : all.videos || []
      setRelated(list.filter((v) => (v._id || v.id) !== id).slice(0, 8))
      if (viewRecorded.current !== id) {
        api.videos.view(id).catch(() => { })
        viewRecorded.current = id
      }
    }).catch(() => {
      setVideo(null)
    }).finally(() => setLoading(false))
  }, [id])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
        <div className="xl:col-span-2 space-y-4">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-10 w-48" /></div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold text-foreground">Video not found</h2>
        <p className="text-muted-foreground text-sm mt-2">This video may have been removed or doesn't exist.</p>
        <Link to="/" className="mt-4"><Button>Go home</Button></Link>
      </div>
    )
  }

  const uploaderName = video.owner?.fullName || 'Unknown'
  const uploaderUsername = video.owner?.username || 'Unknown'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-[1600px] mx-auto">
      {/* Main column */}
      <div className="lg:col-span-2 xl:col-span-3 space-y-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* {console.log(video)} */}
          <VideoPlayer src={video.hlsUrl} poster={`http://localhost:9000/${video.thumbnailUrl}`} autoPlay />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <h1 className="text-[22px] font-bold text-foreground leading-tight">{video.title}</h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3 bg-secondary/30 rounded-full pr-4 pl-1 py-1 border border-border/50">
              <Link to={`/channel/${uploaderUsername}`} className="outline-none focus:ring-2 focus:ring-ring rounded-full">
                <Avatar alt={uploaderName} />
              </Link>
              <div className="flex flex-col leading-tight">
                <Link to={`/channel/${uploaderUsername}`} className="font-semibold text-[15px] text-foreground hover:text-primary transition-colors">
                  {uploaderName}
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" className="rounded-full shadow-sm" onClick={handleShare}>
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                Share
              </Button>
            </div>
          </div>

          {/* Video info card */}
          <div className="rounded-2xl bg-muted/40 hover:bg-muted/60 transition-colors border border-border p-4 space-y-2 cursor-pointer">
            <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
              <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{formatViews(video.views)} views</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{timeAgo(video.createdAt)}</span>
              {video.status && <Badge variant={video.status === 'Ready' ? 'success' : 'secondary'} className="ml-2">{video.status}</Badge>}
            </div>
            {video.description && (
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap mt-2">
                {video.description}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Sidebar: related */}
      <div className="lg:col-span-1 space-y-6">
        <h3 className="text-sm font-bold text-foreground capitalize tracking-wide">Up Next</h3>
        {related.length > 0 ? (
          <div className="flex flex-col gap-4">
            {related.map(video => <VideoCard key={video._id || video.id} video={video} />)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No related videos</p>
        )}
      </div>
    </div>
  )
}
