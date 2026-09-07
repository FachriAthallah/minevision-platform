"""Regression tests for isolated canonical Career source overrides."""

import importlib.util
import sys
import unittest
from pathlib import Path


spec = importlib.util.spec_from_file_location(
    "career_extractor", Path(__file__).with_name("extract-career-docx.py")
)
extractor = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = extractor
spec.loader.exec_module(extractor)


class CanonicalSourceTests(unittest.TestCase):
    def parse(self, references):
        blocks = []
        for slug in extractor.REQUIRED_CATEGORY_SLUGS:
            blocks.append(extractor.Block(kind="paragraph", text=extractor.CATEGORY_NAMES[slug]))
            blocks.extend(references)
        report = extractor.ParseReport()
        catalog, links = extractor.parse_references(blocks, report)
        self.assertEqual(report.errors, [])
        return catalog, links

    def test_normalized_label_variants_use_exact_canonical_values(self):
        for label in ("JDIH Kementerian ESDM.", "JDIH Kementerian ESDM", "  jdih KEMENTERIAN esdm  "):
            with self.subTest(label=label):
                catalog, links = self.parse([extractor.Block(kind="paragraph", text=label)])
                self.assertEqual(catalog, [{
                    "slug": "jdih-kementerian-esdm",
                    "name": "JDIH Kementerian ESDM",
                    "organization": "Kementerian Energi dan Sumber Daya Mineral Republik Indonesia",
                    "url": "https://jdih.esdm.go.id/",
                    "type": "government",
                    "description": (
                        "Portal dokumentasi hukum resmi Kementerian ESDM untuk Keputusan Menteri "
                        "mengenai Harga Mineral Logam Acuan, Harga Batubara Acuan, regulasi minerba, "
                        "dan dokumen hukum sektor energi."
                    ),
                    "isOfficial": True,
                    "verificationStatus": "verified",
                }])
                self.assertTrue(all(slugs == ["jdih-kementerian-esdm"] for slugs in links.values()))

    def test_document_specific_source_keeps_existing_slug_and_values(self):
        document_label = "JDIH Kementerian ESDM. Keputusan Menteri ESDM Nomor 1825 K/30/MEM/2018."
        catalog, links = self.parse([
            extractor.Block(kind="paragraph", text="JDIH Kementerian ESDM."),
            extractor.Block(kind="paragraph", text=document_label),
        ])
        self.assertEqual(len(catalog), 2)
        self.assertEqual(catalog[0]["slug"], "jdih-kementerian-esdm")
        self.assertEqual(catalog[1], {
            "slug": "jdih-kementerian-esdm-2",
            "name": document_label,
            "organization": "JDIH Kementerian ESDM",
            "url": None,
            "type": "government",
            "description": None,
            "isOfficial": True,
            "verificationStatus": "verified",
        })
        self.assertTrue(all(slugs == ["jdih-kementerian-esdm", "jdih-kementerian-esdm-2"] for slugs in links.values()))

    def test_other_sources_keep_normalization_and_url_based_identity(self):
        catalog, _ = self.parse([
            extractor.Block(kind="paragraph", text="JDIH Kementerian Lain."),
            extractor.Block(kind="paragraph", text="JDIH Kementerian Lain.", urls=("https://example.com/",)),
        ])
        self.assertEqual([source["slug"] for source in catalog], ["jdih-kementerian-lain", "jdih-kementerian-lain-2"])
        self.assertEqual([source["url"] for source in catalog], [None, "https://example.com/"])
        for source in catalog:
            self.assertEqual(source["name"], "JDIH Kementerian Lain.")
            self.assertEqual(source["organization"], "JDIH Kementerian Lain.")
            self.assertIsNone(source["description"])


if __name__ == "__main__":
    unittest.main()
