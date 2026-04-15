import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Trash2, Edit2, Play, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { timeAgo, formatViews } from '@/lib/utils'
import { URLS, buildUrl } from '@/lib/urls'

export function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Inline editing state
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editThumbnail, setEditThumbnail] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  // Wait for auth to resolve
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (!user) return
    let mounted = true
    setLoading(true)
    api.users.getVideos(user.username)
      .then((data) => {
        if (mounted) setVideos(Array.isArray(data) ? data : data.videos || [])
      })
      .catch(() => setVideos([]))
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [user])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this video?')) return
    try {
      await api.videos.delete(id)
      setVideos((prev) => prev.filter((v) => (v._id || v.id) !== id))
      toast.success('Video deleted')
    } catch (err) {
      toast.error('Failed to delete video')
    }
  }

  const startEdit = (video) => {
    const id = video._id || video.id
    setEditingId(id)
    setEditTitle(video.title)
    setEditDescription(video.description || '')
    setEditThumbnail(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
    setEditThumbnail(null)
  }

  const saveEdit = async (id) => {
    if (!editTitle.trim()) {
      toast.error('Title cannot be empty')
      return
    }
    setIsSaving(true)
    try {
      const hasThumb = editThumbnail instanceof File;
      const payload = hasThumb ? new FormData() : { title: editTitle.trim(), description: editDescription.trim() };
      
      if (hasThumb) {
        payload.append('title', editTitle.trim());
        payload.append('description', editDescription.trim());
        payload.append('thumbnail', editThumbnail);
      }

      const raw = await api.videos.update(id, payload, hasThumb)
      const updatedVideo = raw.video || raw
      
      setVideos((prev) => prev.map(v => {
        if ((v._id || v.id) === id) {
          return { ...v, ...updatedVideo, title: editTitle.trim(), description: editDescription.trim() }
        }
        return v
      }))
      toast.success('Video updated')
      setEditingId(null)
    } catch (err) {
      toast.error('Failed to update video')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || !user) return null

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-bold font-display text-foreground tracking-tight">Channel Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Manage your uploaded content</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Content</h2>
          <Link to="/upload"><Button size="sm" className="rounded-full shadow-sm">Upload Video</Button></Link>
        </div>

        <div className="space-y-3 bg-card border border-border rounded-xl shadow-sm p-4">
          <div className="hidden sm:grid grid-cols-12 gap-4 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground px-4 border-b border-border">
            <div className="col-span-7">Video</div>
            <div className="col-span-3 text-right">Visibility & Status</div>
            <div className="col-span-2 text-right">Views</div>
          </div>
          
          <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-md" />)
          ) : videos.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <Play className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No videos yet</h3>
              <p className="text-muted-foreground text-sm mt-1">Ready to share your content with the world?</p>
            </div>
          ) : (
            videos.map((vid, i) => {
              const id = vid._id || vid.id
              const isEditing = editingId === id

              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="grid sm:grid-cols-12 gap-4 items-center group transition-colors hover:bg-muted/30 p-2 rounded-lg border border-transparent hover:border-border/50"
                >
                  <div className="sm:col-span-7 flex items-start gap-4">
                    <div className="relative w-24 sm:w-32 aspect-video rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border shadow-sm">
                      {vid.thumbnailUrl ? (
                        <img src={buildUrl(URLS.MINIO_BASE, vid.thumbnailUrl)} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                          <Play className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col min-w-0 w-full pr-4 py-1">
                      {isEditing ? (
                        <div className="space-y-3 w-full max-w-lg mt-2 mb-2" onClick={e => e.stopPropagation()}>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground font-medium">Title</label>
                            <Input 
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-9 text-sm w-full"
                              autoFocus
                              disabled={isSaving}
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground font-medium">Description</label>
                            <Textarea 
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="min-h-[80px] text-sm w-full resize-y"
                              disabled={isSaving}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground font-medium">New Thumbnail (optional)</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setEditThumbnail(e.target.files[0])}
                              className="block w-full text-sm text-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer border border-border rounded-md p-1.5"
                              disabled={isSaving}
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button size="sm" className="h-8 px-4 text-xs font-semibold" onClick={() => saveEdit(id)} disabled={isSaving}>
                              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />} Save Changes
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 px-4 text-xs" onClick={cancelEdit} disabled={isSaving}>
                              <X className="w-3.5 h-3.5 mr-1.5" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors cursor-pointer" title={vid.title} onClick={() => navigate(`/watch/${id}`)}>
                            {vid.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{vid.description || 'No description'}</p>
                          <p className="text-[11px] text-muted-foreground mt-2 sm:hidden">{formatViews(vid.views)} views • {timeAgo(vid.createdAt)}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:flex col-span-3 justify-end items-center gap-2">
                     <Badge variant={vid.status === 'Ready' ? 'success' : 'secondary'} className="shadow-none rounded-sm px-1.5">{vid.status || 'Draft'}</Badge>
                  </div>

                  <div className="hidden sm:flex col-span-2 justify-end items-center gap-1.5 text-sm font-medium text-foreground pr-2">
                    <span className="mr-3">{formatViews(vid.views)}</span>
                    {!isEditing && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startEdit(vid)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )
            })
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
