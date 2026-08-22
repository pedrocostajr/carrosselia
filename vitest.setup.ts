import "@testing-library/jest-dom/vitest";

/**
 * jsdom does not implement a real 2D canvas rendering context, but
 * src/lib/render/text-layout.ts relies on `measureText` to lay out words.
 * This lightweight mock approximates width as a function of character count
 * so layout/wrapping/overflow logic can be tested deterministically without
 * a native canvas binding.
 */
class FakeCanvasRenderingContext2D {
  font = "";

  measureText(text: string) {
    const sizeMatch = this.font.match(/(\d+)px/);
    const fontSize = sizeMatch ? Number(sizeMatch[1]) : 16;
    return { width: text.length * fontSize * 0.55 };
  }
}

if (typeof HTMLCanvasElement !== "undefined") {
  // @ts-expect-error - test-only stub, not a full CanvasRenderingContext2D
  HTMLCanvasElement.prototype.getContext = function getContext(type: string) {
    if (type === "2d") return new FakeCanvasRenderingContext2D();
    return null;
  };
}
