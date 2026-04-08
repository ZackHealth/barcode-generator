import { createCanvas } from "canvas";
import JsBarcode from "jsbarcode";
import { DOMImplementation, XMLSerializer } from "@xmldom/xmldom";
import { getBarcodePhysicalDimensions } from "../logic/barCodeDimensions";


export function createBarcodeSVG(
  clientCode: string,
  sampleID: string,
  panelCode: string,
  //samplingDate: string
): string {
  // Create a canvas for JsBarcode
  const canvas = createCanvas(600, 300);
  
  // Format the barcode text: ClientCode|SampleID
  const barcodeText = `${clientCode}|${sampleID}`;
  
  // Generate the barcode
  JsBarcode(canvas, barcodeText, {
    format: "CODE128",
    width: 2,
    height: 48,
    displayValue: false,
    margin: 5

  });
  
  // Create SVG document for the full label
  const impl = new DOMImplementation();
  const svgDoc = impl.createDocument("http://www.w3.org/2000/svg", "svg", null);
  const svgRoot = svgDoc.documentElement!;
  
  // Label dimensions: 8.5cm x 1.5cm (convert to pixels, assuming 96dpi)

  const background = svgDoc.createElement("rect"); //add white background
  const { widthPx, heightPx } = getBarcodePhysicalDimensions();
  const pad = 2;
  const OFFSET_Y = -3; 

  // Update the root to include padding in its viewBox:
svgRoot.setAttribute("viewBox", `0 0 ${widthPx} ${heightPx}`);
svgRoot.setAttribute("width",  widthPx.toString());
svgRoot.setAttribute("height", heightPx.toString());

background.setAttribute("x",     (-pad).toString());
background.setAttribute("y",     (-pad).toString());
background.setAttribute("width",  (widthPx + pad*2).toString());
background.setAttribute("height", (heightPx + pad*2).toString());
background.setAttribute("fill",   "white");
background.setAttribute("stroke", "none");
svgRoot.insertBefore(background, svgRoot.firstChild);
  
  // Convert canvas to data URL and extract base64 image data
  const barcodeDataURL = canvas.toDataURL("image/png");
  
  // Add the barcode image
  const image = svgDoc.createElement("image");
  image.setAttribute("x", "5");
  image.setAttribute("y", (10 + OFFSET_Y).toString());  
  image.setAttribute("width", Math.round(widthPx * 0.7).toString());  image.setAttribute("height", "30");
  image.setAttribute("href", barcodeDataURL);
  svgRoot.appendChild(image);
  
  // Add text elements for the data
  const barcodeText1 = svgDoc.createElement("text");
  barcodeText1.setAttribute("x", "235");
  barcodeText1.setAttribute("y", (heightPx - 40 + OFFSET_Y).toString());
  barcodeText1.setAttribute("font-family", "Arial");
  barcodeText1.setAttribute("font-size", "9");
  barcodeText1.textContent = `Panel Code: ${panelCode}`;
  svgRoot.appendChild(barcodeText1);
  
  const barcodeText2 = svgDoc.createElement("text");
  barcodeText2.setAttribute("x", "235");
  barcodeText2.setAttribute("y", (heightPx - 30 + OFFSET_Y).toString());
  barcodeText2.setAttribute("font-family", "Arial");
  barcodeText2.setAttribute("font-size", "9");
  barcodeText2.textContent = `Sampling Date: `;
  svgRoot.appendChild(barcodeText2);
  
  const barcodeText3 = svgDoc.createElement("text");
  barcodeText3.setAttribute("x", "90");
  barcodeText3.setAttribute("y", (heightPx - 6 + OFFSET_Y).toString());
  barcodeText3.setAttribute("font-family", "Arial");
  barcodeText3.setAttribute("font-size", "9");
  barcodeText3.textContent = barcodeText;
  svgRoot.appendChild(barcodeText3);
  
  // Serialize the SVG document to a string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgDoc);
}
