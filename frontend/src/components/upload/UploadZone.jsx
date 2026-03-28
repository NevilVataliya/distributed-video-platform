import { useRef, useState } from 'react'
import { Upload, Film, X, CheckCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export function UploadZone({ onFileSelect, file, onClear }) {
  const [isDragActive, setIsDragActive] = useState(false)
  const inputRef = useRef(null)

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget)) return
    setIsDragActive(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0])
    }
  }

  if (file) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-success/30 bg-success/5 p-6 flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
          <Film className="w-6 h-6 text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
          <p className="text-xs text-text-muted">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
        </div>
        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
        <button
          onClick={onClear}
          className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    )
  }

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'relative rounded-xl border-2 border-dashed p-10 transition-all duration-300 cursor-pointer',
        'flex flex-col items-center justify-center text-center gap-4',
        isDragActive
          ? 'border-accent bg-accent/5 scale-[1.01]'
          : 'border-border hover:border-accent/40 hover:bg-bg-hover/50'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleChange}
        className="hidden"
      />

      <motion.div
        animate={isDragActive ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300',
          isDragActive ? 'bg-accent/20' : 'bg-bg-elevated'
        )}
      >
        <Upload className={cn('w-7 h-7 transition-colors', isDragActive ? 'text-accent' : 'text-text-muted')} />
      </motion.div>

      <div>
        <p className="text-sm font-medium text-text-primary">
          {isDragActive ? 'Drop your video here' : 'Drag & drop your video here'}
        </p>
        <p className="text-xs text-text-muted mt-1">
          or <span className="text-accent hover:underline">browse files</span> • MP4, MOV, AVI, MKV, WebM
        </p>
      </div>

      {isDragActive && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-accent/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
    </div>
  )
}
