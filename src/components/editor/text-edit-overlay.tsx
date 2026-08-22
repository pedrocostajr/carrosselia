"use client";

import { useEffect, useRef, useState } from "react";

import type { TextElement } from "@/lib/schemas/slide";

export function TextEditOverlay({
  element,
  containerScale,
  onCommit,
  onCancel,
}: {
  element: TextElement;
  containerScale: number;
  onCommit: (text: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(element.text);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onCommit(value);
        }
      }}
      style={{
        position: "absolute",
        left: element.x * containerScale,
        top: element.y * containerScale,
        width: element.width * containerScale,
        height: element.height * containerScale,
        fontFamily: element.fontFamily,
        fontSize: element.fontSize * containerScale,
        fontWeight: element.fontWeight,
        fontStyle: element.fontStyle,
        color: element.color,
        textAlign: element.align,
        lineHeight: element.lineHeight,
        letterSpacing: element.letterSpacing,
        background: "rgba(255,255,255,0.9)",
        border: "1px solid #2563EB",
        outline: "none",
        resize: "none",
        padding: 0,
      }}
    />
  );
}
