import type { BarcodeConfig } from "../logic/types";


// Ensure alphanumeric characters only
export function validateAlphaNumeric(input: string): boolean {
    return typeof input === "string" && /^[A-Za-z0-9]+$/.test(input);
}

  // Validate clientCode and panelCode
export function validateClientCode(config: BarcodeConfig): void {
    const { clientCode, panelCode } = config;
  
    if (!validateAlphaNumeric(clientCode) || !validateAlphaNumeric(panelCode)) {
      throw new Error("Client code and panel code must contain only alphanumeric characters.");
    }
}
