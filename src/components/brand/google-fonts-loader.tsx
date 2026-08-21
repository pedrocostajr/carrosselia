"use client";

import { useEffect } from "react";

import { ensureFontsLoaded } from "@/lib/fonts/google-fonts";

export function GoogleFontsLoader({ families }: { families: string[] }) {
  useEffect(() => {
    ensureFontsLoaded(families);
  }, [families]);

  return null;
}
