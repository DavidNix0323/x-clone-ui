export type TwitterUser = {
    id: string;
    username: string;
    name: string;
    profile_image_url: string;
  };
  
  export type TweetMetrics = {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  
  export type TweetMedia = {
    media_key: string;
    type: string;
    url?: string;
    preview_image_url?: string;
    variants?: {
      bitrate?: number;
      content_type: string;
      url: string;
    }[];
  };
  
  export type TweetRaw = {
    id: string;
    text: string;
    created_at: string;
    public_metrics: TweetMetrics;
    author_id: string;
    attachments?: {
      media_keys?: string[];
    };
  };
  
  export type TwitterApiResponse = {
    data: TweetRaw[];
    includes: {
      users: TwitterUser[];
      media?: TweetMedia[];
    };
  };
  
  export type TweetHydrated = {
    id: string;
    text: string;
    createdAt: string;
    metrics: TweetMetrics;
    user: TwitterUser;
    media: TweetMedia[];
    source: "x";
  };
  
  const proxyUrl = (url: string) =>
    url.startsWith("http") ? `/api/proxy?url=${encodeURIComponent(url)}` : "";
  
  const resolveMediaUrl = (m: TweetMedia): string => {
    // Treat video thumbnail as photo if it's a preview image
    if (
      m.type === "video" &&
      m.preview_image_url &&
      m.preview_image_url.includes("ext_tw_video_thumb")
    ) {
      return proxyUrl(m.preview_image_url);
    }
  
    if (m.type === "photo") {
      const rawUrl = m.url || m.preview_image_url || "";
      return proxyUrl(rawUrl);
    }
  
    if ((m.type === "video" || m.type === "animated_gif") && Array.isArray(m.variants)) {
      const mp4Variant = m.variants
        .filter((v) => v.content_type === "video/mp4")
        .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0];
  
      const rawUrl = mp4Variant?.url || m.preview_image_url || m.url || "";
      return proxyUrl(rawUrl);
    }
  
    return proxyUrl(m.url || "");
  };
  
  export const fetchTweets = async (bearerToken: string): Promise<TweetHydrated[]> => {
    if (!bearerToken || typeof bearerToken !== "string") {
      throw new Error("Missing or invalid bearer token");
    }
  
    const userRes = await fetch(
      "https://api.twitter.com/2/users/by/username/DNixed0323?user.fields=id",
      {
        headers: { Authorization: `Bearer ${bearerToken}` },
      }
    );
  
    if (!userRes.ok) {
      throw new Error(`Failed to fetch user: ${userRes.statusText}`);
    }
  
    const { data: user }: { data: TwitterUser } = await userRes.json();
  
    const tweetRes = await fetch(
      `https://api.twitter.com/2/users/${user.id}/tweets?exclude=replies&tweet.fields=created_at,public_metrics&expansions=author_id,attachments.media_keys&user.fields=username,name,profile_image_url&media.fields=media_key,type,url,preview_image_url,variants`,
      {
        headers: { Authorization: `Bearer ${bearerToken}` },
      }
    );
  
    if (!tweetRes.ok) {
      throw new Error(`Failed to fetch tweets: ${tweetRes.statusText}`);
    }
  
    const raw: TwitterApiResponse = await tweetRes.json();
  
    const users: Record<string, TwitterUser> = Object.fromEntries(
      raw.includes.users.map((u) => [u.id, u])
    );
  
    const media: Record<string, TweetMedia> = Object.fromEntries(
      (raw.includes.media || []).map((m) => {
        const resolvedUrl = resolveMediaUrl(m);
        return [m.media_key, { ...m, url: resolvedUrl }];
      })
    );
  
    console.log("Resolved media preview:", Object.values(media).map((m) => ({
      key: m.media_key,
      type: m.type,
      url: m.url,
    })));
  
    return raw.data.map((tweet): TweetHydrated => {
      const hydratedMedia =
        tweet.attachments?.media_keys?.map((key) => media[key]).filter(Boolean) || [];
  
      const hydratedTweet: TweetHydrated = {
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at,
        metrics: tweet.public_metrics,
        user: users[tweet.author_id],
        media: hydratedMedia,
        source: "x",
      };
  
      const isBrokenMedia =
        hydratedMedia.length === 0 ||
        hydratedMedia.every((m) => !m?.url || m.url.includes("undefined"));
  
      if (tweet.id === raw.data[0].id && isBrokenMedia) {
        hydratedTweet.media = [{
          media_key: 'manual_patch',
          type: 'photo',
          url: proxyUrl('https://pbs.twimg.com/media/GzHlI3qXQAAZ2iH?format=jpg&name=small'),
        }];
      }
  
      return hydratedTweet;
    });
  };
  