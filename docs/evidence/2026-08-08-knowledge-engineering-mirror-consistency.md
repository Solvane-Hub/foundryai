# Consistency check — Knowledge Engineering mirrors K1–K7

**Date:** 2026-08-08 · **Scope:** `docs/architecture/knowledge-engineering/` vs Notion canonical
**Method:** each document fetched from the Notion URL registered in `DOCUMENT_MANIFEST.md`,
then compared section-by-section against the local mirror.

---

## Result

| Doc | Notion source (registered)  | Local mirror                                   | Sections     | Content | URL in header |
| --- | --------------------------- | ---------------------------------------------- | ------------ | ------- | ------------- |
| K1  | `…029a80c580bef58ed40d17d0` | `knowledge-pack-authoring-guide.md`            | ✅           | ✅      | ✅            |
| K2  | `…029a8086b80fe8b072cd1acd` | `knowledge-validation-standard.md`             | ✅ 1–14      | ✅      | ✅            |
| K3  | `…029a8064924ae0b662f2be18` | `knowledge-chunking-strategy.md`               | ✅ 1–12      | ✅      | ✅            |
| K4  | `…029a801caa4acac8d7d5c6d6` | `metadata-and-citation-standard.md`            | ✅ 1–14      | ✅      | ✅            |
| K5  | `…029a801b9323cb24bef41654` | `retrieval-architecture.md`                    | ✅ 1–18      | ✅      | ✅            |
| K6  | `…029a80b1aaa8e7f640dfd878` | `knowledge-monitoring-and-change-detection.md` | ✅ 1–17 + 2A | ✅      | ✅            |
| K7  | `…029a80dbaef2c618e40683f2` | `knowledge-publishing-pipeline.md`             | ✅ 1–17      | ✅      | ✅            |

**No discrepancies remain between the mirrors and their Notion sources.**

---

## Discrepancies found and corrected during this exercise

### D1 — first mirroring pass paraphrased instead of mirroring · **corrected**

The initial pass wrote K2–K7 from working memory of the amendments applied earlier the same
day rather than re-fetching the sources. The output was internally coherent and contained the
correct rules, but it was not the canonical text: sections were renumbered and merged, prose
was rewritten, and pipeline diagrams were replaced with shorter equivalents.

Concrete examples of what the paraphrase would have introduced:

- **K5** was reduced from 18 sections to 15. Sections 8 (Hybrid Retrieval), 14 (Performance
  Objectives), 15 (Monitoring) and 16 (Security) were absent entirely — including the RLS and
  tenant-isolation requirements.
- **K6** §2A was rewritten into five generic paragraphs, dropping every operational value the
  founder-approved merge carried over from AI-6: the cadence table, the **−10** staleness
  penalty, the `ready` vs `active` plan-cascade rule, and the "a 404 is not an unpublish" rule.
- **K3 §6** gained a "blocked on KI1/MP-1" warning that does not exist in the source.
- **K4 §8** gained "Legal Source Categories" in the controlled-vocabulary list, which the
  source does not list.

All six were discarded and re-mirrored from freshly fetched sources.

### D2 — three mirror headers carried wrong Notion URLs · **corrected**

The paraphrased K5, K6 and K7 headers cited URLs that do not resolve to those documents. The
error surfaced when the headers were cross-checked against `DOCUMENT_MANIFEST.md`, which
disagreed. The manifest was correct in all three cases.

This is the manifest earning its rule — _a document not in the manifest is not canonical_ —
by catching a citation error in a document about citation discipline.

---

## Requirement verification

| #   | Requirement                                                           | Evidence                                                                                                |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Notion content and structure preserved                                | Section counts match; no substantive rewriting (see D1)                                                 |
| 2   | ADR-0015 / ADR-0016 terminology and constraints                       | K2 §7 §10 §14, K3 §5.1, K4 §5 §10, K5 §3.4, K6 §17, K7 §3.1                                             |
| 3   | `Reasoning Confidence` canonical                                      | 12 occurrences. The 2 remaining "Reasoning Quality" strings are the correction notes in K2 §7 and K4 §5 |
| 4   | Five-level Source Authority canonical; Legal Source Category retained | K2 §8.1 mapping table; K3 §8; K5 §3.4 §11. No sixth level                                               |
| 5   | Claim-level trust not stored as chunk trust                           | K3 §5.1 table; K5 §3.4, §11                                                                             |
| 6   | `chunk_id` single citation identity                                   | K4 §6; K5 §3.10 ("no competing identity field"), §11                                                    |
| 7   | A9 reproducibility preserved                                          | K5 §3.8 ordered result set; §12 persisted replay inputs                                                 |
| 8   | Embeddings as retrieval artifacts                                     | K7 §3 split, §3.1, §7; K5 §3.8                                                                          |
| 9   | AI-6 history and retirement mapping preserved, not recreated          | K6 §2A banner + §17 "Superseded"; `../knowledge-freshness-specification.md` retained                    |
| 10  | Manifest / CHANGELOG / CLAUDE.md updated                              | All three; C2 and C3 rows marked resolved                                                               |
| 11  | No duplicate documents or new specifications                          | 7 files for 7 documents; no new spec authored                                                           |
| 12  | No embedding model chosen                                             | K7 §3.1 and §7 both state KI1 / MP-1 open; K5 §7 unchanged                                              |

---

## Standing risk

Notion and the repository are now two copies of the same seven documents. Nothing enforces
their agreement. The mirror headers make drift _detectable_ by a human who checks, but no CI
job checks. Until one exists, the honest statement is that the repository is accurate **as of
2026-08-08** — not that it is kept accurate.
