"use client"

import { useEffect, useState, memo } from "react"
import Image from "next/image"
import HotReloadWrapper from "@/client/dev/hot-reloader/HotReloadWrapper"

export type MediaType = "photo" | "video" | "animated_gif"

export type MediaItem = {
  media_key: string
  type: MediaType
  url: string
  preview_image_url?: string
}

type Props = {
  media?: MediaItem[]
  useProxy?: boolean
}

const getMimeType = (url: string): string => {
  if (url.endsWith(".webm")) return "video/webm"
  if (url.endsWith(".mov")) return "video/quicktime"
  return "video/mp4"
}

const getFallback = (type: MediaType): string =>
  type === "photo" ? "/fallback.jpg" : "/fallback-video.jpg"

const cleanUrl = (url?: string): string => (url ?? "").replace(/&amp;/g, "&")

const gridClassMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
}

// 🖼 Photo component (with stateful fallback)
const PhotoMedia = ({
  src,
  fallback,
  mediaKey,
}: {
  src: string
  fallback: string
  mediaKey: string
}) => {
  const [imgSrc, setImgSrc] = useState(src)

  return (
    <div
      key={mediaKey}
      className="rounded-lg w-full max-h-[600px] overflow-hidden border border-red-500"
    >
      <Image
        src={imgSrc}
        alt="Tweet image"
        width={800}
        height={450}
        className="rounded-lg w-full object-contain aspect-video"
        style={{
          minHeight: "250px",
          backgroundColor: "#111",
          aspectRatio: "16/9",
          display: "block",
        }}
        onError={() => {
          console.warn("❌ Image failed:", imgSrc)
          setImgSrc(fallback)
        }}
      />
    </div>
  )
}

// 🎥 Video component
const VideoMedia = ({
  videoSrc,
  posterSrc,
  fallback,
  mediaKey,
}: {
  videoSrc: string
  posterSrc: string
  fallback: string
  mediaKey: string
}) => (
  <div
    key={mediaKey}
    className="rounded-lg w-full max-h-[600px] overflow-hidden border border-blue-500"
  >
    <video
      controls
      playsInline
      preload="none"
      poster={posterSrc}
      className="rounded-lg w-full aspect-video object-cover"
      onError={(e) => {
        console.warn("❌ Video failed to load:", videoSrc)
        e.currentTarget.poster = fallback
      }}
    >
      <source src={videoSrc} type={getMimeType(videoSrc)} />
      Your browser does not support the video tag.
    </video>
  </div>
)

const TweetMedia = memo(({ media = [], useProxy = false }: Props) => {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setIsHydrated(true), 50)
    return () => clearTimeout(timeout)
  }, [])

  if (!isHydrated || media.length === 0) {
    console.warn("Hydration incomplete or media missing")
    return <div style={{ minHeight: "250px", backgroundColor: "#111" }} />
  }

  const gridCols = gridClassMap[media.length] ?? "grid-cols-2"

  return (
    <HotReloadWrapper>
      <div className={`mt-2 grid gap-2 ${gridCols}`}>
        {media.map((m) => {
          const fallbackSrc = getFallback(m.type)
          const rawUrl = cleanUrl(m.url ?? m.preview_image_url)

          if (!rawUrl) {
            console.warn("❌ No valid media URL for:", m.media_key)
            return null
          }

          const resolvedSrc = useProxy
            ? `/api/proxy?url=${encodeURIComponent(rawUrl)}`
            : rawUrl

          if (m.type === "photo") {
            return (
              <PhotoMedia
                key={m.media_key}
                src={resolvedSrc}
                fallback={fallbackSrc}
                mediaKey={m.media_key}
              />
            )
          }

          if (m.type === "video" || m.type === "animated_gif") {
            const videoSrc = useProxy
              ? `/api/proxy?url=${encodeURIComponent(cleanUrl(m.url))}`
              : cleanUrl(m.url)

            const posterSrc = useProxy
              ? `/api/proxy?url=${encodeURIComponent(
                  cleanUrl(m.preview_image_url) || fallbackSrc
                )}`
              : cleanUrl(m.preview_image_url) || fallbackSrc

            return (
              <VideoMedia
                key={m.media_key}
                videoSrc={videoSrc}
                posterSrc={posterSrc}
                fallback={fallbackSrc}
                mediaKey={m.media_key}
              />
            )
          }

          console.warn("Unsupported media type:", m.type)
          return null
        })}
      </div>
    </HotReloadWrapper>
  )
})

TweetMedia.displayName = "TweetMedia"
export default TweetMedia

