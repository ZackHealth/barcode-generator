module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/fs/promises [external] (fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs/promises", () => require("fs/promises"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/canvas [external] (canvas, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("canvas", () => require("canvas"));

module.exports = mod;
}),
"[project]/src/logic/barCodeDimensions.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// raw physical sizes in cm
__turbopack_context__.s([
    "getBarcodePhysicalDimensions",
    ()=>getBarcodePhysicalDimensions,
    "getBarcodeRasterSize",
    ()=>getBarcodeRasterSize
]);
const LABEL_WIDTH_CM = 8.5;
const LABEL_HEIGHT_CM = 1.5;
// In your barcodeDimensions.ts, add these helpers:
const CM_TO_IN = 1 / 2.54;
function getBarcodeRasterSize(dpi = 300) {
    // pixels = inches * dpi
    const widthPx = Math.round(LABEL_WIDTH_CM * CM_TO_IN * dpi);
    const heightPx = Math.round(LABEL_HEIGHT_CM * CM_TO_IN * dpi);
    return {
        widthPx,
        heightPx
    };
}
// conversion factors
const CM_TO_PX = 96 / 2.54; // pixels per cm
const CM_TO_PT = 72 / 2.54; // points per cm
function getBarcodePhysicalDimensions() {
    const widthPx = Math.round(LABEL_WIDTH_CM * CM_TO_PX);
    const heightPx = Math.round(LABEL_HEIGHT_CM * CM_TO_PX);
    const widthPt = LABEL_WIDTH_CM * CM_TO_PT;
    const heightPt = LABEL_HEIGHT_CM * CM_TO_PT;
    return {
        widthPx,
        heightPx,
        widthPt,
        heightPt,
        widthCm: LABEL_WIDTH_CM,
        heightCm: LABEL_HEIGHT_CM
    };
}
}),
"[project]/src/exporters/createBarcodeSvg.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createBarcodeSVG",
    ()=>createBarcodeSVG
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$canvas__$5b$external$5d$__$28$canvas$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/canvas [external] (canvas, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsbarcode$2f$bin$2f$JsBarcode$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jsbarcode/bin/JsBarcode.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xmldom$2f$xmldom$2f$lib$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@xmldom/xmldom/lib/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$logic$2f$barCodeDimensions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/logic/barCodeDimensions.ts [app-route] (ecmascript)");
;
;
;
;
const LABEL_WIDTH_CM = Math.round(8.5 * 37.8); // 8.5cm to pixels
const LABEL_HEIGHT_CM = Math.round(1.4 * 37.8); // 1.4cm to pixels
function createBarcodeSVG(clientCode, sampleID, panelCode) {
    // Create a canvas for JsBarcode
    const canvas = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$canvas__$5b$external$5d$__$28$canvas$2c$__cjs$29$__["createCanvas"])(600, 300);
    // Format the barcode text: ClientCode|SampleID
    const barcodeText = `${clientCode}|${sampleID}`;
    // Generate the barcode
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsbarcode$2f$bin$2f$JsBarcode$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])(canvas, barcodeText, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: false,
        margin: 0
    });
    // Create SVG document for the full label
    const impl = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xmldom$2f$xmldom$2f$lib$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DOMImplementation"]();
    const svgDoc = impl.createDocument("http://www.w3.org/2000/svg", "svg", null);
    const svgRoot = svgDoc.documentElement;
    // Label dimensions: 8.5cm x 1.4cm (convert to pixels, assuming 96dpi)
    const background = svgDoc.createElement("rect"); //add white background
    const { widthPx, heightPx } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$logic$2f$barCodeDimensions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getBarcodePhysicalDimensions"])();
    const pad = 2;
    // Update the root to include padding in its viewBox:
    svgRoot.setAttribute("viewBox", `0 0 ${widthPx} ${heightPx}`);
    svgRoot.setAttribute("width", widthPx.toString());
    svgRoot.setAttribute("height", heightPx.toString());
    background.setAttribute("x", (-pad).toString());
    background.setAttribute("y", (-pad).toString());
    background.setAttribute("width", (widthPx + pad * 2).toString());
    background.setAttribute("height", (heightPx + pad * 2).toString());
    background.setAttribute("fill", "white");
    background.setAttribute("stroke", "none");
    svgRoot.insertBefore(background, svgRoot.firstChild);
    // Convert canvas to data URL and extract base64 image data
    const barcodeDataURL = canvas.toDataURL("image/png");
    // Add the barcode image
    const image = svgDoc.createElement("image");
    image.setAttribute("x", "5");
    image.setAttribute("y", "5");
    image.setAttribute("width", Math.round(LABEL_WIDTH_CM * 0.7).toString());
    image.setAttribute("height", "30");
    image.setAttribute("href", barcodeDataURL);
    svgRoot.appendChild(image);
    // Add text elements for the data
    const barcodeText1 = svgDoc.createElement("text");
    barcodeText1.setAttribute("x", "235");
    barcodeText1.setAttribute("y", (LABEL_HEIGHT_CM - 40).toString());
    barcodeText1.setAttribute("font-family", "Arial");
    barcodeText1.setAttribute("font-size", "9");
    barcodeText1.textContent = `Panel Code: ${panelCode}`;
    svgRoot.appendChild(barcodeText1);
    const barcodeText2 = svgDoc.createElement("text");
    barcodeText2.setAttribute("x", "235");
    barcodeText2.setAttribute("y", (LABEL_HEIGHT_CM - 30).toString());
    barcodeText2.setAttribute("font-family", "Arial");
    barcodeText2.setAttribute("font-size", "9");
    barcodeText2.textContent = `Sampling Date: `;
    svgRoot.appendChild(barcodeText2);
    const barcodeText3 = svgDoc.createElement("text");
    barcodeText3.setAttribute("x", "90");
    barcodeText3.setAttribute("y", (LABEL_HEIGHT_CM - 6).toString());
    barcodeText3.setAttribute("font-family", "Arial");
    barcodeText3.setAttribute("font-size", "9");
    barcodeText3.textContent = barcodeText;
    svgRoot.appendChild(barcodeText3);
    // Serialize the SVG document to a string
    const serializer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xmldom$2f$xmldom$2f$lib$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["XMLSerializer"]();
    return serializer.serializeToString(svgDoc);
}
}),
"[project]/src/backend/paths.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OUTPUT_ROOT",
    ()=>OUTPUT_ROOT,
    "REPO_ROOT",
    ()=>REPO_ROOT,
    "RUNS_ROOT",
    ()=>RUNS_ROOT,
    "SRC_ROOT",
    ()=>SRC_ROOT,
    "USED_SAMPLE_IDS_PATH",
    ()=>USED_SAMPLE_IDS_PATH
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
const REPO_ROOT = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].resolve(process.cwd());
const SRC_ROOT = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(REPO_ROOT, "src");
const USED_SAMPLE_IDS_PATH = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(SRC_ROOT, "used-sample-ids.json");
const OUTPUT_ROOT = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(SRC_ROOT, "output");
const RUNS_ROOT = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(OUTPUT_ROOT, "runs");
}),
"[project]/src/logic/sampleIDTracker.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "acquireUsedIdsLock",
    ()=>acquireUsedIdsLock,
    "loadUsedSampleIDs",
    ()=>loadUsedSampleIDs,
    "releaseUsedIdsLock",
    ()=>releaseUsedIdsLock,
    "saveUsedSampleIDs",
    ()=>saveUsedSampleIDs
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs/promises [external] (fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$backend$2f$paths$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/backend/paths.ts [app-route] (ecmascript)");
;
;
;
const TRACKER_PATH = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$backend$2f$paths$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["USED_SAMPLE_IDS_PATH"];
const LOCK_PATH = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].dirname(TRACKER_PATH), "used-sample-ids.lock");
async function acquireUsedIdsLock() {
    // 'wx' => create exclusively; fails if exists
    const handle = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].open(LOCK_PATH, "wx");
    await handle.close();
}
async function releaseUsedIdsLock() {
    try {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].unlink(LOCK_PATH);
    } catch  {
    // ignore
    }
}
async function loadUsedSampleIDs() {
    try {
        const data = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readFile(TRACKER_PATH, "utf-8");
        const parsed = JSON.parse(data);
        return new Set(parsed.usedSampleIDs ?? []);
    } catch  {
        return new Set();
    }
}
async function saveUsedSampleIDs(set) {
    const data = {
        usedSampleIDs: Array.from(set)
    };
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(TRACKER_PATH, JSON.stringify(data, null, 2), "utf-8");
}
}),
"[project]/src/logic/generateBarcodeInfo.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/backend/generateBarcodeInfo.ts
__turbopack_context__.s([
    "BarcodeInfo",
    ()=>BarcodeInfo,
    "generateBarcodeInfo",
    ()=>generateBarcodeInfo,
    "generateBarcodeRun",
    ()=>generateBarcodeRun
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs/promises [external] (fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$exporters$2f$createBarcodeSvg$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/exporters/createBarcodeSvg.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$logic$2f$sampleIDTracker$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/logic/sampleIDTracker.ts [app-route] (ecmascript)");
;
;
;
;
;
function generateRandomID(length = 10) {
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O,0,I,1
    let id = "";
    while(id.length < length){
        const byte = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(1)[0];
        const index = byte % charset.length;
        const char = charset[index];
        // Optional: avoid repeating last char
        if (id.length > 0 && id[id.length - 1] === char) continue;
        id += char;
    }
    return id;
}
function generateRunId() {
    // Example: 20251214-163012-7f3a
    const d = new Date();
    const pad = (n)=>String(n).padStart(2, "0");
    const YYYY = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    const rand = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(2).toString("hex"); // 4 chars
    return `${YYYY}${MM}${DD}-${hh}${mm}${ss}-${rand}`;
}
// Simple lock to prevent parallel runs from corrupting used-sample-ids.json writes.
// (Works well for single-machine / single-process workflows.)
const LOCK_PATH = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].resolve("used-sample-ids.lock");
async function acquireLock() {
    // 'wx' => create exclusively; fails if exists
    const handle = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].open(LOCK_PATH, "wx");
    await handle.close();
}
async function releaseLock() {
    try {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].unlink(LOCK_PATH);
    } catch  {
    // ignore
    }
}
class BarcodeInfo {
    clientCode;
    sampleID;
    constructor(clientCode, sampleID){
        this.clientCode = clientCode;
        this.sampleID = sampleID;
    }
    toFileName() {
        return `${this.clientCode}_${this.sampleID}.svg`;
    }
}
async function generateBarcodeRun(config) {
    const { clientCode, panelCode, count, outputDir } = config;
    // 🔒 Clamp by grid (AAR026: 2 cols × 13 rows = 26 labels/page)
    const COLS = 2;
    const ROWS_PER_COL = 13;
    const PER_PAGE = COLS * ROWS_PER_COL;
    const pages = 1; // one page for now
    const effectiveCount = Math.min(count, PER_PAGE * pages);
    // ✅ Create a per-run folder
    const runId = generateRunId();
    const runDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(outputDir, "runs", runId);
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(runDir, {
        recursive: true
    });
    const createdAt = new Date().toISOString();
    // Checkpoint settings
    const CHECKPOINT_EVERY = 10;
    const barcodes = [];
    const createdFiles = [];
    let usedIDs = new Set();
    let attempts = 0;
    const maxAttempts = effectiveCount * 10;
    // Lock so two generators can't trample used-sample-ids.json
    await acquireLock();
    try {
        usedIDs = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$logic$2f$sampleIDTracker$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadUsedSampleIDs"])();
        while(barcodes.length < effectiveCount && attempts < maxAttempts){
            const sampleID = generateRandomID();
            if (usedIDs.has(sampleID)) {
                attempts++;
                continue;
            }
            // Mark used immediately (in-memory)
            usedIDs.add(sampleID);
            const code = `${clientCode}|${sampleID}`;
            const info = new BarcodeInfo(clientCode, sampleID);
            barcodes.push(info);
            // Write SVG into run folder
            const svg = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$exporters$2f$createBarcodeSvg$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createBarcodeSVG"])(clientCode, sampleID, panelCode);
            const filename = `${code.replace("|", "_")}.svg`;
            const fullPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(runDir, filename);
            await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(fullPath, svg);
            createdFiles.push(filename);
            console.log(`Generated barcode: ${code}`);
            // ✅ Checkpoint used IDs periodically to reduce duplicate risk on crash
            if (barcodes.length % CHECKPOINT_EVERY === 0) {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$logic$2f$sampleIDTracker$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["saveUsedSampleIDs"])(usedIDs);
                console.log(`💾 Checkpoint: saved used IDs (${usedIDs.size})`);
            }
        }
        if (barcodes.length < effectiveCount) {
            console.warn(`Only generated ${barcodes.length} unique barcodes (out of effective ${effectiveCount}, requested ${count})`);
        }
        // Final save
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$logic$2f$sampleIDTracker$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["saveUsedSampleIDs"])(usedIDs);
        console.log("Saved used sample IDs:", usedIDs.size);
    } finally{
        await releaseLock();
    }
    // Write manifest for THIS run (not "latest-batch.json")
    const manifest = {
        runId,
        createdAt,
        template: "AAR026",
        countRequested: count,
        countEffective: effectiveCount,
        countGenerated: barcodes.length,
        clientCode,
        panelCode,
        // filenames relative to runDir
        files: createdFiles,
        // These will be filled later by your PDF/CSV step:
        pdfFile: null,
        csvFile: null
    };
    const manifestPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(runDir, "manifest.json");
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`🧾 Wrote manifest: ${manifestPath} (${createdFiles.length} files)`);
    console.log(`📁 Run folder: ${runDir}`);
    return {
        runId,
        runDir,
        manifestPath,
        createdAt,
        template: "AAR026",
        barcodes,
        countRequested: count,
        countEffective: effectiveCount,
        countGenerated: barcodes.length,
        clientCode,
        panelCode,
        files: createdFiles
    };
}
async function generateBarcodeInfo(config) {
    const run = await generateBarcodeRun(config);
    return run.barcodes;
}
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/sharp [external] (sharp, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("sharp", () => require("sharp"));

module.exports = mod;
}),
"[project]/src/exporters/createBarcodeCsv.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createBarcodeCSVFile",
    ()=>createBarcodeCSVFile
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs/promises [external] (fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
async function createBarcodeCSVFile(barcodes, outputDir, panelCode, printingDate) {
    const csvContent = barcodes.map((barcode)=>{
        return `${barcode.clientCode},${barcode.sampleID},${panelCode},${printingDate}`;
    }).join("\n") + "\n";
    const csvHeader = `ClientCode, SampleID, PanelCode, PrintingDate (${printingDate})\n`;
    const fullContent = `\n${csvHeader}${csvContent}`;
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(outputDir, {
        recursive: true
    });
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].appendFile(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(outputDir, "barcodes.csv"), fullContent);
    return barcodes;
}
}),
"[project]/src/exporters/pdfGenerator.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/exporters/pdfGenerator.ts
__turbopack_context__.s([
    "createBarcodePDF",
    ()=>createBarcodePDF
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs/promises [external] (fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdfkit$2f$js$2f$pdfkit$2e$es$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/pdfkit/js/pdfkit.es.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$sharp__$5b$external$5d$__$28$sharp$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/sharp [external] (sharp, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$logic$2f$barCodeDimensions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/logic/barCodeDimensions.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$exporters$2f$createBarcodeCsv$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/exporters/createBarcodeCsv.ts [app-route] (ecmascript)");
;
;
;
;
;
;
;
const { widthPx, heightPx } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$logic$2f$barCodeDimensions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getBarcodeRasterSize"])(300);
// --- Helpers ---------------------------------------------------------------
function mmToPt(mm) {
    return mm * 72 / 25.4;
}
function formatTimestampForFilename(iso) {
    const d = iso ? new Date(iso) : new Date();
    const pad = (n)=>String(n).padStart(2, "0");
    const YYYY = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${YYYY}-${MM}-${DD}_${hh}-${mm}-${ss}`;
}
function applyTimestampPlaceholder(p, ts) {
    return p.includes("{timestamp}") ? p.replace("{timestamp}", ts) : p;
}
function parseClientAndSample(fileName) {
    const base = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].basename(fileName, ".svg");
    const idx = base.indexOf("_");
    if (idx <= 0 || idx === base.length - 1) return null;
    const clientCode = base.slice(0, idx);
    const sampleID = base.slice(idx + 1);
    return {
        clientCode,
        sampleID
    };
}
async function fileExists(p) {
    try {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].access(p);
        return true;
    } catch  {
        return false;
    }
}
/**
 * Best-effort: if manifestPath exists, update manifest.json with pdfFile/csvFile
 * (keeps other fields intact).
 */ async function updateManifestFiles(manifestPath, updates) {
    try {
        const raw = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readFile(manifestPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (typeof updates.pdfFile !== "undefined") parsed.pdfFile = updates.pdfFile;
        if (typeof updates.csvFile !== "undefined") parsed.csvFile = updates.csvFile;
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(manifestPath, JSON.stringify(parsed, null, 2), "utf-8");
        console.log(`🧾 Updated manifest with output files: ${manifestPath}`);
    } catch (err) {
        console.warn("⚠️ Could not update manifest with pdf/csv file names:", err);
    }
}
async function createBarcodePDF(config) {
    console.log("📥 Starting createBarcodePDF");
    // --- 0) Resolve the file list (latest batch first) ---
    let svgFiles = [];
    let manifestCreatedAt;
    if (config.svgFiles && config.svgFiles.length > 0) {
        console.log("📄 Using explicit svgFiles passed in PDFConfig");
        svgFiles = config.svgFiles.map((f)=>__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].isAbsolute(f) ? f : __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(config.svgDirectory, f));
    } else if (config.manifestPath) {
        console.log(`🧾 Reading manifest: ${config.manifestPath}`);
        const raw = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readFile(config.manifestPath, "utf-8");
        const parsed = JSON.parse(raw);
        const files = parsed.files ?? [];
        manifestCreatedAt = parsed.createdAt;
        if (files.length === 0) {
            console.warn("⚠️ Manifest has no files. Nothing to print.");
            return;
        }
        svgFiles = files.map((f)=>__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(config.svgDirectory, f));
        console.log(`📂 Manifest lists ${svgFiles.length} file(s).`);
    } else {
        console.log("↩️ No manifest/svgFiles provided, falling back to ALL .svg in directory");
        const all = (await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readdir(config.svgDirectory)).filter((f)=>f.endsWith(".svg"));
        svgFiles = all.map((f)=>__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(config.svgDirectory, f));
    }
    if (svgFiles.length === 0) {
        console.log("⚠️ No SVG files to print. Exiting.");
        return;
    }
    // --- 0.1) Compute timestamped output paths -------------------------------
    const timestamp = formatTimestampForFilename(manifestCreatedAt);
    const outputPdfPath = config.outputPath ? applyTimestampPlaceholder(config.outputPath, timestamp) : __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(config.svgDirectory, `labels-${timestamp}.pdf`);
    const outputCsvPath = config.csvOutputPath ? applyTimestampPlaceholder(config.csvOutputPath, timestamp) : __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(config.svgDirectory, `labels-${timestamp}.csv`);
    // --- 1) Layout setup (AAR026 exact) --------------------------------------
    // Sheet: A4 = 210 × 297 mm
    const pageW = mmToPt(210);
    const pageH = mmToPt(297);
    // Margins:
    const marginTop = mmToPt(21);
    const marginBottom = mmToPt(21);
    const marginLeft = mmToPt(17.5);
    const marginRight = mmToPt(17.5);
    // Label:
    const labelW = mmToPt(85);
    const labelH = mmToPt(15);
    const labelRadius = mmToPt(1.5);
    // Gaps:
    const gapAcross = mmToPt(5); // între coloane
    const gapAround = mmToPt(5); // între rânduri
    // Grid:
    const cols = 2;
    const rows = 13; // 13 pe coloană (în total 26 / pagină)
    console.log(`🗒 AAR026 grid: ${cols}×${rows}, label ${labelW.toFixed(2)}×${labelH.toFixed(2)} pt`);
    console.log(`   Margins T/R/B/L: ${marginTop}/${marginRight}/${marginBottom}/${marginLeft} pt`);
    console.log(`📂 Files to print: ${svgFiles.length}`);
    console.log(`🕒 Using timestamp: ${timestamp}`);
    console.log(`🧾 PDF will be saved as: ${outputPdfPath}`);
    // --- 2) Convert SVG → 300 DPI PNG ---
    console.log(`🔢 Raster target: ${widthPx}×${heightPx} px`);
    const images = await Promise.all(svgFiles.map(async (fullPath)=>{
        const file = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].basename(fullPath);
        console.log(`🔄 Converting ${file} at 300 DPI`);
        const svgBuf = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readFile(fullPath);
        const pngBuf = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$sharp__$5b$external$5d$__$28$sharp$2c$__cjs$29$__["default"])(svgBuf, {
            density: 300
        }).resize(widthPx, heightPx, {
            fit: "contain",
            background: "#ffffff"
        }).png({
            compressionLevel: 0
        }).toBuffer();
        return {
            buffer: pngBuf,
            name: file
        };
    }));
    console.log(`✅ Converted ${images.length} images to 300 DPI PNG`);
    // --- 3) Create PDF & pipe ---
    const doc = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdfkit$2f$js$2f$pdfkit$2e$es$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"]({
        size: [
            pageW,
            pageH
        ],
        margin: 0
    });
    const stream = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["createWriteStream"])(outputPdfPath);
    console.log("📤 Piping PDFDocument to file stream");
    doc.pipe(stream);
    // Debug events
    doc.on("pageAdded", ()=>console.log("📄 pageAdded event"));
    doc.on("end", ()=>console.log("🏁 doc end event"));
    stream.on("close", ()=>console.log("🔒 stream close event"));
    stream.on("error", (err)=>console.error("❌ stream error:", err));
    // --- 4) Exact placement loop (left→right, top→bottom) --------------------
    let idx = 0;
    let page = 0;
    const startX = marginLeft;
    const startY = marginTop;
    // Câte etichete / pagină:
    const perPage = cols * rows;
    while(idx < images.length){
        console.log(`🏷 Starting page ${page + 1}`);
        if (page > 0) doc.addPage({
            size: [
                pageW,
                pageH
            ],
            margin: 0
        });
        // pentru fiecare celulă din grilă
        for(let r = 0; r < rows && idx < images.length; r++){
            for(let c = 0; c < cols && idx < images.length; c++){
                const x = startX + c * (labelW + gapAcross);
                const y = startY + r * (labelH + gapAround);
                const image = images[idx];
                console.log(`   📍 Placing image ${idx + 1} (${image.name}) at (${x.toFixed(1)},${y.toFixed(1)})`);
                // opțional: ghid cu colțuri rotunjite (vizual/debug)
                doc.save().lineWidth(0.5).strokeColor("#E5E7EB") // gri deschis pentru ghidaj
                .roundedRect(x, y, labelW, labelH, labelRadius).stroke().restore();
                // plasează imaginea să "umple" eticheta
                doc.image(image.buffer, x, y, {
                    width: labelW,
                    height: labelH
                });
                idx++;
            }
        }
        page++;
    }
    console.log(`🗒 Finished layout loop; total pages: ${page}`);
    // --- 5) Finalize PDF ---
    console.log("🔚 Calling doc.end()");
    doc.end();
    console.log("⏳ Waiting for PDF to finish...");
    await new Promise((resolve, reject)=>{
        doc.on("end", ()=>{
            console.log("🏁 doc emitted end");
            resolve();
        });
        stream.on("close", ()=>{
            console.log("🔒 stream emitted close");
            resolve();
        });
        stream.on("error", (err)=>{
            console.error("❌ stream error during finalize:", err);
            reject(err);
        });
        doc.on("error", (err)=>{
            console.error("❌ doc error during finalize:", err);
            reject(err);
        });
    });
    console.log(`🎉 PDF saved to ${outputPdfPath}`);
    // ✅ If we used a manifest, update it with the produced PDF file name
    if (config.manifestPath) {
        await updateManifestFiles(config.manifestPath, {
            pdfFile: __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].basename(outputPdfPath)
        });
    }
    // --- 6) (Optional) Also write CSV for the same batch ---------------------
    if (config.writeCsv) {
        const panelCode = config.panelCode;
        if (!panelCode) {
            console.warn("⚠️ writeCsv requested, but panelCode is missing in PDFConfig. Skipping CSV.");
            return;
        }
        const barcodes = svgFiles.map((f)=>__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].basename(f)).map(parseClientAndSample).filter((x)=>!!x).map(({ clientCode, sampleID })=>({
                clientCode,
                sampleID
            }));
        if (barcodes.length === 0) {
            console.warn("⚠️ No parsable filenames for CSV. Skipping CSV.");
            return;
        }
        // call createBarcodeCSVFile into the directory of outputCsvPath and then:
        // - if outputCsvPath already exists afterwards, we don't overwrite it with our fallback
        // - otherwise, we write outputCsvPath as a deterministic fallback
        const outputDirForCsv = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].dirname(outputCsvPath);
        const labelCreationDate = timestamp.replace("_", " ");
        console.log("🧾 Creating CSV for the same batch...");
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$exporters$2f$createBarcodeCsv$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createBarcodeCSVFile"])(barcodes, outputDirForCsv, panelCode, labelCreationDate);
        const alreadyThere = await fileExists(outputCsvPath);
        if (!alreadyThere) {
            try {
                const lines = [
                    "clientCode,sampleID,panelCode,createdAt",
                    ...barcodes.map((b)=>`${b.clientCode},${b.sampleID},${panelCode},${labelCreationDate}`)
                ];
                await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(outputCsvPath, lines.join("\n"), "utf-8");
                console.log(`🧾 CSV saved to ${outputCsvPath}`);
            } catch (err) {
                console.warn("⚠️ Could not write timestamped CSV file next to the PDF:", err);
            }
        } else {
            console.log(`🧾 CSV already exists at ${outputCsvPath} (skipping fallback write)`);
        }
        // If we used a manifest, update it with the produced CSV file name
        if (config.manifestPath) {
            await updateManifestFiles(config.manifestPath, {
                csvFile: __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].basename(outputCsvPath)
            });
        }
    }
}
}),
"[project]/src/app/api/generate/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs/promises [external] (fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$logic$2f$generateBarcodeInfo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/logic/generateBarcodeInfo.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$exporters$2f$pdfGenerator$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/exporters/pdfGenerator.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$backend$2f$paths$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/backend/paths.ts [app-route] (ecmascript)");
;
;
;
;
;
;
const runtime = "nodejs";
async function POST(req) {
    try {
        const body = await req.json().catch(()=>({}));
        // MVP defaults (poți schimba ulterior din UI)
        const clientCode = body.clientCode ?? "DK010";
        const panelCode = body.panelCode ?? "APV13";
        const count = typeof body.count === "number" ? body.count : 26;
        // Asigură output root în repo
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$backend$2f$paths$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["OUTPUT_ROOT"], {
            recursive: true
        });
        const barcodeConfig = {
            clientCode,
            panelCode,
            count,
            // IMPORTANT: outputDir trebuie să fie src/output (nu src/output/runs),
            // pentru că generateBarcodeRun adaugă singur /runs/<runId>
            outputDir: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$backend$2f$paths$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["OUTPUT_ROOT"]
        };
        // 1) Generate SVG + manifest per run
        const run = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$logic$2f$generateBarcodeInfo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generateBarcodeRun"])(barcodeConfig);
        // 2) Generate PDF + CSV in același runDir, plus update manifest
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$exporters$2f$pdfGenerator$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createBarcodePDF"])({
            svgDirectory: run.runDir,
            manifestPath: run.manifestPath,
            outputPath: __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(run.runDir, "labels.pdf"),
            // proprietate custom folosită în pdfGenerator.ts
            ...{
                writeCsv: true,
                panelCode: run.panelCode,
                csvOutputPath: __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(run.runDir, "labels.csv")
            },
            layout: {
                pageSize: "A4",
                columns: 2,
                spacing: {
                    vertical: 0
                }
            }
        });
        // 3) Return card data (linkurile vor funcționa după ce facem endpoint-ul /file)
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            runId: run.runId,
            createdAt: run.createdAt,
            template: run.template,
            countRequested: run.countRequested,
            countGenerated: run.countGenerated,
            runDir: run.runDir,
            pdfUrl: `/api/barcodes/runs/${run.runId}/file?kind=pdf`,
            csvUrl: `/api/barcodes/runs/${run.runId}/file?kind=csv`
        });
    } catch (err) {
        console.error("❌ /api/barcodes/generate error:", err);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to generate barcodes."
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__dddb9615._.js.map