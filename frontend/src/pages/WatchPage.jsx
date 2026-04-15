import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router'
import { motion } from 'motion/react'
import { Eye, Calendar, Share2, Check, Users } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { VideoCard } from '@/components/video/VideoCard'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatViews, timeAgo } from '@/lib/utils'
import { URLS, buildUrl } from '@/lib/urls'

function getLiveStreamKey(hlsUrl = '') {
  const match = /^live\/([^/.]+)\.m3u8$/i.exec(hlsUrl)
  return match?.[1] || ''
}

function getSessionViewerId() {
  const storageKey = 'hexanodes_live_viewer_id'
  let vId = sessionStorage.getItem(storageKey)

  if (!vId) {
    vId = Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem(storageKey, vId)
  }

  return vId
}

export function WatchPage() {
  const { id } = useParams()
  const [video, setVideo] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [liveViewers, setLiveViewers] = useState(0)
  const viewRecorded = useRef(null)
  const viewerIdRef = useRef(getSessionViewerId())
  const prevStatusRef = useRef('')
  const completionToastRef = useRef(null)

  useEffect(() => {
    if (!id) {
      setVideo(null)
      setRelated([])
      setLoading(false)
      prevStatusRef.current = ''
      completionToastRef.current = null
      return
    }

    setLoading(true)

    Promise.all([
      api.videos.getById(id),
      api.videos.getAll().catch(() => []),
    ]).then(([vid, all]) => {
      setVideo(vid)
      const list = Array.isArray(all) ? all : all.videos || []
      setRelated(list.filter((v) => (v._id || v.id) !== id).slice(0, 8))
      if (viewRecorded.current !== id) {
        // Block repeated refresh-based increments for the same browser.
        const storageKey = 'hexanodes_viewed_videos'
        let viewedVideos = []

        try {
          const raw = localStorage.getItem(storageKey)
          viewedVideos = JSON.parse(raw || '[]')
          if (!Array.isArray(viewedVideos)) {
            viewedVideos = []
          }
        } catch {
          viewedVideos = []
        }

        if (!viewedVideos.includes(id)) {
          api.videos.view(id).catch(() => { })
          viewedVideos.push(id)

          try {
            localStorage.setItem(storageKey, JSON.stringify(viewedVideos))
          } catch {
            // Ignore storage write failures and continue without crashing.
          }
        }

        viewRecorded.current = id
      }
    }).catch(() => {
      setVideo(null)
      setRelated([])
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const currentStatus = String(video?.status || '').toLowerCase()
    const prevStatus = prevStatusRef.current

    if (completionToastRef.current !== id && prevStatus === 'processing' && currentStatus === 'ready') {
      toast.success('Video processing finished. Your video is ready to watch!')
      completionToastRef.current = id
    }

    if (completionToastRef.current !== id && prevStatus === 'processing' && currentStatus === 'failed') {
      toast.error('Video processing failed. Please try uploading again.')
      completionToastRef.current = id
    }

    prevStatusRef.current = currentStatus
  }, [id, video?.status])

  useEffect(() => {
    let heartbeatInterval
    let statsInterval

    // Keep live viewer count fresh while a live stream is being watched.
    if (video && String(video.status || '').toLowerCase() === 'live') {
      const parsedStreamKey = getLiveStreamKey(video.hlsUrl)

      if (parsedStreamKey) {
        const sendHeartbeat = () => {
          api.videos.liveHeartbeat(parsedStreamKey, viewerIdRef.current).catch(() => { })
        }

        const fetchStats = () => {
          api.videos.liveStats(parsedStreamKey)
            .then((res) => {
              setLiveViewers(res?.viewers || 0)
            }).catch(() => { })
        }

        sendHeartbeat()
        fetchStats()

        heartbeatInterval = setInterval(sendHeartbeat, 10000)
        statsInterval = setInterval(fetchStats, 10000)
      }
    }

    return () => {
      clearInterval(heartbeatInterval)
      clearInterval(statsInterval)
    }
  }, [video])

  useEffect(() => {
    if (!id) return

    const eventSource = new EventSource(api.videos.eventsUrl(id))

    const onVideoUpdate = (event) => {
      try {
        const next = JSON.parse(event.data)
        setVideo((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            status: next.status ?? prev.status,
            hlsUrl: next.hlsUrl ?? prev.hlsUrl,
            thumbnailUrl: next.thumbnailUrl ?? prev.thumbnailUrl,
            duration: next.duration ?? prev.duration,
          }
        })
      } catch {
        // Ignore malformed events and keep current UI state.
      }
    }

    const onError = () => {
      // Keep connection open; EventSource auto-reconnects on transient failures.
    }

    eventSource.addEventListener('video-update', onVideoUpdate)
    eventSource.addEventListener('error', onError)

    return () => {
      eventSource.removeEventListener('video-update', onVideoUpdate)
      eventSource.removeEventListener('error', onError)
      eventSource.close()
    }
  }, [id])

  useEffect(() => {
    if (!id) return

    const currentStatus = String(video?.status || '').toLowerCase()
    if (currentStatus && currentStatus !== 'processing') return

    const interval = setInterval(() => {
      api.videos.getById(id)
        .then((next) => {
          setVideo((prev) => {
            if (!prev) return next
            return {
              ...prev,
              status: next.status ?? prev.status,
              hlsUrl: next.hlsUrl ?? prev.hlsUrl,
              thumbnailUrl: next.thumbnailUrl ?? prev.thumbnailUrl,
              duration: next.duration ?? prev.duration,
            }
          })
        })
        .catch((err) => {
          if (err?.status === 404) {
            setVideo(null)
          }
        })
    }, 5000)

    return () => clearInterval(interval)
  }, [id, video?.status])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-400 mx-auto">
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
  const isLiveVideo = String(video.status || '').toLowerCase() === 'live'
  const isLiveHls = Boolean(getLiveStreamKey(video.hlsUrl))
  const playbackSrc = video.hlsUrl
    ? (isLiveHls ? buildUrl(URLS.LIVE_BASE, video.hlsUrl) : buildUrl(URLS.MINIO_BASE, video.hlsUrl))
    : ''
  const playbackPoster = video.thumbnailUrl ? buildUrl(URLS.MINIO_BASE, video.thumbnailUrl) : undefined

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-400 mx-auto">
      {/* Main column */}
      <div className="lg:col-span-2 xl:col-span-3 space-y-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <VideoPlayer src={playbackSrc} poster={playbackPoster} autoPlay live={isLiveVideo} />
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
              {isLiveVideo ? (
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-live" />{formatViews(liveViewers)} watching now</span>
              ) : (
                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{formatViews(video.views)} views</span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{timeAgo(video.createdAt)}</span>
              {video.status && <Badge variant={video.status === 'Live' ? 'live' : (video.status === 'Ready' ? 'success' : 'secondary')} className="ml-2">{video.status}</Badge>}
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
