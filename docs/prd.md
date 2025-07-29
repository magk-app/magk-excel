### **Goals and Background Context**

### **Goals**

- **Business Goal:** To successfully demonstrate MAGK's core value proposition in the August 5th presentation, securing a "go" decision from senior management for continued investment.
- **User Goal (Junior Analyst):** To reduce the time required to complete complex, multi-source data extraction tasks by over 90% and with 100% accuracy, eliminating manual errors.
- **Stakeholder Goal (Senior Analyst):** To enable a novel data workflow to be automated within a single conversational session, operated by a junior analyst, thus increasing team efficiency and data integrity.

### **Background Context**

Equity researchers at firms like China Galaxy Securities International currently expend significant time on manual, error-prone data extraction from websites, PDFs, and Excel. This manual process limits the time available for high-value analysis and introduces the risk of flawed conclusions due to data entry errors.

MAGK addresses this by providing a simple chat interface, deeply integrated with Microsoft Excel, that allows non-technical analysts to describe a repetitive workflow in natural language. MAGK then generates a permanent, reusable, one-click program to execute that task. Unlike general-purpose AI tools that produce one-off code snippets, MAGK creates lasting automation solutions, empowering analysts to build their own ad-hoc tools without any programming knowledge. This demo serves as a proof-of-concept to showcase this transformative potential.

### **Change Log**

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| July 29, 2025 | 1.0 | Initial PRD draft based on Project Brief. | John (PM) |

Export to Sheets

---

### **Requirements**

### **Functional**

1. **FR1:** The system must provide a chat interface for users to define automation workflows using natural language.
2. **FR2:** The system must be able to navigate to a user-provided URL to access web pages.
3. **FR3:** The system must be able to extract data from tables on a web page.
4. **FR4:** The system must be able to open and read PDF documents from a user-provided URL or local path.
5. **FR5:** The system must extract tabular data from PDF documents, correctly interpreting numbers formatted with commas (e.g., '6,157' becomes 6157).
6. **FR6:** The system must be able to create new Excel files.
7. **FR7:** The system must be able to write extracted data into an Excel file.
8. **FR8:** The system must be able to dynamically update an open Excel spreadsheet in real-time to reflect the data being processed.
9. **FR9:** The system's final output for a defined workflow must be a standalone, clickable Windows executable (.exe) program.
10. **FR10:** The generated executable must feature a simple, semi-dynamic user interface with pre-built controls (e.g., date pickers, year selectors) that are intelligently selected by a small AI model based on the workflow's context.
11. **FR11:** The system must successfully execute the "Web to Excel" demo use case: extracting data from the Hong Kong immigration statistics website.
12. **FR12:** The system must successfully execute the "PDF to Excel" demo use case: extracting financial data from the provided Alibaba annual report PDF.

### **Non-Functional**

1. **NFR1:** All data processing must occur locally on the user's machine; no financial or workflow data should be transmitted externally.
2. **NFR2:** The system must be a desktop application for the Windows operating system.
3. **NFR3:** The system must be compatible with Microsoft Excel 2007 (.xls) format in addition to modern formats.
4. **NFR4:** The application UI must remain responsive during workflow execution to ensure a seamless user experience.
5. **NFR5:** The generated automation tool must produce 100% accurate data output for the demonstrated workflows.

---

### **User Interface Design Goals**

- **Overall UX Vision:** The user experience should feel "magical" and effortless. The user should be able to go from a complex idea to a working tool through a simple, intuitive conversation, with the AI handling all complexity. The real-time updates to the user's open Excel file are key to this experience.
- **Key Interaction Paradigms:** The primary interaction will be a standard chat interface. The secondary interaction will be with the generated tool's simple UI, which will use standard controls like date pickers or text inputs.
- **Core Screens and Views:**
    1. **Main Chat Window:** A clean, simple interface for conversing with MAGK.
    2. **Generated Tool UI:** A small, modal window for the executable program, featuring the dynamically selected input controls (e.g., date range) and a "Run" button.
- **Accessibility:** Not a primary focus for the MVP demo, but standard Windows UI controls should be used to ensure basic usability.
- **Branding:** No specific branding is required for the demo. The focus is on functionality and a clean, professional appearance.
- **Target Device and Platforms:** Windows Desktop.

---

### **Technical Assumptions**

- **Repository Structure:** A Monorepo will be used to manage the code for the main application and any related components.
- **Service Architecture:** A local, self-contained application architecture is required. There will be no external client-server or web-based components for the core logic.
- **Primary Language & Framework:** Python will be the primary language, utilizing libraries like Selenium/BeautifulSoup for web scraping, PyMuPDF for PDF parsing, and openpyxl/equivalent for Excel manipulation. A Python GUI framework like Tkinter or PyQt will be used for the UIs.
- **Testing Requirements:** Due to the aggressive timeline, testing will be primarily manual, focused on validating the two core demo use cases. Automated unit tests are out of scope for the initial demo.

---

### **Epic List**

1. **Epic 1: Core Automation Engine:** Establish the foundational Python engine for data extraction from web and PDF sources and manipulation of local Excel files.
2. **Epic 2: Conversational Builder & Tool Generation:** Implement the chat interface for workflow definition and the process for packaging the resulting automation script into a standalone Windows executable with a semi-dynamic UI.
3. **Epic 3: Demo Showcase & Live Integration:** Implement the two specific demo use cases (Hong Kong immigration stats and Alibaba annual report) and the real-time, dynamic updates to an open Excel file.

---

### **Epic 1: Core Automation Engine**

**Goal:** To build the fundamental, reusable Python components capable of accessing websites and PDFs, extracting tabular data, and writing that data into new or existing Excel files, forming the non-UI backbone of any generated tool.

- **Story 1.1: Web Data Extraction Foundation**
    - **As a** developer, **I want** to create a Python module that can navigate to a URL and extract a specified data table from an HTML page, **so that** MAGK can handle web-based data sources.
    - **Acceptance Criteria:**
        1. The module accepts a URL and a table identifier (e.g., table ID, a unique string within the table) as input.
        2. The module successfully returns the data from the specified table as a list of lists.
        3. The module can handle basic HTML table structures.
- **Story 1.2: PDF Data Extraction Foundation**
    - **As a** developer, **I want** to create a Python module that can open a PDF and extract a specified data table, **so that** MAGK can handle PDF-based data sources.
    - **Acceptance Criteria:**
        1. The module accepts a file path or URL to a PDF and a table identifier as input.
        2. The module correctly parses text-based tables from the PDF.
        3. The module correctly converts numbers with commas (e.g., "1,234") into numerical values (1234).
- **Story 1.3: Excel Generation and Manipulation**
    - **As a** developer, **I want** to create a Python module that can create and write to Excel files, **so that** the extracted data can be saved in the required format.
    - **Acceptance Criteria:**
        1. The module can create a new Excel workbook.
        2. The module can write a list of lists to a specified sheet.
        3. The module can save the file in both modern (.xlsx) and legacy (.xls) formats.

### **Epic 2: Conversational Builder & Tool Generation**

**Goal:** To create the user-facing components that allow a junior analyst to define a workflow through conversation and receive a simple, standalone executable tool as the final output.

- **Story 2.1: Basic Chat Interface**
    - **As a** Junior Analyst, **I want** a simple chat window where I can type my request to MAGK, **so that** I can begin the process of creating an automation tool.
    - **Acceptance Criteria:**
        1. A basic desktop GUI window is created with a text input field and a display area for the conversation.
        2. User can type a message and press Enter or click a "Send" button.
        3. The user's message and the AI's response appear in the display area.
- **Story 2.2: Workflow to Script Generation**
    - **As a** developer, **I want** to implement the logic that takes a user's natural language request and translates it into a Python script utilizing the modules from Epic 1, **so that** a functional automation script can be generated from the conversation.
    - **Acceptance Criteria:**
        1. The system can parse a simple workflow description (e.g., "Get the table 'XYZ' from website '[abc.com](http://abc.com/)' and save it to 'output.xlsx'").
        2. The system generates a Python script that correctly calls the web/PDF and Excel modules from Epic 1.
        3. The generated script is saved as a temporary file.
- **Story 2.3: Script to Executable Packaging**
    - **As a** Junior Analyst, **I want** the final output of my conversation to be a single, clickable .exe file, **so that** I have a permanent, easy-to-use tool.
    - **Acceptance Criteria:**
        1. The system uses a tool (e.g., PyInstaller) to package the generated Python script and a UI wrapper into a single .exe file.
        2. The user is prompted to provide a name for the final .exe file.
        3. The .exe is saved to a user-specified location.
- **Story 2.4: Semi-Dynamic UI Generation**
    - **As a** developer, **I want** the generated executable to have a simple UI with context-aware controls, **so that** the tool is customizable by the user.
    - **Acceptance Criteria:**
        1. A small AI model analyzes the workflow context (e.g., keywords like "date," "year," "report period").
        2. Based on the context, the model selects the appropriate pre-built UI controls (e.g., a date range picker).
        3. The selected controls are included in the UI of the final packaged executable.

### **Epic 3: Demo Showcase & Live Integration**

**Goal:** To implement the specific, high-impact demo use cases and the "magical" real-time Excel integration that will be shown to senior management.

- **Story 3.1: Use Case A - Hong Kong Immigration Website**
    - **As a** Junior Analyst, **I want** to create a tool for the HK immigration website, **so that** I can automate the extraction of visitor arrival statistics.
    - **Acceptance Criteria:**
        1. The system can successfully navigate the HK immigration statistics website.
        2. The generated tool correctly extracts the specified data tables.
        3. The generated tool's UI correctly includes a date range selector for the user.
        4. The final Excel output is 100% accurate.
- **Story 3.2: Use Case B - Alibaba PDF Report**
    - **As a** Junior Analyst, **I want** to create a tool for the Alibaba annual report PDF, **so that** I can automate the extraction of key financial data.
    - **Acceptance Criteria:**
        1. The system can successfully open and parse the provided Alibaba PDF.
        2. The tool correctly extracts the specified financial tables.
        3. The generated tool's UI correctly includes a year selector.
        4. The final Excel output is 100% accurate.
- **Story 3.3: Real-Time Excel Update**
    - **As a** Senior Analyst (audience member), **I want** to see the data appear in an open Excel sheet in real-time as the tool runs, **so that** I can be wowed by the "magic" of the seamless integration.
    - **Acceptance Criteria:**
        1. The system can detect if a target Excel file is already open.
        2. As the generated tool extracts data, it writes it row-by-row into the open spreadsheet.
        3. The updates are visible to the user without them needing to manually refresh or reopen the file.