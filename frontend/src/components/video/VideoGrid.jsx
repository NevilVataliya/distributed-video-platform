import { VideoCard } from './VideoCard'
import { Skeleton } from '@/components/ui/Skeleton'

export function VideoGrid({ videos, loading, emptyMessage = 'No videos found' }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="flex items-start gap-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[60%]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center rounded-2xl border border-dashed border-border bg-muted/30">
        <p className="text-muted-foreground font-medium">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
      {videos.map((video) => {
        const id = video._id || video.id
        return <VideoCard key={id} video={video} />
      })}
    </div>
  )
}
