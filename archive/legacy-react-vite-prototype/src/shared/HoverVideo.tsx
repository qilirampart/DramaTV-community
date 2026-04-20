import { useRef } from 'react'

export default function HoverVideo({
  src,
  title,
  className,
}: {
  src: string
  title: string
  className?: string
}) {
  const ref = useRef<HTMLVideoElement | null>(null)

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      onMouseEnter={() => {
        void ref.current?.play().catch(() => {})
      }}
      onMouseLeave={() => {
        if (!ref.current) {
          return
        }

        ref.current.pause()
        ref.current.currentTime = 0
      }}
      aria-label={title}
    />
  )
}
