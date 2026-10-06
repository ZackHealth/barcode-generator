"""Decode every label independently; never generate IDs or modify the ledger."""
import csv
import hashlib
import json
import re
import sys
from pathlib import Path

import numpy as np
import pymupdf as fitz
import zxingcpp


def read_json(file):
    assert not file.is_symlink(), f"Symlinked evidence is not supported: {file}"
    return json.loads(file.read_text())


def validate_ids(ids):
    assert ids and len(ids) == len(set(ids)), "Empty or duplicate IDs"
    assert all(isinstance(value, str) and re.fullmatch("[A-Z0-9]{10}", value) for value in ids), "Invalid IDs"


def mm(value):
    return value * 72 / 25.4


run = Path(sys.argv[1])
manifest = read_json(run / "manifest.json")
reservation = read_json(run / "reservation-check.json")
for filename in [manifest["csvFile"], manifest["pdfFile"], *manifest["files"]]:
    assert Path(filename).name == filename and not (run / filename).is_symlink(), "Invalid artifact path"

with (run / manifest["csvFile"]).open(newline="") as file:
    rows = list(csv.DictReader(file))
count = manifest["countGenerated"]
assert isinstance(count, int) and count == manifest["countRequested"] and 0 < count <= 520
assert len(rows) == count and len(manifest["files"]) == count
assert all(row["clientCode"] == manifest["clientCode"] and row["panelCode"] == manifest["panelCode"] for row in rows), "CSV metadata differs"
ids = [row["sampleID"] for row in rows]
assert ids == reservation["newIDs"], "CSV differs from reservations"
assert ids == [Path(file).stem.split("_")[1] for file in manifest["files"]], "Manifest order differs"

before = read_json(run / "ledger-before.json")["usedSampleIDs"]
after = read_json(run / "ledger-after.json")["usedSampleIDs"]
ledger = read_json(Path(sys.argv[2]))["usedSampleIDs"]
for collection in [before, after, ledger, ids]:
    validate_ids(collection)
assert set(before) <= set(after) <= set(ledger), "Historical IDs were removed"
assert not set(ids) & set(before), "Batch overlaps historical IDs"
assert set(after) - set(before) == set(ids), "Reservation growth differs from the batch"
assert reservation["beforeCount"] == len(before) and reservation["afterCount"] == len(after)
assert reservation["previousIDsPreserved"] is True and reservation["historicalOverlap"] == 0

expected = [f"{row['clientCode']}|{row['sampleID']}" for row in rows]
doc = fitz.open(run / manifest["pdfFile"])
assert len(doc) == (count + 25) // 26, "Incorrect PDF page count"
decoded = []
for page_number, page in enumerate(doc):
    assert abs(page.rect.width - mm(210)) < 0.1 and abs(page.rect.height - mm(297)) < 0.1, "PDF is not A4"
    for row in range(13):
        for column in range(2):
            if len(decoded) >= count:
                break
            x, y = mm(17.5 + column * 90), mm(21 + row * 20)
            pix = page.get_pixmap(dpi=300, clip=fitz.Rect(x, y, x + mm(85), y + mm(15)), colorspace=fitz.csRGB, alpha=False)
            image = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
            codes = zxingcpp.read_barcodes(image, formats=zxingcpp.BarcodeFormat.Code128)
            assert len(codes) == 1, f"Page {page_number + 1}, row {row + 1}, column {column + 1}: decoded {len(codes)} codes"
            decoded.append(codes[0].text)
assert decoded == expected, "PDF barcodes differ from CSV order or values"

result = {
    "runId": manifest["runId"],
    "clientCode": manifest["clientCode"],
    "panelCode": manifest["panelCode"],
    "pages": len(doc),
    "labelsPerPage": 26,
    "csvRows": count,
    "uniqueIDs": len(set(ids)),
    "decodedPdfBarcodes": len(decoded),
    "pdfMatchesCsvInOrder": True,
    "ledgerBeforeCount": len(before),
    "ledgerAfterCount": len(after),
    "previousIDsPreserved": True,
    "historicalOverlap": 0,
    "pdfFile": manifest["pdfFile"],
    "csvFile": manifest["csvFile"],
    "sha256": {name: hashlib.sha256((run / name).read_bytes()).hexdigest() for name in [manifest["pdfFile"], manifest["csvFile"]]},
    "verification": "Every PDF label rendered at 300 DPI and decoded independently as CODE128; values match CSV, manifest and newly reserved IDs.",
    "tools": {"pymupdf": fitz.VersionBind, "zxingCpp": "3.1.1"},
    "scope": "Digital PDF/CSV verification only. No Drive access or printer operation.",
}
(run / "verification.json").write_text(json.dumps(result, indent=2) + "\n")
for page_number in sorted({0, len(doc) - 1}):
    doc[page_number].get_pixmap(dpi=100, alpha=False).save(run / f"preview-page-{page_number + 1:02}.png")
print(json.dumps(result, indent=2))
