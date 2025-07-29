# 6. Epic Details

### Epic 1: Core Automation Engine

**Goal:** To build the fundamental, reusable Python components capable of accessing websites and PDFs, extracting tabular data, and writing that data into new or existing Excel files, forming the non-UI backbone of any generated tool.

**Stories:**

**Story 1.1: Web Data Extraction Foundation**

- **As a** developer, **I want** to create a Python module that can navigate to a URL and extract a specified data table from an HTML page, **so that** MAGK can handle web-based data sources.
- **Acceptance Criteria:** 1. The module accepts a URL and a table identifier. 2. The module successfully returns the data from the specified table. 3. The module can handle basic HTML table structures.

**Story 1.2: PDF Data Extraction Foundation**

- **As a** developer, **I want** to create a Python module that can open a text-based PDF and extract a specified data table, **so that** MAGK can handle PDF-based data sources.
- **Acceptance Criteria:** 1. The module accepts a file path or URL to a PDF and a table identifier. 2. The module correctly parses text-based tables. 3. The module correctly recognizes non-standard number formats (commas, accounting negatives, units).

**Story 1.3: Excel Generation and Manipulation**

- **As a** developer, **I want** to create a Python module that can create and write to Excel files, **so that** the extracted data can be saved in the required format.
- **Acceptance Criteria:** 1. The module can create a new Excel workbook. 2. The module can write a list of lists to a sheet. 3. The module can save in both .xlsx and .xls formats. 4. (Nice to have) The module can update an Excel file in real-time.

### Epic 2: Conversational Builder & Tool Generation

**Goal:** To create the user-facing components that allow a junior analyst to define a workflow through conversation and receive a simple, standalone executable tool as the final output.

**Stories:**

**Story 2.1: Basic Chat Interface**

- **As a** Junior Analyst, **I want** a simple chat window to type my request to MAGK, **so that** I can begin creating an automation tool.
- **Acceptance Criteria:** 1. A basic desktop GUI window is created. 2. User can send messages. 3. Conversation is displayed. 4. The AI can ask clarifying questions.

**Story 2.2: Workflow to Script Generation**

- **As a** developer, **I want** to implement logic to translate a natural language request into a Python script using modules from Epic 1, **so that** a functional script can be generated.
- **Acceptance Criteria:** 1. The system can parse a simple workflow description. 2. It generates a Python script that correctly calls modules from Epic 1. 3. The script is saved as a temporary file.

**Story 2.3: Script to Executable Packaging**

- **As a** Junior Analyst, **I want** the final output to be a single, clickable .exe file, **so that** I have a permanent, easy-to-use tool.
- **Acceptance Criteria:** 1. The system packages the script and UI into a single .exe. 2. The user is prompted for a filename. 3. The .exe is saved to a specified location. 4. The tool is self-contained and shareable. 5. (Recommended) An AI-generated 'readme.txt' is created.

**Story 2.4: Semi-Dynamic UI Generation**

- **As a** developer, **I want** the generated executable to have a simple UI with context-aware controls, **so that** the tool is customizable.
- **Acceptance Criteria:** 1. A small AI model analyzes the workflow context. 2. Based on the context, it selects appropriate pre-built UI controls. 3. The selected controls are included in the final packaged UI.

### Epic 3: Demo Showcase & Live Integration

**Goal:** To implement the specific, high-impact demo use cases and the "magical" real-time Excel integration that will be shown to senior management.

**Stories:**

**Story 3.1: Use Case A - Hong Kong Immigration Website**

- **As a** Junior Analyst, **I want** to create a tool for the HK immigration website, **so that** I can automate visitor statistics extraction.
- **Acceptance Criteria:** 1. The system can navigate the HK immigration website. 2. The tool extracts the correct data tables. 3. The tool's UI includes a date range selector. 4. The final Excel output is 100% accurate.

**Story 3.2: Use Case B - Alibaba PDF Report**

- **As a** Junior Analyst, **I want** to create a tool for the Alibaba annual report PDF, **so that** I can automate key financial data extraction.
- **Acceptance Criteria:** 1. The system can parse the Alibaba PDF. 2. The tool extracts the correct financial tables. 3. The tool's UI includes a year selector. 4. The final Excel output is 100% accurate.

**Story 3.3: Use Case C - Excel Supermacro**

- **As a** Junior Analyst, **I want** to create a tool that combines multiple monthly Excel files into one master file, **so that** I can consolidate time-series data quickly.
- **Acceptance Criteria:** 1. The system can process a folder of Excel files. 2. The tool appends data correctly to a master workbook. 3. The tool's UI allows specifying input/output paths. 4. The consolidated data is 100% accurate.

**Story 3.4: Real-Time Excel Update Feature**

- **As a** Senior Analyst (audience member), **I want** to see data appear in an open Excel sheet in real-time, **so that** I can be wowed by the seamless integration.
- **Acceptance Criteria:** 1. The system can detect if a target Excel file is open. 2. The tool writes data row-by-row into the open spreadsheet. 3. Updates are visible without manual refresh.