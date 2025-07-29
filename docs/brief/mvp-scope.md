# MVP Scope
**Core Features (Must-Haves for the Demo)**
* **Conversational Workflow Builder:** A simple chat interface where a Junior Analyst can define an automation task in natural language.
* **Web & PDF Data Extraction:** The core ability to navigate to a provided URL, read web page tables, or open a PDF and extract specified tabular data, correctly handling text-based numbers (e.g., '1,234').
* **Excel Manipulation & Generation:** The ability to create, update, and combine Excel files. For the demo, this will feature dynamic, real-time updates to an open spreadsheet to create a seamless and magical user experience.
* **Customizable Tool Generation:** The primary output of a workflow creation process must be a simple, standalone, clickable program. For the demo, this program will feature a simple, semi-dynamic user interface. A small AI model will select the appropriate pre-built controls (e.g., a date range selector for the HK data, a year selector for the Alibaba report) to display based on the specific workflow, demonstrating a path towards full customizability.
* **Primary Demo Use Cases:**
    * **Use Case A (Web to Excel):** Go to the Hong Kong immigration statistics website and generate a customizable tool for extracting data.
    * **Use Case B (PDF to Excel):** Go to the provided Alibaba annual report PDF and generate a customizable tool for extracting financial data.

**Out of Scope for This Demo**
* **Fully Dynamic Customizability Engine:** The AI automatically detecting all possible variables in a workflow and generating a complex UI for them from scratch. The demo will feature a simplified, semi-dynamic "smart template" version of this concept.
* **Conversational Program Modification:** Modifying an already-created tool through further conversation.
* **Generative Web Search:** Finding sources or reports online without being provided a direct URL by the user.
* **Screen Recording / Mimicry:** A feature to record a user's manual actions to generate a workflow.
* **Internal Knowledge Base:** The AI maintaining its own repository of previously gathered information to act like an "intern."
* **Handling Non-English sources** for the initial demo.

**MVP Success Criteria**
* The demo will be considered successful if it can flawlessly execute both **Use Case A** and **Use Case B** live, resulting in a tool that allows for basic, intelligently-selected customization and produces 100% accurate Excel outputs in a dynamic, real-time fashion, generating positive engagement from the audience. A "simple workflow" is defined as a task that involves going to a single website or PDF to extract data, or rearranging local Excel files.
