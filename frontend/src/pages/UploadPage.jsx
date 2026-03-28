import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Upload, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { UploadZone } from '@/components/upload/UploadZone'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'

export function UploadPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  const handleUpload = useCallback(async () => {
    if (!file || !title.trim()) {
      toast.error('Please select a file and enter a title')
      return
    }
    const formData = new FormData()
    formData.append('video', file)
    formData.append('title', title.trim())
    if (description.trim()) formData.append('description', description.trim())

    setUploading(true)
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 90))
    }, 500)

    try {
      const data = await api.videos.upload(formData)
      clearInterval(interval)
      setProgress(100)
      toast.success('Video uploaded successfully! Processing will begin shortly.')
      setTimeout(() => navigate(`/watch/${data.id || data._id}`), 1500)
    } catch (err) {
      clearInterval(interval)
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [file, title, description, navigate])

  if (authLoading || !user) return null

  return (
    <div className="max-w-3xl mx-auto py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 border-b border-border pb-6">
        <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">Upload Video</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Share your content with the HexaNodes community.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-8">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <UploadZone file={file} onFileSelect={setFile} onClear={() => setFile(null)} />
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-4">Details</h2>
          <Input label="Title (required)" placeholder="Add a title that describes your video" value={title} onChange={(e) => setTitle(e.target.value)} disabled={uploading} className="text-base h-11" />
          <Textarea label="Description" placeholder="Tell your viewers what your video is about..." value={description} onChange={(e) => setDescription(e.target.value)} disabled={uploading} className="min-h-[140px] text-base" />
        </div>

        {uploading && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 bg-card border border-border p-6 rounded-xl shadow-sm">
             <div className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2 text-foreground">
                {progress < 100 ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                {progress < 100 ? 'Uploading and Processing...' : 'Upload Complete'}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary overflow-hidden border border-border/50">
              <motion.div className="h-full rounded-full bg-primary relative overflow-hidden" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }}>
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </motion.div>
            </div>
          </motion.div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={handleUpload} disabled={!file || !title.trim() || uploading} size="lg" className="w-full sm:w-auto min-w-[160px] rounded-full shadow-md">
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading...</> : <><Upload className="w-4 h-4 mr-2" /> Publish Video</>}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
