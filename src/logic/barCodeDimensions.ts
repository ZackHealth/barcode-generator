

// raw physical sizes in cm
const LABEL_WIDTH_CM  = 8.5;
const LABEL_HEIGHT_CM = 1.5;

// In your barcodeDimensions.ts, add these helpers:
const CM_TO_IN = 1 / 2.54;

export function getBarcodeRasterSize(dpi = 300) {
  // pixels = inches * dpi
  const widthPx  = Math.round(LABEL_WIDTH_CM  * CM_TO_IN * dpi);
  const heightPx = Math.round(LABEL_HEIGHT_CM * CM_TO_IN * dpi);
  return { widthPx, heightPx };
}

// conversion factors
const CM_TO_PX = 96  / 2.54; // pixels per cm
const CM_TO_PT = 72  / 2.54; // points per cm

export function getBarcodePhysicalDimensions() {
  const widthPx  = Math.round(LABEL_WIDTH_CM  * CM_TO_PX);
  const heightPx = Math.round(LABEL_HEIGHT_CM * CM_TO_PX);

  const widthPt  = LABEL_WIDTH_CM  * CM_TO_PT;
  const heightPt = LABEL_HEIGHT_CM * CM_TO_PT;

  return { widthPx, heightPx, widthPt, heightPt, widthCm: LABEL_WIDTH_CM, heightCm: LABEL_HEIGHT_CM };
}
