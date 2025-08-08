# Excel Standardization Spec — Year-over-Year (2022 → 2023)

This document defines the canonical Excel workbook structure, schema, formatting, and data processing rules for producing a 2023 Excel from a new 2023 PDF while using a prior-year (2022) Excel as the schema reference and comparison baseline.

The goal: deterministic, auditable, and user-friendly workbooks that are consistent across years and sources.

## 1. Scope
- Inputs
  - 2022 Excel workbook with a standardized “Data_2022” sheet (or similar).
  - 2023 PDF containing new/updated information.
- Outputs
  - 2023 workbook containing:
    - `Data_2023` (primary dataset in standardized schema)
    - `Delta_2022_2023` (change log between 2022 and 2023)
    - `Summary` (KPIs & counts)
    - `Errors_2023` (parse/validation issues)
    - `Lineage_2023` (provenance mapping to PDF pages/tables)
- Non-goals
  - OCR provider selection and ETL are defined elsewhere; this spec focuses on Excel standardization and year-over-year behavior.

## 2. Canonical Schema (Facilities)
The canonical schema is applied to each record in `Data_2023` and must be identical in `Data_2022` for comparison.

Column order is fixed and stable across years.

1. `Company` (string)
2. `Borrower` (string, optional if same as Company)
3. `Facility Name` (string)
4. `Facility Type` (enum: Revolver | Term Loan | MTN | Bond | Notes | CP | Other)
5. `Currency` (string, ISO 4217; default USD)
6. `Total Commitment (Base)` (number; base currency, e.g., USD)
7. `Total Commitment (Native)` (number; original currency value)
8. `Valuation (Base)` (number)
9. `Valuation (Native)` (number)
10. `Interest Rate (%)` (number; percent)
11. `Base Rate` (string; e.g., SOFR, LIBOR, Prime)
12. `Spread (bps)` (integer)
13. `Issue Date` (date; ISO 8601)
14. `Maturity Date` (date; ISO 8601)
15. `Country` (string; optional enrichment)
16. `Region` (string; optional enrichment)
17. `Source File` (string; filename only)
18. `Source Pages` (string; e.g., "12-13")
19. `Table Id` (string; e.g., "P12_T2")
20. `Record Id` (string; deterministic hash over identity fields; see §6)
21. `Confidence` (number 0..1)

Number formats (Excel):
- Currency (Base): `"$#,##0.00"` (configurable per base currency)
- Currency (Native): `"#,##0.00"` (no symbol)
- Percent: `"0.00%"`
- Dates: `"yyyy-mm-dd"`
- Integers (bps): `"#,##0"`

Data validation (Excel):
- `Facility Type`: list validation with fixed enum values.
- `Currency`: list validation of supported ISO codes (configurable).

## 3. Sheet Layouts and Formatting
### 3.1 Data_2023
- Excel Table: name `tblData_2023`
- Freeze panes: Row 1
- AutoFilter: on header row
- Column widths: auto-calculated by max content length (clamped 10..60)
- Header style: bold, light-gray fill (#DCE6F1), thin border
- Conditional Formatting:
  - Highlight `Confidence < 0.60` (light red fill)
  - Highlight `Maturity Date < Issue Date` (red)
  - Highlight missing mandatory fields (Company, Facility Name, Facility Type, Total Commitment (Base), Issue Date) in yellow

### 3.2 Delta_2022_2023
- Shows changes between 2022 and 2023 by `Record Id` (see §6).
- Columns:
  1. `Record Id`
  2. `Company`
  3. `Facility Name`
  4. `Facility Type`
  5. `Change Type` (enum: New | Removed | Modified | Unchanged)
  6. For each comparable field F in schema, provide triple columns: `F_2022`, `F_2023`, `ΔF` (difference) and for numeric fields also `%ΔF`.
  7. `Source Pages (2022)`
  8. `Source Pages (2023)`
- Conditional Formatting:
  - `Change Type = New` → green fill
  - `Change Type = Removed` → gray fill with strikethrough for 2022 values
  - `Modified` rows: highlight cells where values changed
- Comparison rules:
  - Text fields: case-insensitive, trimmed, Unicode-normalized; Levenshtein distance ≤ 2 treated as equal (configurable) for identity only; otherwise exact for delta.
  - Numbers: compare within tolerance (absolute or relative) from config (default: toleranceAbs=0.005 for rates, 1 bps for spread, 0.1% relative for currency after normalization).
  - Dates: ISO string equality.

### 3.3 Summary
- KPIs:
  - Counts: total records, new, removed, modified, unchanged
  - Totals: sum of `Total Commitment (Base)` for 2022 vs 2023 and Δ
  - Average `Interest Rate (%)` and `Spread (bps)` for both years
  - Confidence histogram buckets
- Charts (optional): stacked bar of change types; donut of facility types; bar of commitments by type.

### 3.4 Errors_2023
- Row-level parse and validation errors/warnings:
  - Columns: `Record Id?`, `Company?`, `Facility Name?`, `Field`, `Value`, `Issue`, `Page`, `Table Id`, `Severity` (Error|Warning), `Confidence`, `Suggestion`
  - Include raw cell text and the mapping rule used (header→field) to aid triage

### 3.5 Lineage_2023
- Provenance table linking each `Record Id` and field to PDF artifacts:
  - Columns: `Record Id`, `Field`, `Value`, `Page`, `Table Id`, `Cell Coordinates` (x,y,w,h), `OCR/Vector`, `Extraction Confidence`, `Parser Rule`

## 4. Year-over-Year Process (2022 → 2023)
1. Load 2022 Excel (`Data_2022`) and validate it conforms to the canonical schema (column names, order, and formats).
2. Extract 2023 from PDF (vector/OCR) → raw tables + free-text → normalize → map to canonical schema → yield `records_2023` with provenance and confidence per field.
3. Normalize 2023 records:
   - Unicode normalization (NFKC), whitespace collapse
   - Currency normalization to base (USD by default) using conversion date = `Issue Date` or report date; preserve native values/currency
   - Numeric normalization (remove commas, parentheses→negative, units K/M/B)
   - Date parsing to ISO 8601
   - Header mapping via synonyms and heuristics (see §5)
4. Identity matching against 2022 to compute `Record Id` (see §6).
5. Build `Data_2023` from normalized 2023 records (ensure column order & formatting rules).
6. Generate `Delta_2022_2023` by aligning on `Record Id`:
   - `New`: appears in 2023 only
   - `Removed`: appears in 2022 only
   - `Modified`: appears in both but any comparable field differs beyond tolerance
   - `Unchanged`: appears in both and all comparable fields match within tolerance
7. Populate `Summary`, `Errors_2023`, `Lineage_2023`.
8. Save workbook with filename pattern: `{CompanyOrSource}_Facilities_2023.xlsx` or generic `Facilities_2023.xlsx` if multi-company.

## 5. Header Mapping & Field Parsing
### 5.1 Header Synonyms (examples)
- `Total Commitment` synonyms: `Facility Size`, `Total Commitments`, `Commitment`, `Facility Amount`
- `Interest Rate (%)` synonyms: `Interest`, `Rate`, `Coupon`, `APR`
- `Spread (bps)` synonyms: `Spread`, `Margin`, `OAS (bps)` (context dependent)
- `Base Rate`: `Benchmark`, `Index`, `Reference Rate` (SOFR/LIBOR/Prime)
- `Valuation`: `Valuation`, `Fair Value` (ensure unit mapping)

Mapping rules:
- Case-insensitive exact match > synonym match > fuzzy match (Levenshtein ≤ 2) with type hint.
- Column type inference by regex on sample values to disambiguate (percent, currency, date, integer bps).

### 5.2 Regex Extractors (examples)
- Currency Value: `(?P<sign>\()?[$£€¥]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)(?P<unit>[kKmMbB]?)\)?`
- Percent: `(?P<pct>\d+(?:\.\d+)?)\s*%`
- Basis Points: `(?P<bps>\d{1,4})\s*(?:bps|basis\s*points)`
- Dates: `\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b`

### 5.3 Units & Currency Handling
- Parentheses denote negative; strip and multiply by -1
- Suffix multipliers: `k=1e3, m/M=1e6, b/B=1e9`
- Base currency: USD (configurable); convert native→base at `Issue Date` or file date (configurable)
- If FX rate unavailable, leave base as null and log warning in `Errors_2023`

## 6. Identity & Deduplication
### 6.1 Record Identity Key
Default identity tuple (configurable): `(Company, Facility Name, Facility Type, Issue Date)`
- Normalization before hashing:
  - Trim, case-fold
  - Unicode NFKC
  - Replace em/en dashes with hyphen
  - Collapse whitespace
  - Remove punctuation except alphanumerics and spaces
- `Record Id = SHA-256( join('|', normalized_tuple) )`

### 6.2 Matching & Tolerances
- Fuzzy name normalization for `Facility Name` to increase match rate (e.g., "Term Loan — A" → "Term Loan A")
- Numeric tolerances for equality (default):
  - Percent fields: abs diff ≤ 0.005 (0.5 bps)
  - Spread (bps): abs diff ≤ 1
  - Currency values: relative diff ≤ 0.1% or abs ≤ 1 (whichever larger)

### 6.3 Deduplication Strategy
Configurable modes:
- `first_wins`: keep first occurrence by `Record Id`
- `override`: keep latest (2023) and replace 2022
- `merge`: merge fields when one side has null and the other has value; prefer higher-confidence values
- `flag`: output all duplicates; set `dup_flag = TRUE` and record in `Errors_2023`

## 7. Computed Fields (optional)
- `spread_bps = (Interest Rate (%) – base_rate_percent) × 10000`
- `yoy_growth_pct_commitment = (Commitment_2023 – Commitment_2022) / Commitment_2022`
- `days_to_maturity = Maturity Date – Issue Date`
- Include on `Delta_2022_2023` when applicable; on `Data_2023` only if configured.

## 8. Validation Rules
- Mandatory fields: Company, Facility Name, Facility Type, Total Commitment (Base), Issue Date
- Date sanity: Maturity Date ≥ Issue Date; Year falls within accepted range (2000..2100)
- Numeric sanity: 0 ≤ Interest Rate ≤ 100; 0 ≤ Spread ≤ 3000; Commitment ≥ 0
- Currency code must be a known ISO 4217 or configured override
- Confidence threshold warnings: any field confidence < 0.6 produces a warning row in `Errors_2023`

## 9. Lineage & Auditability
- Each field in `Data_2023` must have provenance references stored in `Lineage_2023`:
  - `Record Id`, `Field`, `Value`, `Page`, `Table Id`, `Cell Coordinates`, `Extraction Method` (Vector|OCR), `Extraction Confidence`, `Mapping Rule`
- `Summary` shows counts of lineage completeness and min/avg/max confidences.

## 10. File & Sheet Naming
- Workbook filename: `Facilities_2023.xlsx` (or `{Org}_Facilities_2023.xlsx` if single-org)
- Sheets: `Data_2023`, `Delta_2022_2023`, `Summary`, `Errors_2023`, `Lineage_2023`
- Excel table names: `tblData_2023`, `tblDelta_2022_2023`, `tblErrors_2023`, `tblLineage_2023`

## 11. Configuration (YAML/JSON)
Example (YAML):
```yaml
base_currency: USD
identity_fields: [Company, Facility Name, Facility Type, Issue Date]
comparison_tolerance:
  percent_abs: 0.005
  spread_bps_abs: 1
  currency_relative: 0.001
currency:
  convert: true
  fx_source: 'ECB'   # or 'OANDA', 'None'
  fallback_on_missing: false
schema:
  facility_type_enum: [Revolver, Term Loan, MTN, Bond, Notes, CP, Other]
header_synonyms:
  Total Commitment (Base): [Total Commitment, Facility Size, Total Commitments, Commitment]
  Interest Rate (%): [Interest, Rate, Coupon, APR]
  Spread (bps): [Spread, Margin, OAS (bps)]
  Base Rate: [Benchmark, Index, Reference Rate]
workbook:
  enable_charts: true
  include_computed_fields: false
  conditional_formatting:
    low_confidence_threshold: 0.6
    highlight_removed: true
    highlight_modified: true
```

## 12. Example Delta Calculation
Given:
- 2022: `Total Commitment (Base) = 1,000,000.00`, `Interest Rate (%) = 5.25%`
- 2023: `Total Commitment (Base) = 1,200,000.00`, `Interest Rate (%) = 5.50%`

Delta row shows:
- `Change Type = Modified`
- `Total Commitment (Base)_2022 = 1,000,000.00`
- `Total Commitment (Base)_2023 = 1,200,000.00`
- `ΔTotal Commitment (Base) = 200,000.00`
- `%ΔTotal Commitment (Base) = 20.00%`
- `Interest Rate (%)_2022 = 5.25%`
- `Interest Rate (%)_2023 = 5.50%`
- `ΔInterest Rate (%) = 0.25%`

## 13. Error Recording Examples (Errors_2023)
- Missing `Issue Date` → Severity: Error; Suggestion: Check header mapping; Page/Table references attached.
- Unrecognized currency `US$` → Severity: Warning; Suggestion: Map to `USD`.
- Low confidence field (0.42) for `Spread (bps)` → Severity: Warning; Suggestion: Manually verify.

## 14. QA Checklist
- [ ] Column names, order, formats match canonical schema
- [ ] `Data_2023` row count equals number of unique `Record Id`
- [ ] `Delta_2022_2023` totals add up: New + Removed + Modified + Unchanged = union size
- [ ] All mandatory fields populated or logged in `Errors_2023`
- [ ] Conditional formatting visible for modified/new/removed rows
- [ ] Provenance populated for ≥ 95% of fields

## 15. Acceptance Criteria
- Workbooks are reproducible with same inputs and config.
- `Data_2023` conforms to schema and styles; `Delta_2022_2023` accurately reflects changes with tolerances.
- Errors and lineage provide sufficient detail for manual QA without revisiting code.

## 16. Implementation Hooks
- Exporter uses `exceljs` to:
  - Create sheets and tables with styles, validation, and filters
  - Apply conditional formatting (where supported; otherwise emulate with rules)
  - Auto-fit columns by content length (capped 60)
- Schema enforcement via centralized column definition with type, format, and validation metadata.
- Delta calculator module consumes two arrays of normalized records and emits change rows per spec.

## 17. Worked Example (2022 → 2023)
1. Load `Facilities_2022.xlsx` → read `Data_2022` into memory.
2. Process `2023.pdf` → normalize to records_2023 with base/native values.
3. Compute `Record Id` for each 2023 record using identity tuple.
4. Emit `Data_2023` with formatted columns and validation.
5. Align with 2022 by `Record Id` and compute deltas with tolerances; create `Delta_2022_2023`.
6. Generate `Summary`, `Errors_2023`, and `Lineage_2023`.
7. Save `Facilities_2023.xlsx`.

--

This standard guarantees that year-over-year workbooks remain stable, comparable, and auditable, while giving analysts confidence in both the raw values and the provenance of every field.