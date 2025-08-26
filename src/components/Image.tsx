"use client";

import { useMemo } from "react";

type ImageType = {
  path: string;
  alt: string;
  w?: number;
  h?: number;
  className?: string;
  tr?: boolean; // true = rounded avatar
};

const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
const fallbackBase = "/"; // assumes assets live in /public/icons/ or /public/general/

if (!urlEndpoint) {
  console.warn("Missing NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT in .env");
}

const Image = ({ path, alt, w, h, className = "", tr = false }: ImageType) => {
  const cleanPath = path.replace(/^\/+/, ""); // strip leading slashes
  const fallbackSrc = `${fallbackBase}${cleanPath}`;

  const transformations = tr
    ? [`w-${w || 100}`, h ? `h-${h}` : null].filter(Boolean).join(",")
    : "";

  const src = useMemo(() => {
    if (!urlEndpoint) return fallbackSrc;
    return tr
      ? `${urlEndpoint}/tr:${transformations}/${cleanPath}`
      : `${urlEndpoint}/${cleanPath}`;
  }, [urlEndpoint, cleanPath, transformations, tr]);

  return (
    <img
      src={src}
      alt={alt}
      width={w}
      height={h}
      decoding="async"
      loading="lazy"
      className={`${className} ${tr ? "rounded-full object-cover" : ""}`}
      style={{ objectFit: "contain" }}
      onError={(e) => {
        console.warn(`Image failed: ${src} → falling back to ${fallbackSrc}`);
        e.currentTarget.src = fallbackSrc;
      }}
    />
  );
};

export default Image;
