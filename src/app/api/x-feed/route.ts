/// src/app/api/x-feed/route.ts
import { fetchTweets } from "@/libs/fetchTweets";
import { NextResponse } from "next/server";

let cachedTweets: any[] | null = null;
let lastFetched = 0;
const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function GET() {
  const bearerToken = process.env.X_ACCESS_TOKEN;

  if (!bearerToken || bearerToken.length < 20) {
    console.error("Missing or invalid bearer token");
    return NextResponse.json({ error: "Missing or invalid bearer token" }, { status: 401 });
  }

  const now = Date.now();
  if (cachedTweets && now - lastFetched < CACHE_DURATION) {
    return NextResponse.json({ tweets: cachedTweets });
  }

  try {
    const tweets = await fetchTweets(bearerToken);
    cachedTweets = tweets;
    lastFetched = now;

    return NextResponse.json({ tweets });
  } catch (err: any) {
    const isRateLimit = err.message?.includes("Too Many Requests");
    console.error("Tweet fetch failed:", err.message || err);

    return NextResponse.json(
      {
        error: isRateLimit
          ? "Rate limit exceeded. Try again in a few minutes."
          : err.message || "Failed to fetch tweets",
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
