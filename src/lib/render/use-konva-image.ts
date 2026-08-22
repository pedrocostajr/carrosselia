"use client";

import { useEffect, useState } from "react";

const cache = new Map<string, HTMLImageElement>();

export function useKonvaImage(src: string | null): HTMLImageElement | null {
  const cached = src ? cache.get(src) ?? null : null;
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src || cache.has(src)) return;

    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!cancelled) {
        cache.set(src, img);
        setLoadedImage(img);
      }
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return cached ?? loadedImage;
}

/**
 * Preloads and caches a set of image URLs so a subsequent render (e.g. the
 * export pipeline mounting many SlideStage instances at once) can read them
 * from the same in-memory cache synchronously instead of waiting on each
 * element's own async load.
 */
export function preloadImages(srcs: (string | null | undefined)[]): Promise<void> {
  const unique = Array.from(new Set(srcs.filter((s): s is string => Boolean(s))));
  return Promise.all(
    unique.map(
      (src) =>
        new Promise<void>((resolve) => {
          if (cache.has(src)) {
            resolve();
            return;
          }
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            cache.set(src, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = src;
        })
    )
  ).then(() => undefined);
}

export function getCachedImage(src: string | null | undefined): HTMLImageElement | null {
  if (!src) return null;
  return cache.get(src) ?? null;
}
