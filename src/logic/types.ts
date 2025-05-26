import { PAGE_SIZES } from "../exporters/pdfDefaults";  

export interface BarcodeConfig {
    clientCode: string;
    panelCode: string;
    count: number;
    outputDir: string;
  }
  
export interface PDFConfig {
  svgDirectory: string;
  outputPath: string;
  layout?: Partial<LayoutOptions>;
}
// If LayoutOptions isn’t in logic/types.ts yet
export type PageSize = LayoutOptions["pageSize"];

export interface LayoutOptions {
  pageSize: "A4" | "Letter";
  margins: number | { top: number; right: number; bottom: number; left: number };
  columns: number;
  spacing: { horizontal: number; vertical: number };
  preservePhysicalSize: boolean;
}
export interface PageDimensions {
  width:  number;
  height: number;
}

export type pageSize = "A4" | "Letter"

export interface MarginConfig {
  top:    number;
  right:  number;
  bottom: number;
  left:   number;
}

export interface PDFConfig {
  svgDirectory: string;
  outputPath:   string;
  layout?:      Partial<LayoutOptions>;
}
