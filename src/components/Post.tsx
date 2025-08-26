"use client";

import { useEffect, useState } from "react";

type FileDetails = {
  url: string;
  // Add more fields here if your API returns them (e.g., name, size, type)
};

const Post = () => {
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const res = await fetch("/api/media/675d943be375273f6003858f");
        if (!res.ok) throw new Error("Failed to fetch media");
        const details: FileDetails = await res.json();
        setFileDetails(details);
      } catch (err) {
        console.error("Media fetch failed:", err);
        setFileDetails(null);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, []);

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : fileDetails ? (
        <img src={fileDetails.url} alt="Media" />
      ) : (
        <div>Media not available</div>
      )}
    </div>
  );
};

export default Post;
