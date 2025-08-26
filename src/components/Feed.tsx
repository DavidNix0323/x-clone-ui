"use client";

import { useEffect, useState } from "react";
import Post from "./Post";

type TweetHydrated = {
  id: string;
  text: string;
  createdAt: string;
  metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  user: {
    id: string;
    username: string;
    name: string;
    profile_image_url: string;
  };
  media: {
    media_key: string;
    type: string;
    url: string;
  }[];
  source: "x";
};

const Feed = () => {
  const [tweets, setTweets] = useState<TweetHydrated[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTweets = async () => {
      try {
        const res = await fetch("/api/x-feed");
        const data = await res.json();

        if (data.error) {
          setError(data.error);
          console.error("X API error:", data.error);
        } else if (Array.isArray(data.tweets)) {
          setTweets(data.tweets);
        } else {
          setError("Unexpected response format");
          console.error("Unexpected response format:", data);
        }
      } catch (err) {
        setError("Tweet hydration failed");
        console.error("Tweet hydration failed:", err);
      }
    };

    loadTweets();
  }, []);

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
  );
};

export default Feed;
