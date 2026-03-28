import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { motion } from 'motion/react'
import { api } from '@/lib/api'
import { VideoGrid } from '@/components/video/VideoGrid'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

export function ChannelPage() {
  const { username } = useParams()
  const [videos, setVideos] = useState([])
  const [fullName, setfullName] = useState()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.users.getVideos(username)
      .then((data) => {
        setVideos(Array.isArray(data) ? data : data.videos || []);
        setfullName(Array.isArray(data) && data.length>0 && data[0]?.owner?.fullName || username)
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false))
  }, [username])

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      {/* Channel Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
      >
        <div className="h-32 sm:h-56 bg-gradient-to-r from-primary to-blue-500 w-full" />
        <div className="px-6 pb-6 pt-0 relative sm:px-10 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 -mt-12 sm:-mt-16">
          <Avatar
            alt={fullName}
            className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-card shadow-lg text-3xl sm:text-4xl"
          />
          <div className="flex-1 text-center sm:text-left mb-2 mt-4 sm:mt-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground tracking-tight">
              {fullName}
            </h1>
            <p className="text-muted-foreground mt-1">@{username}</p>
          </div>
        </div>
      </motion.div>

      {/* Videos Map */}
      <div className="px-2">
        <h2 className="text-xl font-semibold text-foreground mb-6 pb-2 border-b border-border tracking-tight">Uploads</h2>
        <VideoGrid videos={videos} loading={loading} emptyMessage={`${username} hasn't uploaded any videos yet`} />
      </div>
    </div>
  )
}
