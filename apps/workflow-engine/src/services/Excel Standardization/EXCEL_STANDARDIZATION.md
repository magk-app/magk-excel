# Excel Standardization Spec — Domain-Agnostic (Any PDF → Standardized Excel)

This specification defines a generic, configuration-driven standard for transforming arbitrary PDFs into consistent, auditable Excel workbooks. It applies to any domain (finance, legal, scientific, logistics, etc.) and supports single-dataset exports and comparisons between two datasets (e.g., baseline vs target). Domain-specific concepts (e.g., 
"interest rate", "facility type") are not part of the normative core; they belong in domain profiles as examples or extensions.

## 0. Design Principles
- Config-first: All schema, mapping, validation, identity, tolerances, and formatting are defined in configuration (no hard-coded business terms).
- Deterministic: Same inputs + same config → identical workbook outputs.
- Auditable: Every cell’s origin and transformation are traceable.
- Extensible: New domains are added by authoring a schema profile; the core remains unchanged.

## 1. Workbook Structure (Generic)
The generator MAY produce these sheets; names are configurable.

- Data_<datasetId>
  - Standardized records for a dataset (e.g., Data_Run001, Data_Q3_2024, Data_SourceA).
- Delta_<baselineId>_<targetId> (optional)
  - Differences between any two datasets that share the same schema.
- Summary
  - High-level counts, completeness, and optional aggregates.
- Errors_<datasetId>
  - Parse/validation/normalization issues with suggested actions.
- Lineage_<datasetId>
  - Provenance linking standardized cells to source PDF artifacts and rules.

Notes:
- Multiple Data_* sheets MAY exist in one workbook.
- <datasetId>, <baselineId>, <targetId> are caller-defined identifiers.

## 2. Schema Definition Model (Normative)
Schemas define the columns (attributes) for a dataset. A schema is a config document with:

- metadata:
  - name (string), version (integer)
- columns: an ordered array of column definitions; each column has:
  - key (string; unique, machine-readable)
  - label (string; Excel header text)
  - type (enum): string | integer | number | boolean | percent | date | datetime | enum | json | reference
  - required (boolean; default false)
  - format (string; Excel number/date format, optional)
  - enumValues (string[], required if type=enum)
  - validation (object, optional):
    - min/max (for numeric), regex (for string), list (for constrained values), custom (named rule identifiers)
  - synonyms (string[], optional): alternate header texts to assist column mapping
  - derive (object, optional): formula expression or named function; MAY reference other columns
  - description (string, optional)

Example (generic):
```yaml
schema:
  name: GenericRecords
  version: 1
  columns:
    - key: entity
      label: Entity
      type: string
      required: true
    - key: attribute
      label: Attribute
      type: string
      required: true
    - key: value_numeric
      label: Value (Numeric)
      type: number
      format: "#,##0.00"
    - key: value_text
      label: Value (Text)
      type: string
    - key: timestamp
      label: Timestamp
      type: datetime
      format: "yyyy-mm-dd hh:mm:ss"
    - key: category
      label: Category
      type: enum
      enumValues: [A, B, C, Other]
    - key: confidence
      label: Confidence
      type: number
      validation: { min: 0, max: 1 }
```

## 3. Mapping & Normalization (Normative)
### 3.1 Header Mapping
- The system maps source table headers to schema columns using this order of precedence:
  1) exact (case-insensitive) match to `label` or `key`
  2) match to `synonyms`
  3) fuzzy match (Levenshtein distance ≤ configured threshold)
  4) type-informed match (based on value patterns)
- Unmapped columns MAY be ignored or appended to a catch-all JSON column (if defined).

### 3.2 Value Parsing (Generic)
- String: trim, Unicode NFKC normalization, whitespace collapse, dash unification; apply optional regex validations.
- Integer/Number: remove grouping separators; parse signs; support unit suffix normalization (e.g., k/m/b → multipliers) if enabled via config.
- Percent: accept values with % sign or ratio; normalize to [0..1] or [0..100] per schema format.
- Date/Datetime: parse ISO formats by default; extend with locale-specific formats via config.
- Enum: case-insensitive mapping to configured `enumValues`; unknown values logged as errors or coerced to "Other" per config.
- Boolean: accept true/false, yes/no, 1/0 variants.

### 3.3 Units (Optional)
- Unit suffix mapping is configurable:
```yaml
units:
  enabled: true
  suffix_multipliers: { k: 1e3, K: 1e3, m: 1e6, M: 1e6, b: 1e9, B: 1e9 }
```

## 4. Identity & Deduplication (Normative)
- Identity key: ordered list of schema keys used to generate `record_id`.
- Normalization for identity (applied to contributing fields):
  - case-fold, trim, collapse whitespace, remove punctuation (configurable), normalize Unicode, unify dashes.
- `record_id` generation: deterministic hash (e.g., SHA-256 of the concatenated normalized values).
- Deduplication strategies (configurable):
  - first_wins | override (prefer later dataset) | merge (fill nulls; prefer higher confidence) | flag (retain all, mark duplicates)

## 5. Delta Computation (Normative)
- Applicable when two Data sheets share the same schema.
- Row alignment: by `record_id`.
- Change types: New | Removed | Modified | Unchanged.
- Field comparison rules:
  - String/Enum/Boolean: normalized equality (case-insensitive by default).
  - Date/Datetime: ISO/equivalent normalized equality.
  - Numeric/Percent: equal if within per-column tolerance.
- Tolerances (configurable, per column or default):
```yaml
tolerance:
  default:
    numeric_absolute: 0.0
    numeric_relative: 0.0   # fraction, e.g., 0.001 for 0.1%
  overrides:
    value_numeric: { numeric_relative: 0.001 }
    confidence: { numeric_absolute: 0.01 }
```
- Delta sheet columns (for each comparable field F): `F_baseline`, `F_target`, `ΔF` (numeric diff when applicable), `%ΔF` (optional). Include `record_id`, summarized `Change Type`, and optional source references.

## 6. Errors & Lineage (Normative)
### 6.1 Errors_<datasetId>
- Columns (minimum): `record_id?`, `field`, `value`, `issue`, `severity` (Error|Warning), `hint`, `page?`, `table_id?`, `confidence?`.
- Issues include mapping failures, parse errors, validation violations, and missing required fields.

### 6.2 Lineage_<datasetId>
- Columns (minimum): `record_id`, `field`, `standardized_value`, `source_value`, `page`, `table_id`, `cell_coordinates (x,y,w,h)?`, `extraction_method (Vector|OCR)`, `extraction_confidence?`, `rule` (mapping/regex/function).
- Purpose: traceability; supports audits and manual QA.

## 7. Summary (Normative)
- Required metrics:
  - Total rows, required-field completeness, duplicates (pre/post dedupe), error/warning counts.
- Optional metrics (configurable):
  - Distributions (e.g., by `category`), aggregates (e.g., sum over numeric columns), confidence histogram.
- If Delta present: counts of change types and aggregates of numeric deltas for selected fields.

## 8. Sheet Presentation Rules (Normative)
- Header style: bold, light-gray fill (#DCE6F1), thin border.
- Freeze panes: row 1 on Data_* and Delta_*.
- AutoFilter: header row enabled on Data_* and Delta_*.
- Column widths: auto-sized by content length, clamped to [10..60].
- Data validation:
  - Enforce enum lists; constrain dates when configured (min/max).
- Conditional formatting (configurable):
  - Missing required fields → yellow background.
  - Low confidence (below threshold) → light red background.
  - Delta: highlight modified fields; style New/Removed rows distinctly.

## 9. Configuration Surfaces (Normative)
A single configuration document SHOULD control generation:
```yaml
workbook:
  data_sheet_prefix: Data
  errors_sheet_prefix: Errors
  lineage_sheet_prefix: Lineage
  summary_sheet_name: Summary
  delta_sheet_prefix: Delta
  confidence_threshold: 0.6
  charts_enabled: false

datasets:
  baseline_id: null   # optional
  target_id: Run001   # required for Data_Target sheet

schemaRef: GenericRecords   # name/version to fetch from schema registry

identity:
  keys: [entity, attribute]  # example; use schema keys
  normalization:
    case_fold: true
    trim: true
    remove_punctuation: true
    unify_dashes: true

mapping:
  fuzzy_distance: 2
  prefer_type_hints: true

units:
  enabled: true
  suffix_multipliers: { k: 1e3, m: 1e6, b: 1e9 }

tolerance:
  default:
    numeric_absolute: 0.0
    numeric_relative: 0.0
  overrides: {}

dedup:
  strategy: merge  # first_wins | override | merge | flag

computed:
  enable: false
  fields: []       # expressions over standardized columns; optional
```

## 10. Non-Normative Examples (Optional Guidance)
- Finance: A domain profile may introduce domain-specific columns (e.g., amounts, percentages), units, and synonyms. Tolerances for numeric comparison MAY be specified per-column.
- Scientific: A profile may define units (SI prefixes), measurement timestamps, and quality scores.
- Legal: A profile may define parties, clause identifiers, effective dates, and jurisdiction enums.

These examples illustrate how to use the core standard via configuration; they are not part of the normative core.

## 11. QA & Acceptance (Normative)
- QA Checklist:
  - [ ] Data_* sheets conform to the selected schema (labels, order, types, formats).
  - [ ] Required fields present or captured in Errors_*.
  - [ ] Identity and dedupe configured and enforced; `record_id` uniqueness holds.
  - [ ] Delta_* (if present) reflects differences consistent with tolerances.
  - [ ] Lineage completeness meets configured target.
  - [ ] Summary metrics match row counts and aggregates.
- Acceptance Criteria:
  - Deterministic outputs with given inputs/config.
  - No domain-specific assumptions in the core spec; domain behaviors are driven entirely by configuration.

## 12. Implementation Hooks (Informative)
- Use a centralized schema registry (files or code) to load schema definitions.
- Excel generation via a library (e.g., exceljs) that supports styles, data validation, and filters.
- Normalization and mapping as modular functions parameterized by config.
- Delta computation as a pure function over two standardized datasets with per-column comparison rules.
- Provenance captured during extraction and mapping; emitted into Lineage_*.