# 4. Technical Assumptions

**Repository Structure**: A Monorepo will be used to manage the code for the main application and any related components.

**Service Architecture**: A hybrid architecture will be used. The user-facing application and all financial data processing/workflow execution will run locally as a self-contained desktop application. However, the AI-driven generation of the workflow can leverage cloud-based services.

**Primary Language & Framework**: Python will be the primary language, utilizing libraries like Selenium/BeautifulSoup for web scraping, PyMuPDF for PDF parsing, and openpyxl/equivalent for Excel manipulation. A Python GUI framework like Tkinter or PyQt will be used for the UIs.

**Testing Requirements**: Testing will have two components. First, automated unit tests will be created for all core backend modules (data extraction, Excel manipulation) to ensure their reliability for the demo; this testing can be executed by AI agents. Second, manual end-to-end validation will be performed on the three core demo use cases, which serve as representatives of larger groups of tasks.
