import { useRef, useEffect, useState, useCallback } from 'react'
import Hls from 'hls.js'
import {
  Play, Pause, Maximize, Minimize, Volume2, VolumeX,
  SkipForward, SkipBack, Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'

export function VideoPlayer({ src, poster, autoPlay = false, live = false }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const hlsRef = useRef(null)
  const hideTimer = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [buffered, setBuffered] = useState(0)

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    if (src.endsWith('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: live })
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) video.play().catch(() => {})
      })
      hlsRef.current = hls
      return () => { hls.destroy(); hlsRef.current = null }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      if (autoPlay) video.play().catch(() => {})
    } else {
      video.src = src
      if (autoPlay) video.play().catch(() => {})
    }
  }, [src, autoPlay, live])

  // Video event handlers
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => setCurrent(v.currentTime)
    const onDur = () => setDuration(v.duration || 0)
    const onProgress = () => {
      if (v.buffered.length > 0) {
        setBuffered(v.buffered.end(v.buffered.length - 1))
      }
    }
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onDur)
    v.addEventListener('progress', onProgress)
    return () => {
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('loadedmetadata', onDur)
      v.removeEventListener('progress', onProgress)
    }
  }, [])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.paused ? v.play() : v.pause()
  }, [])

  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }, [])

  const changeVolume = useCallback((val) => {
    const v = videoRef.current
    if (!v) return
    v.volume = val
    setVolume(val)
    if (val > 0 && v.muted) { v.muted = false; setMuted(false) }
  }, [])

  const seek = useCallback((e) => {
    const v = videoRef.current
    if (!v || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    v.currentTime = pct * duration
  }, [duration])

  const skip = useCallback((s) => {
    const v = videoRef.current
    if (v) v.currentTime = Math.max(0, Math.min(duration, v.currentTime + s))
  }, [duration])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
      setFullscreen(false)
    } else {
      el.requestFullscreen()
      setFullscreen(true)
    }
  }, [])

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false)
    }, 3000)
  }, [playing])

  const fmtTime = (t) => {
    if (!t || isNaN(t)) return '0:00'
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={containerRef}
      className="video-container group relative cursor-pointer select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        className="w-full h-full"
      />

      {/* Big play button center */}
      <AnimatePresence>
        {!playing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-3 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress bar */}
            {!live && (
              <div
                className="w-full h-1.5 rounded-full bg-white/20 mb-3 cursor-pointer group/progress relative"
                onClick={seek}
              >
                <div
                  className="absolute h-full rounded-full bg-white/30"
                  style={{ width: `${(buffered / (duration || 1)) * 100}%` }}
                />
                <div
                  className="absolute h-full rounded-full bg-accent"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-accent shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity"
                  style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 7px)` }}
                />
              </div>
            )}

            {/* Control buttons */}
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:text-accent transition-colors">
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" fill="white" />}
              </button>

              {!live && (
                <>
                  <button onClick={() => skip(-10)} className="text-white/70 hover:text-white transition-colors">
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button onClick={() => skip(10)} className="text-white/70 hover:text-white transition-colors">
                    <SkipForward className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Volume */}
              <div className="flex items-center gap-1.5 group/vol">
                <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                  {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0} max={1} step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="w-20 accent-primary h-1 cursor-pointer"
                />
              </div>

              {/* Time */}
              {!live && (
                <span className="text-xs text-white/60 ml-auto tabular-nums">
                  {fmtTime(currentTime)} / {fmtTime(duration)}
                </span>
              )}
              {live && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-live font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-live opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-live" />
                  </span>
                  LIVE
                </span>
              )}

              <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
                {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
