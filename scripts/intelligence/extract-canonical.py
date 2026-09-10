"""Extract the approved Intelligence DOCX tables; no database access.

Uses only Python standard library. Source content and hyperlinks are read in
document order. Empty numerical cells become missingYears, never zero.
"""
import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
COMMODITIES = {
    "Batubara": ("batubara", "coal", "metric_ton", "bps-esdm", "HBA_6322", "metric_ton"),
    "Nikel": ("nikel", "ore", "metric_ton", "bps", "HMA_NIKEL", "dry_metric_ton"),
    "Emas": ("emas", "metal", "kilogram", "bps", "HMA_EMAS", "troy_ounce"),
    "Tembaga": ("tembaga", "concentrate", "metric_ton", "bps", None, None),
    "Timah": ("timah", "concentrate", "metric_ton", "bps", None, None),
    "Bijih Besi": ("bijih-besi", "concentrate", "metric_ton", "badan-geologi", None, None),
    "Bauksit": ("bauksit", "ore", "metric_ton", "bps", None, None),
}
PRICE_SERIES_CODES = {
    "HBA_6322": "hba-annual-canonical-esdm",
    "HMA_NIKEL": "hma-nikel-annual-canonical-esdm",
    "HMA_EMAS": "hma-emas-annual-canonical-esdm",
}


def text(node):
    return "".join(node.itertext()) if node.tag.endswith("}t") else "".join(t.text or "" for t in node.findall(".//w:t", NS))


def slug(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def decimal(value):
    if not re.fullmatch(r"\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:,\d+)?", value):
        raise ValueError("Format angka sumber tidak dikenali: " + value)
    return value.replace(".", "").replace(",", ".")


def source_codes(value):
    value = re.sub(r"([PLH])(\d+)[–-]\1?(\d+)", lambda m: "/".join(m[1] + str(n) for n in range(int(m[2]), int(m[3]) + 1)), value)
    return re.findall(r"[PLHG]\d+", value)


def extract(path):
    with zipfile.ZipFile(path) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
        relations = {r.attrib["Id"]: r.attrib["Target"] for r in ET.fromstring(archive.read("word/_rels/document.xml.rels")) if r.attrib.get("TargetMode") == "External"}
    blocks = []
    for block in document.find("w:body", NS):
        if block.tag.endswith("}tbl"):
            blocks.append([[text(cell).strip() for cell in row.findall("w:tc", NS)] for row in block.findall("w:tr", NS)])
        elif text(block).strip():
            links = [relations[h.attrib["{" + NS["r"] + "}id"]] for h in block.findall(".//w:hyperlink", NS) if "{" + NS["r"] + "}id" in h.attrib]
            blocks.append((text(block).strip(), links))
    sources = {}
    for index, block in enumerate(blocks):
        if not isinstance(block, tuple):
            continue
        match = re.match(r"^([PHLG]\d+)\s+(.+)$", block[0])
        if match:
            code, name = match.groups()
            description = blocks[index + 1][0] if isinstance(blocks[index + 1], tuple) else None
            urls = block[1]
            if not urls and code == "H9":
                urls = [sources["P2"]["url"]]
            if len(urls) != 1:
                raise ValueError("URL sumber tidak tunggal: " + code)
            organization = "Badan Pusat Statistik" if code in ("P4", "P5", "P6") else "Kementerian Keuangan" if code == "H8" else "Kementerian ESDM"
            if code.startswith("L"):
                organization = name
            sources[code] = {"code": code, "slug": "intelligence-final-2026-" + code.lower(), "name": name,
                             "type": "company_report" if code.startswith("L") else "statistics_agency" if code in ("P4", "P5", "P6") else "government",
                             "organization": organization, "url": urls[0], "description": description,
                             "isOfficial": True, "verificationStatus": "verified"}
    def refs(codes):
        return [{"sourceSlug": sources[code]["slug"], "citationLabel": sources[code]["name"], "sourceUrl": sources[code]["url"], "pageReference": None} for code in source_codes(codes)]
    datasets = []
    for name, (commodity, form, unit, issuer, standard, price_unit) in COMMODITIES.items():
        start = next(i for i, b in enumerate(blocks) if isinstance(b, tuple) and b[0] == name)
        end = next((i for i in range(start + 1, len(blocks)) if isinstance(blocks[i], tuple) and blocks[i][0] in COMMODITIES), len(blocks))
        segment = blocks[start:end]
        tables = [b for b in segment if isinstance(b, list)]
        identity = dict(tables[0][1:])
        production = next(t for t in tables if t[0][:2] == ["Tahun", "Produksi"])
        prices = next(t for t in tables if t[0][:2] == ["Tahun", "Rata-rata tahunan"])
        coverage = next(t for t in tables if t[0][0] == "Provinsi")
        def methodology(table):
            pos = segment.index(table)
            return segment[pos + 1][0] if pos + 1 < len(segment) and isinstance(segment[pos + 1], tuple) else None
        records = [{"year": int(row[0]), "value": decimal(row[1]), "recordType": "actual", "verificationStatus": "verified", "sources": refs(row[4]), "notes": row[3]} for row in production[1:] if row[1]]
        price_records = [{"year": int(row[0]), "value": decimal(row[1]), "recordType": "actual", "verificationStatus": "verified", "sources": refs(row[4]), "notes": row[3]} for row in prices[1:] if row[1]]
        regions = []
        for province, area, company, codes, ranking in coverage[1:]:
            regions.append({"regionSlug": slug(province), "regionName": province, "coverageType": "known_occurrence",
                            "areaDescription": area, "relatedCompanyName": company or None, "industryCompanySlug": None,
                            "productionValue": None, "productionYear": None, "unitCode": None, "rank": None,
                            "rankingStatus": "unverified", "rankingEvidence": None, "sources": refs(codes),
                            "verificationStatus": "verified" if codes else "pending",
                            "notes": ranking + (". Sumber langsung hubungan wilayah masih diperlukan." if not codes else ". Bukan klaim perusahaan atau tambang terbesar.")})
        # Only singular sites with explicit operational evidence in the document.
        singular = {"Sangatta", "Tanjung Enim", "Sorowako", "Halmahera Tengah / Weda", "Pulau Gag, Raja Ampat", "Kawasan tambang bawah tanah Grasberg", "Batu Hijau"}
        locations = [{"regionSlug": row["regionSlug"], "siteSlug": slug(row["areaDescription"]), "siteName": row["areaDescription"],
                      "siteType": "mine", "companyName": row["relatedCompanyName"], "industryCompanySlug": None,
                      "latitude": None, "longitude": None, "locationAccuracy": "unknown", "geometrySourceUrl": None,
                      "operationStatus": "operating", "isPrimary": False, "primaryReason": None,
                      "sources": row["sources"], "verificationStatus": "verified",
                      "notes": "Koordinat dan pembanding produksi tidak tersedia dalam dokumen final; bukan marker publik atau klaim terbesar."}
                     for row in regions if row["sources"] and row["areaDescription"] in singular]
        datasets.append({"schemaVersion": "2.0", "commoditySlug": commodity, "documentSlug": identity["commodity_slug"], "name": name,
                         "productionSeries": {"seriesCode": f"{commodity}-national-{form}-{issuer}", "name": identity["indikator produksi"],
                                              "productForm": form, "productionScope": "national", "unitCode": unit,
                                              "specification": identity["unit produksi"], "methodologyNotes": methodology(production),
                                              "isCanonical": True, "isPublicDefault": True, "records": records,
                                              "missingYears": [int(r[0]) for r in production[1:] if not r[1]]},
                         "priceSeries": {"seriesCode": PRICE_SERIES_CODES.get(standard), "standardCode": standard,
                                         "name": identity["indikator harga"], "period": "annual",
                                         "aggregationMethod": "annual_average" if standard else None,
                                         "isCanonical": True if standard else None, "isPublicDefault": True if standard else None,
                                         "currencyCode": "USD" if standard else None,
                                         "unitCode": price_unit, "methodologyNotes": methodology(prices), "records": price_records,
                                         "missingYears": [int(r[0]) for r in prices[1:] if not r[1]]},
                         "regionCoverage": regions, "locations": locations})
    manifest = {"schemaVersion": "2.0", "datasetName": "Intelligence — Fondasi Final Terverifikasi", "effectiveDate": "2026-09-09",
                "canonicalDocument": {"fileName": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()},
                "commodityFiles": [{"commoditySlug": d["commoditySlug"], "filePath": d["commoditySlug"] + ".json"} for d in datasets],
                "sourceCatalog": list(sources.values())}
    if len(datasets) != 7 or len(sources) != 30:
        raise ValueError("Struktur kanonik berubah: diharapkan 7 komoditas dan 30 kode sumber")
    return manifest, datasets


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--check-only", action="store_true")
    args = parser.parse_args()
    manifest, datasets = extract(args.input)
    for dataset in datasets:
        print(dataset["commoditySlug"], "production", len(dataset["productionSeries"]["records"]), "prices", len(dataset["priceSeries"]["records"]), "coverage", len(dataset["regionCoverage"]), "sites", len(dataset["locations"]))
    if not args.check_only:
        args.output.mkdir(parents=True, exist_ok=True)
        for name, data in [("manifest", manifest)] + [(d["commoditySlug"], d) for d in datasets]:
            (args.output / (name + ".json")).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
