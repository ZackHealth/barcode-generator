import { expect, spyOn, test } from "bun:test";
import fs from "node:fs/promises";
import * as fsSync from "node:fs";
import { Writable } from "node:stream";
import os from "node:os";
import path from "node:path";
import { createBarcodePDF } from "../src/exporters/pdfGenerator";

test.each([false, true])("PDF generation waits for disk completion and propagates failure: %s", async fail => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "barcode-pdf-finish-test-"));
  const chunks = [];
  let finished = false;
  const stream = new Writable({
    write(chunk, encoding, callback) { chunks.push(Buffer.from(chunk)); callback(); },
    final(callback) { setTimeout(() => callback(fail ? new Error("simulated final disk failure") : undefined), 100); },
  });
  stream.on("finish", () => { finished = true; });
  const writer = spyOn(fsSync, "createWriteStream").mockReturnValue(stream);
  try {
    await fs.writeFile(path.join(directory, "DK010_ABCDEFGH23.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg" width="321" height="57"><rect width="321" height="57" fill="white"/></svg>');
    const completion = createBarcodePDF({ svgDirectory: directory, outputPath: path.join(directory, "labels.pdf") });
    if (fail) {
      await expect(completion).rejects.toThrow("simulated final disk failure");
      expect(finished).toBe(false);
    } else {
      await completion;
      expect(finished).toBe(true);
      expect(Buffer.concat(chunks).subarray(-20).toString()).toContain("%%EOF");
    }
  } finally {
    writer.mockRestore();
    stream.destroy();
    await fs.rm(directory, { recursive: true, force: true });
  }
});
