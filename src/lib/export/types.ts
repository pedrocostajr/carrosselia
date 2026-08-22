export const EXPORT_QUALITIES = ["standard", "high", "maximum"] as const;
export type ExportQuality = (typeof EXPORT_QUALITIES)[number];

export const QUALITY_PIXEL_RATIO: Record<ExportQuality, number> = {
  standard: 1,
  high: 2,
  maximum: 3,
};

export const QUALITY_LABELS: Record<ExportQuality, string> = {
  standard: "Padrão (1x)",
  high: "Alta (2x)",
  maximum: "Máxima (3x)",
};
