"use client"

import { useEffect, useState } from "react"
import Post from "./Post"
import type { MediaItem } from "./TweetMedia" // ✅ Reuse type

type TweetHydrated = {
  id: string
  text: string
  createdAt: string
  metrics: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
  }
  user: {
    id: string
    username: string
    name: string
    profile_image_url: string
  }
  media: MediaItem[] // ✅ strict type
  source: "x"
}

const validTypes = ["photo", "video", "animated_gif"] as const
type ValidType = (typeof validTypes)[number]

// 🛠 Normalize tweets coming from API
const normalizeTweet = (raw: Record<string, unknown>): TweetHydrated => {
  const mediaArray = Array.isArray(raw.media) ? raw.media : []

  return {
    id: String(raw.id),
    text: String(raw.text),
    createdAt: String(raw.createdAt),
    metrics: raw.metrics as TweetHydrated["metrics"],
    user: raw.user as TweetHydrated["user"],
    source: "x",
    media: mediaArray.map((m) => {
      const item = m as Partial<MediaItem> & { type?: string }
      return {
        media_key: String(item.media_key),
        url: item.url ?? "",
        preview_image_url: item.preview_image_url,
        type: validTypes.includes(item.type as ValidType)
          ? (item.type as ValidType)
          : "photo", // fallback to "photo" if invalid
      }
    }),
  }
}

const Feed = () => {
  const [tweets, setTweets] = useState<TweetHydrated[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTweets = async () => {
      try {
        const res = await fetch("/api/x-feed")
        const data = await res.json()

        if (data.error) {
          setError(data.error)
          console.error("X API error:", data.error)
        } else if (Array.isArray(data.tweets)) {
          setTweets(data.tweets.map(normalizeTweet)) // ✅ Normalize before saving
        } else {
          setError("Unexpected response format")
          console.error("Unexpected response format:", data)
        }
      } catch (err) {
        const error = err as Error
        setError("Tweet hydration failed")
        console.error("Tweet hydration failed:", error.message)
      }
    }

    loadTweets()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : tweets.length === 0 ? (
        <p className="text-gray-500">No tweets available.</p>
      ) : (
        tweets.slice(0, 6).map((tweet) => <Post key={tweet.id} {...tweet} />)
      )}
    </div>
  )
}

export default Feed
