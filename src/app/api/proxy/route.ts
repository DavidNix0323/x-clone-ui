import { NextRequest, NextResponse } from "next/server"

const BLOCKED_EXTENSIONS = [".js", ".css", ".map"]
const BLOCKED_PATHS = ["/_next/"]
const DEFAULT_TYPE = "image/jpeg"
const TIMEOUT_MS = 5000

function isBlocked(url: string): boolean {
  return (
    BLOCKED_PATHS.some(path => url.includes(path)) ||
    BLOCKED_EXTENSIONS.some(ext => url.endsWith(ext))
  )
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")

  if (!url || !/^https?:\/\//.test(url)) {
    return new NextResponse("Missing or invalid URL", { status: 400 })
  }

  if (isBlocked(url)) {
    return new NextResponse("Blocked static asset", { status: 403 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // ✅ These headers help avoid 403s from X/Twitter CDNs
        "User-Agent": "Mozilla/5.0 (compatible; x-clone-proxy/1.0)",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": "https://x.com/",
      },
    })
    clearTimeout(timeout)

    if (!response.ok || !response.body) {
      return new NextResponse(`Upstream error: ${response.statusText}`, {
        status: response.status || 502,
      })
    }

    // ✅ Preserve original content-type if present
    const contentType = response.headers.get("content-type") || DEFAULT_TYPE

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // cache for 1 day
      },
    })
  } catch (err: unknown) {
    const error = err as Error
    const isAbort = error.name === "AbortError"
    console.error("Proxy fetch failed:", error.message)
    return new NextResponse(
      isAbort ? "Upstream timeout" : "Failed to fetch resource",
      { status: 500 }
    )
  }
}
