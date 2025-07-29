# 2. Requirements

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
