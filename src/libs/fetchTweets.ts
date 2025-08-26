// src/libs/fetchTweets.ts

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
    url: string;
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
      `https://api.twitter.com/2/users/${user.id}/tweets?tweet.fields=created_at,public_metrics&expansions=author_id,attachments.media_keys&user.fields=username,name,profile_image_url&media.fields=url,type`,
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
      (raw.includes.media || []).map((m) => [m.media_key, m])
    );
  
    return raw.data.map((tweet): TweetHydrated => ({
      id: tweet.id,
      text: tweet.text,
      createdAt: tweet.created_at,
      metrics: tweet.public_metrics,
      user: users[tweet.author_id],
      media: tweet.attachments?.media_keys?.map((key) => media[key]).filter(Boolean) || [],
      source: "x",
    }));
  };
  