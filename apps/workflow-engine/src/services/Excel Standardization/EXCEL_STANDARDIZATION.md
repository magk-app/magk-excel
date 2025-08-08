# Excel Standardization Spec — Generalized (Any PDF → Standardized Excel)

This document defines a domain-agnostic, configurable standard for turning any PDF (tables, mixed layouts, or narrative text) into a consistent, auditable Excel workbook. It supports single-dataset exports and arbitrary comparisons (e.g., prior vs current period, vendor A vs vendor B, 2022 vs 2023), without hard-coding year semantics.

## 1. Core Concepts
- Dataset: A logically grouped result set from one or more sources (e.g., a single PDF, a batch of PDFs, a time period, a vendor).
- Schema: A named, versioned set of columns with types, formats, and validation rules for a given domain (e.g., Facilities, Invoices, Inventory). Schemas are defined in config.
- Baseline/Target (optional): Any two datasets can be compared to produce a Delta sheet (not limited to years).

## 2. Workbook Outputs (Generalized)
- Data_<datasetId>: Standardized records for a dataset (e.g., Data_Q2_2024, Data_VendorX, Data_Run123).
- Delta_<baselineId>_<targetId>: Change log between two datasets (optional).
- Summary: KPIs, counts, confidence distribution, totals by key fields.
- Errors_<datasetId>: Parse/validation issues with suggested actions.
- Lineage_<datasetId>: Provenance linking values to PDF locations and extractor rules.

Notes:
- Multiple Data sheets can coexist in one workbook to support side-by-side analysis (e.g., Data_2022 and Data_2023).
- Naming is driven by config and sanitized to Excel limits.

## 3. Canonical Schema Model (Config-Driven)
Schemas are declared in configuration (YAML/JSON). Each schema defines columns with:
- key: unique column key (machine-readable)
- label: human-readable header
- type: one of [string, integer, number, currency, percent, date, enum, boolean]
- required: boolean
- format: Excel number/date format (optional)
- enumValues: for enum types (optional)
- validation: constraints (min/max, regex, list) (optional)
- synonyms: header variants used in PDFs for mapping (optional)
- derive: computed expression or function name (optional)

Example (Finance/Facilities, illustrative):
```yaml
schema:
  name: Facilities
  version: 1
  columns:
    - key: company
      label: Company
      type: string
      required: true
      synonyms: [Issuer, Borrower, Parent]
    - key: facility_name
      label: Facility Name
      type: string
      required: true
    - key: facility_type
      label: Facility Type
      type: enum
      enumValues: [Revolver, Term Loan, MTN, Bond, Notes, CP, Other]
      required: true
    - key: currency
      label: Currency
      type: string
      validation:
        list: [USD, EUR, GBP, JPY]
    - key: commitment_base
      label: Total Commitment (Base)
      type: currency
      required: true
      format: "$#,##0.00"
    - key: commitment_native
      label: Total Commitment (Native)
      type: currency
      format: "#,##0.00"
    - key: interest_rate
      label: Interest Rate (%)
      type: percent
      format: "0.00%"
    - key: spread_bps
      label: Spread (bps)
      type: integer
    - key: issue_date
      label: Issue Date
      type: date
      format: "yyyy-mm-dd"
    - key: maturity_date
      label: Maturity Date
      type: date
      format: "yyyy-mm-dd"
    - key: confidence
      label: Confidence
      type: number
```

## 4. Sheet Layouts and Formatting (Standard)
- Header style: bold, light-gray fill (#DCE6F1), thin border (all Data/Delta/Errors/Lineage sheets).
- Freeze panes: row 1 on Data_* and Delta_* sheets.
- AutoFilter: header row enabled.
- Column widths: auto-sized by content length with clamping [10..60] characters.
- Data validation:
  - enum/list columns: Excel list validation.
  - dates: Excel date format enforced; parse to ISO internally.
- Conditional formatting:
  - Cells with missing required fields in Data_*: yellow fill.
  - Confidence < threshold (config, default 0.60): light red fill.
  - Delta_*: highlight changed cells; optional color coding for New/Removed/Modified rows.

## 5. Data Mapping & Normalization (Generic)
- Header mapping: match PDF headers to schema labels using (in order): exact (case-insensitive), synonym list, fuzzy match (Levenshtein ≤ N, configurable), type hints.
- Value parsing (generic regex library):
  - Numbers: `[-+]?\d{1,3}(?:,\d{3})*(?:\.\d+)?`
  - Currency amounts: detect symbols [$£€¥], parentheses → negative, unit suffixes [k,m,b].
  - Percent: `\d+(?:\.\d+)?%`
  - Dates: U.S. month names and ISO `YYYY-MM-DD` (extensible via config locale).
- Units and currency:
  - Suffix multipliers: k=1e3, m/M=1e6, b/B=1e9.
  - Parentheses indicate negative.
  - Base vs native currency optional; conversion rules configurable (source, as-of date).
- Text normalization: Unicode NFKC, whitespace collapse, dash unification, trimming.

## 6. Identity & Deduplication (Configurable)
- Identity key: ordered list of column keys used to create a deterministic `record_id` (e.g., SHA-256 of normalized concatenation).
- Normalization for identity: lowercasing, trimming, punctuation removal (configurable), dash unification.
- Strategies:
  - first_wins
  - override (prefer later dataset)
  - merge (fill nulls; prefer higher confidence)
  - flag (retain all; mark duplicates)

## 7. Delta Computation (Any Two Datasets)
- Inputs: two Data sheets (baselineId, targetId) of the same schema.
- Row alignment: by `record_id`.
- Change types:
  - New: present only in target
  - Removed: present only in baseline
  - Modified: present in both with at least one comparable field different
  - Unchanged: present in both with all comparable fields equal within tolerance
- Field comparison rules:
  - Strings: case-insensitive exact (after normalization). Fuzzy equality may be enabled for identity only.
  - Numbers: tolerance absolute/relative per column (config defaults: percent_abs=0.005, spread_bps_abs=1, currency_relative=0.001).
  - Dates: ISO string equality.
- Delta_* columns (for each comparable field F): `F_baseline`, `F_target`, `ΔF` (numeric diff where applicable), `%ΔF` (optional).

## 8. Errors & Lineage (Auditability)
- Errors_<datasetId> rows:
  - `record_id?`, `field`, `value`, `issue`, `severity` (Error|Warning), `hint/suggestion`, `page?`, `table_id?`, `confidence?`
- Lineage_<datasetId> rows:
  - `record_id`, `field`, `value`, `page`, `table_id`, `cell_coordinates (x,y,w,h)`, `extraction_method (Vector|OCR)`, `extraction_confidence`, `parser_rule`

## 9. Summary (Generic KPIs)
- Counts: total records, completeness (required fields filled), duplicate count (pre/post-dedupe).
- Confidence: min/avg/max, histogram buckets.
- Totals: configurable aggregates (e.g., sum over currency fields), by category (e.g., facility type) if present.
- If Delta sheet exists: counts of New/Removed/Modified/Unchanged; total differences for selected numeric fields.

## 10. Configuration (YAML Example)
```yaml
workbook:
  default_sheet_prefix: Data
  confidence_threshold: 0.6
  auto_charts: false

schemaRef: Facilities  # pick which schema to use for this run

identity:
  keys: [company, facility_name, facility_type, issue_date]
  normalize:
    case_fold: true
    trim: true
    remove_punctuation: true
    unify_dashes: true

tolerance:
  percent_abs: 0.005
  spread_bps_abs: 1
  currency_relative: 0.001

currency:
  base: USD
  convert: false       # true to enable conversion
  fx_source: ECB       # or OANDA
  as_of: issue_date    # conversion date policy

mapping:
  fuzzy_distance: 2
  prefer_type_hints: true

dedup:
  strategy: merge      # first_wins | override | merge | flag

computed:
  enable: false
  fields:
    - key: spread_bps
      formula: "(interest_rate - base_rate_percent) * 10000"
```

## 11. Sheet Construction Rules
- Data_<datasetId>
  - Use configured schema columns in declared order.
  - Apply number/date formats and data validation from schema.
  - Apply conditional formatting for missing required fields and low confidence.
- Delta_<baselineId>_<targetId>
  - Generate only if two datasets are provided and share the same schema.
  - Include change type and per-field comparisons.
- Errors_<datasetId> and Lineage_<datasetId>
  - Always generate when parsing/validation/lineage is enabled.

## 12. QA Checklist (Generic)
- [ ] All Data_* sheets conform to their schema definitions (labels, order, types, formats).
- [ ] Required fields present or captured as errors.
- [ ] Identity and dedupe applied per config; `record_id` uniqueness holds.
- [ ] Delta_* reflects differences consistent with tolerances.
- [ ] Summary metrics match row counts and aggregates.
- [ ] Lineage populated for fields with extractor provenance (target coverage ≥ configured threshold).

## 13. Acceptance Criteria
- Workbook generation is deterministic for the same inputs and config.
- Schemas can be extended or swapped without code changes (config-only).
- Comparisons work for any two datasets of the same schema, not limited to time-based periods.
- Errors and lineage provide enough context for manual QA without re-running extraction.

## 14. Example Scenarios (Non-Exhaustive)
- Period-over-period: Data_2022 vs Data_2023 → Delta_2022_2023.
- Vendor consolidation: Data_VendorA vs Data_VendorB → Delta_VendorA_VendorB.
- Before/After corrections: Data_Run001 vs Data_Run002 → Delta_Run001_Run002.

## 15. Notes on Domains
This standard is domain-agnostic. Provide one or more schema definitions tailored to your domain (e.g., Facilities, Invoices, Inventory). The extractor maps PDF content to the selected schema using header synonyms, regex/type hints, and normalization rules defined here.