## 1. Goals and Background Context

**Goals**

- **Business Goal:** To successfully demonstrate MAGK's core value proposition in the August 5th presentation, securing a "go" decision from senior management for continued investment.
- **User Goal (Junior Analyst):** To achieve 100% data accuracy on complex, multi-source data extraction tasks, completely eliminating manual errors while still significantly reducing the time required compared to the manual process.
- **Stakeholder Goal (Senior Analyst):** To enable a novel data workflow to be automated within a single conversational session, operated by a junior analyst, thus increasing team efficiency and data integrity.

**Background Context**
Equity researchers at firms like China Galaxy Securities International currently expend significant time on manual, error-prone data extraction from websites, PDFs, and Excel. This manual process limits the time available for high-value analysis and introduces the risk of flawed conclusions due to data entry errors. MAGK addresses this by providing a simple chat interface, deeply integrated with Microsoft Excel, that allows non-technical analysts to describe a repetitive workflow in natural language. MAGK then generates a permanent, reusable, one-click program to execute that task. Unlike general-purpose AI tools that produce one-off code snippets, MAGK creates lasting automation solutions, empowering analysts to build their own ad-hoc tools without any programming knowledge. This demo serves as a proof-of-concept to showcase this transformative potential.

**Change Log**

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| July 28, 2025 | 1.0 | Initial PRD draft based on Project Brief and interactive review. | John (PM) |

## 2. Requirements

**Functional**

- **FR1:** The system must provide a chat interface for users to define automation workflows using natural language. If the system is confused by a request or needs more information, it must ask the user clarifying questions to confirm assumptions before proceeding. Recommended: The interface should be integrated with the desktop, appearing on the same screen as Excel, not in a separate web browser.
- **FR2:** The system must be able to navigate to a user-provided URL to access web pages, and the system must be able to perform user actions on the website (e.g., clicking links, downloading files) to find necessary data.
- **FR3:** The system must be able to recognize and extract data from tables and text content on a web page and from **text-based** PDF documents.
- **FR4:** The system must be able to handle both text-based and non-text-based (i.e., image-based) PDF files from a user-provided URL or local path. **For non-text-based PDFs, the system is only required to access basic file information (like the filename) and report that it cannot extract data, not perform OCR.**
- **FR5:** The system must extract tabular data from **text-based** PDF documents, correctly interpreting various number formats (e.g., `(200)` for negative, commas in numbers) and the context of units (e.g., "in millions").
- **FR6:** The system must be able to create new Excel files (lower priority).
- **FR7:** The system must be able to write extracted data into an Excel file.
- **FR8:** The system must be able to dynamically update an open Excel spreadsheet in real-time to reflect the data being processed.
- **FR9:** The system's final output for a defined workflow must be runnable within the main system's interface OR as a simple standalone executable.
- **FR10:** The generated tool must feature a simple, semi-dynamic UI with context-aware controls (e.g., choosing a file, formatting sheet names, date pickers) that are intelligently selected by a small AI model.
- **FR11:** The system must successfully execute the "Web to Excel" demo use case: extracting data from the Hong Kong immigration statistics website.
- **FR12:** The system must successfully execute the "PDF to Excel" demo use case: extracting financial data from the provided Alibaba annual report PDF.
- **FR13:** The system must successfully execute the “Excel supermacro” demo use case: combining and updating a master Excel database from multiple individual Excel files.

**Non-Functional**

- **NFR1:** All financial data processing must occur locally on the user's machine. However, the AI-driven workflow building process can rely on cloud services (e.g., AWS Bedrock).
- **NFR2:** The system must be a desktop application for the Windows operating system.
- **NFR3:** The system must be compatible with Microsoft Excel 2007 (.xls) format in addition to modern formats.
- **NFR4:** The application UI must remain responsive during workflow execution.
- **NFR5:** The generated automation tool must produce 99.9999% accurate data output for the demonstrated workflows.
- **NFR6:** The generated automation tools must be able to run in the background, allowing the user to continue working on other tasks in foreground windows.

## 3. User Interface Design Goals

**Overall UX Vision**: The user experience should feel "magical" and effortless. The user should be able to go from a complex idea to a working tool through a simple, intuitive conversation, with the AI handling all complexity. The real-time updates to the user's open Excel file are key to this experience.

**Key Interaction Paradigms**: The primary interaction will be a standard chat interface. The secondary interaction will be with the generated tool's simple UI, which will use standard controls like date pickers or text inputs.

**Core Screens and Views**:

- Main Chat Window: A clean, simple interface for conversing with MAGK.
- Generated Tool UI: A small, modal window for the executable program, featuring the dynamically selected input controls (e.g., date range) and a "Run" button.

**Accessibility**: Not a primary focus for the MVP demo, but standard Windows UI controls should be used to ensure basic usability.

**Branding**: No specific branding is required for the demo. The focus is on functionality and a clean, professional appearance.

**Target Device and Platforms**: Windows Desktop.

## 4. Technical Assumptions

**Repository Structure**: A Monorepo will be used to manage the code for the main application and any related components.

**Service Architecture**: A hybrid architecture will be used. The user-facing application and all financial data processing/workflow execution will run locally as a self-contained desktop application. However, the AI-driven generation of the workflow can leverage cloud-based services.

**Primary Language & Framework**: Python will be the primary language, utilizing libraries like Selenium/BeautifulSoup for web scraping, PyMuPDF for PDF parsing, and openpyxl/equivalent for Excel manipulation. A Python GUI framework like Tkinter or PyQt will be used for the UIs.

**Testing Requirements**: Testing will have two components. First, automated unit tests will be created for all core backend modules (data extraction, Excel manipulation) to ensure their reliability for the demo; this testing can be executed by AI agents. Second, manual end-to-end validation will be performed on the three core demo use cases, which serve as representatives of larger groups of tasks.

## 5. Epic List

- **Epic 1: Core Automation Engine:** Establish the foundational Python engine for data extraction from web and PDF sources and manipulation of local Excel files.
- **Epic 2: Conversational Builder & Tool Generation:** Implement the chat interface for workflow definition and the process for packaging the resulting automation script into a standalone Windows executable with a semi-dynamic UI.
- **Epic 3: Demo Showcase & Live Integration:** Implement the three specific demo use cases (Hong Kong immigration, Alibaba PDF, and Excel supermacro) and the real-time, dynamic updates to an open Excel file.

## 6. Epic Details

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

**Story 2.5: Interaction with the AI to create my ideal tool** (ref)

- As an analyst, I want to be able to have a variety of control on the tool I make.
- Acceptance Criteria: 1. The AI is able to interact and ask questions if it has difficulty understanding the user’s vision for creating a workflow automation tool. 2. The user can choose how much tinkering it wants to do with the tool. If they leave the tool very general, edge cases/confusion may be flagged to the user. 3. (optional for demo as it is difficult) the user should be able to see a demo of the tool as it is being created, to make sure it is obtaining the right data/doing the right tasks.
- For example, if the program is collecting annual report data, and the program realises that some data was restated, the user should recieve a popup from the program asking for advice (should we take original, or restated data?)

### Epic 3: Demo Showcase & Live Integration

**Goal:** To implement the specific, high-impact demo use cases and the "magical" real-time Excel integration that will be shown to senior management.

**Stories:**

**Story 3.1: Use Case A - Hong Kong Immigration Website**

- **As a** Junior Analyst, **I want** to create a tool for the HK immigration website, **so that** I can automate visitor statistics extraction.
- **Acceptance Criteria:** 1. The system can navigate the HK immigration website. 2. The tool extracts the correct data tables. 3. The tool's UI includes a date range selector. 4. The final Excel output is 100% accurate.

**Story 3.2: Use Case B - Alibaba PDF Report**

- **As a** Junior Analyst, **I want** to create a tool for the Alibaba annual report PDF, **so that** I can automate key financial data extraction.
- **Acceptance Criteria:** 1. The system can parse the Alibaba PDF. 2. The tool extracts the correct financial tables. 3. The tool's UI includes a year selector. 4. The final Excel output is 100% accurate.

**Story 3.3: Use Case C - Excel Supermacro < - THIS IS NO LONGER AS IMPORTANT**

- **As a** Junior Analyst, **I want** to create a tool that combines multiple monthly Excel files into one master file, **so that** I can consolidate time-series data quickly.
- **Acceptance Criteria:** 1. The system can process a folder of Excel files. 2. The tool appends data correctly to a master workbook. 3. The tool's UI allows specifying input/output paths. 4. The consolidated data is 100% accurate.

**Story 3.4: Real-Time Excel Update Feature**

- **As a** Senior Analyst (audience member), **I want** to see data appear in an open Excel sheet in real-time, **so that** I can be wowed by the seamless integration.
- **Acceptance Criteria:** 1. The system can detect if a target Excel file is open. 2. The tool writes data row-by-row into the open spreadsheet. 3. Updates are visible without manual refresh.

**Story 3.5: Standardisation**

- **As an analyst, I want my generalized tool to get data from different companies annual reports to have options to standardize the excel output, so that I can easily compare data across companies**
    - Different companies report data in slightly different ways, eg. Operating profit may be called EBIT, Cost of goods sold might be called Cost of sales, there may not be any inventories etc.
- **Acceptance Criteria: If the user desires, programs are able to standardize differing reports data, so that the same metrics (eg. total assets, net cash from investing etc.) are easy to access and in the same place**

**Story 3.6: Reusability**

- **As an analsyt, I want an easy repository to access all the tools I made, so with my zero tech knowledge, I can easily open them in Excel and share them with other analysts**
- **Acceptance Criteria: 1. An in-app repository of tools with easy ability to re-edit for further tinkering, sharing/exporting, and execution, 2. and/(or?) an Excel tab giving access to previously-crated tools, located in the same place Excel tabs like ‘Data’ and ‘File’ are (forget what that is called)**

**Story 3.8: Simple Excel menu (Optional) NOT PRIORITY**

- **As an analyst, I want the menu to open be very smooth in Excel.**
- **Acceptance Criteria: 1. For the demo, I do not want anything fancy, but if possible make it so I can open directly in excel, with a tab and buttons like the ones shown here.**