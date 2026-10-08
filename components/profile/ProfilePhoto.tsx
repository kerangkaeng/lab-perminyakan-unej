"use client";

export function ProfilePhoto({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="mb-6 h-32 w-32 border border-line object-cover"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
