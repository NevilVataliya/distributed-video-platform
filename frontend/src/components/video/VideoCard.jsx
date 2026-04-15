import { useState } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { Play } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { timeAgo, formatViews, formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { URLS, buildUrl } from '@/lib/urls'

export function VideoCard({ video }) {
  const [isHovered, setIsHovered] = useState(false)
  const id = video._id || video.id
  // console.log(video)
  const uploaderName = video.owner?.fullName || 'Unknown'
  const uploaderUsername = video.owner?.username || 'Unknown'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative flex flex-col gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail Area */}
      <Link to={`/watch/${id}`} className="block relative aspect-video w-full overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background">
        {video.thumbnailUrl ? (
          <img
            src={buildUrl(URLS.MINIO_BASE, video.thumbnailUrl)}
            alt={video.title}
            className={cn(
              "h-full w-full object-cover transition-transform duration-500",
              isHovered ? "scale-105" : "scale-100"
            )}
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-tr from-muted to-secondary flex items-center justify-center">
            <Play className="h-10 w-10 text-muted-foreground/50 transition-transform duration-500 group-hover:scale-110" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Status indicator */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {video.status && (
            <Badge variant={video.status === 'Ready' ? 'success' : 'secondary'} className="bg-background/80 backdrop-blur-md">
              {video.status}
            </Badge>
          )}
        </div>

        {/* Duration badge */}
        {video.duration ? (
          <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white shadow-sm backdrop-blur-sm">
            {formatDuration(video.duration)}
          </div>
        ) : null}
      </Link>

      {/* Meta Area */}
      <div className="flex items-start gap-3">
        <Link to={`/channel/${uploaderUsername}`} className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
          <Avatar alt={uploaderName} className="h-9 w-9 border-none shadow-sm" />
        </Link>
        <div className="flex flex-col overflow-hidden leading-tight">
          <Link to={`/watch/${id}`} className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
            <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors" title={video.title}>
              {video.title}
            </h3>
          </Link>
          <div className="mt-1 flex flex-col gap-0.5 text-[13px] text-muted-foreground">
            <Link to={`/channel/${uploaderUsername}`} className="hover:text-foreground transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
              {uploaderName}
            </Link>
            <div className="flex items-center gap-1.5">
              <span>{formatViews(video.views)} views</span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
              <span>{timeAgo(video.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
