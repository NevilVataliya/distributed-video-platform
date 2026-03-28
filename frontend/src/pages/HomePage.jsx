import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import { Flame, Clock, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { VideoGrid } from '@/components/video/VideoGrid'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'recent', label: 'Recent', icon: Clock },
]

export function HomePage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')

  useEffect(() => {
    setLoading(true)
    api.videos.getAll()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.videos || []
        setVideos(list)
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = query
    ? videos.filter((v) =>
        v.title?.toLowerCase().includes(query.toLowerCase()) ||
        (typeof v.uploader === 'string' ? v.uploader : v.uploader?.username || '').toLowerCase().includes(query.toLowerCase())
      )
    : videos

  const sorted = [...filtered].sort((a, b) => {
    if (activeTab === 'trending') return (b.views || 0) - (a.views || 0)
    if (activeTab === 'recent') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    return 0
  })

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {query ? (
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Search results for "<span className="text-primary">{query}</span>"
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{sorted.length} video{sorted.length !== 1 ? 's' : ''} found</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-foreground font-display tracking-tight leading-tight">
              Discover <span className="text-primary font-bold">Videos</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">Stream, watch, and explore content from creators worldwide</p>
          </>
        )}
      </motion.div>

      {/* Tabs */}
      {!query && (
        <div className="flex items-center gap-1 mb-8 p-1 rounded-xl bg-muted/60 border border-border w-fit shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="home-tabs-bg"
                  className="absolute inset-0 rounded-lg bg-background border border-border shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative flex items-center gap-1.5 z-10">
                <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-primary" : "text-muted-foreground")} />
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <VideoGrid videos={sorted} loading={loading} emptyMessage={query ? 'No videos match your search' : 'No videos uploaded yet'} />
    </div>
  )
}
