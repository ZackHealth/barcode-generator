// src/logic/types.ts

export interface BarcodeConfig {
  clientCode: string;
  panelCode: string;
  count: number;
  outputDir: string; // directory where SVGs are written
}

export interface PDFLayout {
  pageSize?: string; // key used in PAGE_SIZES (e.g., "A4")
  columns?: number;
  spacing?: {
    vertical: number;
  };
}

export interface PDFConfig {
  // Where the SVGs live (kept for backward compatibility / path resolving)
  svgDirectory: string;

  // Where to save the resulting PDF
  outputPath: string;

  // Optional overrides for layout
  layout?: PDFLayout;

  // ✅ NEW: prefer these when present
  // A JSON file (written by the generator) with list of SVGs to print
  manifestPath?: string;

  // Or pass an explicit list of filenames (relative or absolute)
  svgFiles?: string[];
}
