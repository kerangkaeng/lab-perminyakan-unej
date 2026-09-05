"use client";

import Image from "next/image";
import { useState } from "react";

export function CoverImage({
  src,
  seed,
  alt,
  className,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: {
  src?: string;
  seed: string;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const placeholder = `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/700`;
  const [imgSrc, setImgSrc] = useState(src || placeholder);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setImgSrc(placeholder)}
    />
  );
}
