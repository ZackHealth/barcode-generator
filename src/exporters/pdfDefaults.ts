// src/exporters/pdfDefaults.ts

import type { LayoutOptions, PageDimensions } from "../logic/types";

// 1) Page dimensions in points (72 pt/in × 2.54 cm/in)
export const PAGE_SIZES: Record<LayoutOptions["pageSize"], PageDimensions> = {
  A4:     { width: 595.28, height: 841.89 },
  Letter: { width: 612.00, height: 792.00 }
};

// 2) Your default layout — zero margins, two columns, etc.
export const DEFAULT_LAYOUT: LayoutOptions = {
  pageSize:           "A4",
  margins:            0,            // no page margins
  columns:            2,            // two columns
  spacing:            {             // space between barcodes
    horizontal: 20,
    vertical:   10
  },
  preservePhysicalSize: true
};
