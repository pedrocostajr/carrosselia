import type { EmphasisRange } from "@/lib/schemas/slide";

export interface LayoutWord {
  text: string;
  x: number;
  width: number;
  emphasized: boolean;
}

export interface LayoutLine {
  words: LayoutWord[];
  y: number;
  width: number;
}

export interface TextLayoutResult {
  lines: LayoutLine[];
  totalHeight: number;
  lineHeightPx: number;
}

export interface TextLayoutInput {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  lineHeight: number;
  letterSpacing: number;
  maxWidth: number;
  align: "left" | "center" | "right";
  emphasisRanges: EmphasisRange[];
}

let measureCanvas: HTMLCanvasElement | null = null;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!measureCanvas) measureCanvas = document.createElement("canvas");
  return measureCanvas.getContext("2d");
}

function measureWidth(ctx: CanvasRenderingContext2D, text: string, letterSpacing: number): number {
  const base = ctx.measureText(text).width;
  return base + Math.max(0, text.length - 1) * letterSpacing;
}

/**
 * Manually lays out text into lines/words so each word can carry its own
 * color (for brand-color emphasis highlighting) and so overflow/auto-fit
 * can be measured precisely - Konva's built-in Text node doesn't support
 * mixed inline styling, so this is computed once here and both the editor
 * canvas and the PNG export render from the same result.
 */
export function layoutText(input: TextLayoutInput): TextLayoutResult {
  const ctx = getMeasureContext();
  const lineHeightPx = input.fontSize * input.lineHeight;

  if (!ctx) {
    return { lines: [], totalHeight: 0, lineHeightPx };
  }

  ctx.font = `${input.fontStyle} ${input.fontWeight} ${input.fontSize}px "${input.fontFamily}"`;

  const paragraphs = input.text.split("\n");
  const lines: Omit<LayoutLine, "y">[] = [];
  const plainText = input.text;
  let charCursor = 0;

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let current: LayoutWord[] = [];
    let currentWidth = 0;
    const spaceWidth = measureWidth(ctx, " ", input.letterSpacing);

    for (const word of words) {
      const wordStart = plainText.indexOf(word, charCursor);
      const wordEnd = wordStart >= 0 ? wordStart + word.length : charCursor + word.length;
      const emphasized = input.emphasisRanges.some(
        (r) => wordStart >= 0 && wordStart < r.end && wordEnd > r.start
      );
      charCursor = wordEnd;

      const wordWidth = measureWidth(ctx, word, input.letterSpacing);
      const additional = current.length > 0 ? spaceWidth + wordWidth : wordWidth;

      if (currentWidth + additional > input.maxWidth && current.length > 0) {
        lines.push(buildLine(current, currentWidth, input));
        current = [];
        currentWidth = 0;
      }

      const x = current.length > 0 ? currentWidth + spaceWidth : 0;
      current.push({ text: word, x, width: wordWidth, emphasized });
      currentWidth += current.length > 1 ? spaceWidth + wordWidth : wordWidth;
    }

    lines.push(buildLine(current, currentWidth, input));
  }

  const finalLines = lines.map((line, i) => ({ ...line, y: i * lineHeightPx }));
  return {
    lines: finalLines,
    totalHeight: finalLines.length * lineHeightPx,
    lineHeightPx,
  };
}

function buildLine(
  words: LayoutWord[],
  width: number,
  input: TextLayoutInput
): Omit<LayoutLine, "y"> {
  if (input.align === "left" || words.length === 0) {
    return { words, width };
  }
  const offset = input.align === "center" ? (input.maxWidth - width) / 2 : input.maxWidth - width;
  return { words: words.map((w) => ({ ...w, x: w.x + offset })), width };
}

/**
 * Finds the largest font size within [minFontSize, fontSize] for which the
 * text fits inside maxHeight, or returns minFontSize with overflow=true if
 * even the minimum doesn't fit.
 */
export function fitFontSize(
  input: TextLayoutInput,
  maxHeight: number,
  minFontSize: number
): { fontSize: number; layout: TextLayoutResult; overflow: boolean } {
  let size = input.fontSize;
  let layout = layoutText({ ...input, fontSize: size });

  while (layout.totalHeight > maxHeight && size > minFontSize) {
    size -= 2;
    layout = layoutText({ ...input, fontSize: size });
  }

  return { fontSize: size, layout, overflow: layout.totalHeight > maxHeight };
}
