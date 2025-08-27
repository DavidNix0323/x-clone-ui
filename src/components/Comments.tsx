"use client";

import { useEffect, useState } from "react";
import Image from "./Image";
import Post from "./Post";
import type { MediaType } from "./TweetMedia"; // ✅ import union type

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
    type: string; // comes raw from API
    url: string;
    preview_image_url?: string;
  }[];
  source: "x";
};

const Comments = () => {
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
    <div>
      {/* Reply Form */}
      <form className="flex items-center justify-between gap-4 p-4">
        <div className="relative w-10 h-10 rounded-full overflow-hidden">
          <Image path="general/Avatar.jpg" alt="David Nix" w={100} h={100} tr={true} />
        </div>
        <input
          type="text"
          className="flex-1 bg-transparent outline-none p-2 text-xl"
          placeholder="Post your reply"
        />
        <button className="py-2 px-4 font-bold bg-white text-black rounded-full">
          Reply
        </button>
      </form>

      {/* Posts */}
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : tweets.length === 0 ? (
        <p className="text-gray-500 px-4">No comments available.</p>
      ) : (
        <div className="flex flex-col gap-4 px-4">
          {tweets.slice(0, 6).map((tweet) => {
            // ✅ Normalize media types
            const normalizedMedia =
              tweet.media?.map((m) => ({
                ...m,
                type: (["photo", "video", "animated_gif"].includes(m.type)
                  ? m.type
                  : "photo") as MediaType,
              })) ?? [];

            return (
              <Post
                key={tweet.id}
                {...tweet}
                media={normalizedMedia} // ✅ Correct typing now
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Comments;
