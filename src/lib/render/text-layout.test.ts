import { describe, expect, it } from "vitest";

import { fitFontSize, layoutText } from "@/lib/render/text-layout";

const baseInput = {
  text: "Este é um título de teste",
  fontFamily: "Arial",
  fontSize: 48,
  fontWeight: 700,
  fontStyle: "normal" as const,
  lineHeight: 1.2,
  letterSpacing: 0,
  maxWidth: 900,
  align: "left" as const,
  emphasisRanges: [],
};

describe("layoutText", () => {
  it("lays out short text on a single line when it fits", () => {
    const result = layoutText(baseInput);
    expect(result.lines.length).toBeGreaterThan(0);
    expect(result.totalHeight).toBeGreaterThan(0);
  });

  it("wraps to multiple lines when maxWidth is small", () => {
    const wrapped = layoutText({ ...baseInput, maxWidth: 80 });
    expect(wrapped.lines.length).toBeGreaterThan(1);
  });

  it("marks words within an emphasis range as emphasized", () => {
    const text = "Destaque esta palavra importante";
    const start = text.indexOf("importante");
    const result = layoutText({
      ...baseInput,
      text,
      emphasisRanges: [{ start, end: start + "importante".length }],
    });
    const words = result.lines.flatMap((l) => l.words);
    const emphasized = words.filter((w) => w.emphasized);
    expect(emphasized.map((w) => w.text)).toContain("importante");
  });
});

describe("fitFontSize", () => {
  it("keeps the original font size when the text fits within maxHeight", () => {
    const { fontSize, overflow } = fitFontSize(baseInput, 1000, 16);
    expect(fontSize).toBe(baseInput.fontSize);
    expect(overflow).toBe(false);
  });

  it("shrinks the font size down to minFontSize when text overflows a tiny box", () => {
    const longText =
      "Este é um texto bastante longo que certamente não caberá em uma caixa muito pequena, mesmo reduzindo bastante o tamanho da fonte disponível para renderização.";
    const { fontSize, overflow } = fitFontSize(
      { ...baseInput, text: longText, fontSize: 60 },
      40,
      20
    );
    expect(fontSize).toBe(20);
    expect(overflow).toBe(true);
  });
});
