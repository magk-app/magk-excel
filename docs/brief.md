# Project Brief: MAGK Demo

## Executive Summary
This project's objective is to develop a high-impact, proof-of-concept demo of "MAGK," an AI tool designed to provide financial analysts with easy access to create their own ad-hoc automation tools. MAGK addresses the core problem that senior equity researchers spend excessive time on manual, repetitive data extraction and processing from websites, PDFs, and Excel. Targeting experienced, non-technical analysts, MAGK's key value proposition is its ability to transform complex, multi-step workflows into simple, one-click, reusable programs through simple, natural language conversation, saving significant time and reducing errors. Unlike general-purpose AIs, MAGK creates permanent, customizable automation tools accessible to users with zero programming knowledge.

## Problem Statement
* **Current State & Pain Points:** Equity researchers at firms like China Galaxy Securities International spend a significant portion of their day on low-value, manual tasks. This includes navigating various websites to find specific financial reports, manually downloading PDFs and Excel files, and meticulously copy-pasting data into their own spreadsheets. This process is not only time-consuming but also highly prone to human error (e.g., numbers in text-based PDFs being copied incorrectly as '6, 157' instead of '6157').
* **Impact of the Problem:** The high volume of manual work directly reduces the time available for core, high-value activities such as analysis, modeling, and generating insights. The risk of data errors compromises the integrity of research and can lead to flawed conclusions, creating significant reputational and financial risk.
* **Why Existing Solutions Fall Short:** Existing solutions like Perplexity or ChatGPT fall short because successfully "vibe coding" a complex workflow requires a significant level of technical intuition, akin to intermediate programming knowledge. Senior analysts, the target users, do not possess this specialized prompt engineering skill. Furthermore, these tools generate one-off solutions, not the permanent, reusable, and simple one-click programs needed for recurring tasks. They also lack the deep, contextual integration with Excel (e.g., acting on highlighted cells, automating cross-file tasks) that is essential for financial workflows.
* **Urgency & Importance:** With a presentation to senior management scheduled for August 5th (China Time), there is a brief, high-stakes window to demonstrate a forward-thinking AI solution. Effectively showcasing a tool that solves these long-standing inefficiencies can secure buy-in and position the firm as an innovator in applying AI to its core business.

## Proposed Solution
* **Core Concept & Approach:** MAGK will be an AI assistant delivered through a simple chat interface, seamlessly integrated with Microsoft Excel. Users will describe a repetitive workflow in natural language (e.g., "Go to this website, find the quarterly reports, and extract the 'Distribution Channel' table into this spreadsheet"). MAGK will ask clarifying questions and then automatically generate a simple, standalone, one-click executable program that performs this task.
* **Key Differentiators:**
    * **Tool Generation, Not Code Generation:** Unlike ChatGPT, MAGK's primary output is not a block of Python code for the user to run, but a user-friendly, permanent tool (e.g., a clickable icon named "Update LIA Data").
    * **Zero-CS-Knowledge-Required:** The entire process, from request to tool creation, is handled through a simple conversation, removing the need for any "vibe coding" or technical skills.
    * **Deep Excel Integration:** MAGK will be able to interact directly with Excel, including acting on highlighted cells, performing calculations, and managing data across different files and sheets.
* **High-Level Vision:** The long-term vision is for MAGK to become an indispensable "AI intern" for every analyst, capable of learning and automating any routine data-related task, dramatically increasing the research team's efficiency and data accuracy.

## Target Users
**Primary User Segment: The Junior Analyst / Intern**
* **Profile:** A junior employee who is generally tech-savvy but possesses no formal programming or specialized "vibe coding" skills. They are eager to be efficient and impress their superiors.
* **Current Behaviors & Workflows:** They are delegated the highly manual, repetitive data gathering and processing workflows by Senior Analysts. Their daily work consists of executing these tedious tasks, such as navigating websites, manually extracting data from PDFs, and consolidating spreadsheets.
* **Specific Needs & Pain Points:**
    * **Need:** To quickly and accurately complete tasks delegated to them.
    * **Need:** An easy way to automate a workflow described by a senior, without requiring technical assistance.
    * **Pain Point:** The high pressure to produce error-free work is undermined by the error-prone nature of manual data entry.
* **Goals:** To efficiently execute delegated tasks, reduce manual errors, and free up their time to learn more about high-value financial analysis.

**Secondary User Segment: The Senior Equity Research Analyst**
* **Profile:** An experienced, high-value professional with deep domain expertise but low personal programming skill.
* **Role & Goals:** As the key stakeholder, their goal is to leverage their team more effectively. They identify the workflows that need automation and delegate the task of using MAGK to their junior staff, ultimately benefiting from the increased speed and data integrity of their team's output.

## Goals & Success Metrics
**Business Objectives**
* Successfully demonstrate MAGK's core value proposition in the August 5th presentation, resulting in a "go" decision from senior management for continued investment and development.

**User Success Metrics**
* **For the Junior Analyst (User):** Reduce the time to complete a complex, multi-source data extraction task by over 90% compared to the manual process.
* **For the Junior Analyst (User):** Achieve 100% data accuracy for the demonstrated workflow, completely eliminating manual copy-paste errors.
* **For the Senior Analyst (Beneficiary):** Enable a novel data workflow to be automated within a single conversational session, operated by a junior analyst.

**Key Performance Indicators (KPIs) for the Demo**
* **Demo Success Rate:** 100% successful, error-free execution of the primary demo use case during the live presentation.
* **Demo Efficiency & Accuracy:** The process must produce a 100% accurate and correct final output. While there is no strict time limit, the automated workflow should be completed in a timeframe that is clearly and impressively faster than the equivalent manual process.
* **Audience Engagement:** Generate at least 3-5 questions from the senior analyst audience that are focused on future applications, features, or expansion of the tool.

## MVP Scope
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

## Post-MVP Vision
**Phase 2 Features (Immediate Next Steps)**
* **Fully Dynamic Customizability Engine:** Transition from the demo's "smart template" to a fully dynamic engine where the AI intelligently identifies all variables in a user's request and generates a complex, customized UI for the tool automatically.
* **Conversational Program Modification:** Allow users to refine and edit already-created tools through follow-up conversation (e.g., "Take the Alibaba tool you made and add a column for 'Gross Margin'").
* **Generative Web Search:** Enable MAGK to find reports and data sources without a direct URL (e.g., "Find the latest annual report for Alibaba and extract the financials").
* **Source Reference-ability:** A key feature to allow analysts to instantly trace any piece of data in an Excel sheet back to its original source document (PDF page or website table).

**Long-term Vision**
* **Screen Capture to Workflow:** Evolve the input method from natural language chat to allowing an analyst to simply record their screen performing a task, with MAGK observing and automatically creating the automation tool.
* **Internal Knowledge Base:** Develop MAGK into a true "AI Intern" that retains a memory of previously gathered data, learns analyst preferences, and can proactively provide information.
* **Microsoft Office Suite Integration:** Expand beyond Excel to provide seamless, context-aware automation for Word, PowerPoint, and Outlook.

**Expansion Opportunities**
* **Beyond Equity Research:** Adapt the MAGK platform to serve other departments within the firm (e.g., compliance, operations, sales) that face similar manual data workflow challenges.

## Technical Considerations
**Platform Requirements**
* **Target Platforms:** This will be a desktop application for Windows, as it needs to interact deeply with locally installed software like Microsoft Excel and the local file system.
* **Performance Requirements:** The application must remain responsive during workflow execution, especially during the "real-time" Excel updates, to provide a seamless user experience.

**Technology Preferences**
* **Primary Language:** Python seems to be the preferred language, given its strong ecosystem of libraries for data extraction (e.g., Selenium, BeautifulSoup), PDF parsing (e.g., PyMuPDF), and Excel manipulation (e.g., openpyxl).
* **User Interface:** A desktop GUI framework will be needed for the "seamless window." Python-native options like Tkinter or PyQt are possibilities.
* **Excel Compatibility:** The method used to interact with Excel must be compatible with **Excel 2007 specifications (.xls format)** in addition to modern formats.
* **Packaging:** The final generated tool will be packaged as a standalone Windows Executable (`.exe`).

**Architecture Considerations**
* **Service Architecture:** A local, self-contained application architecture is most appropriate for the MVP, rather than a client-server or web-based model.
* **Integration Requirements:** The most critical integration is with the local operating system to read files and with the Microsoft Excel application itself, **ensuring backward compatibility with older, enterprise-standard versions.**
* **Security/Compliance:** As the tool will handle potentially sensitive financial data from reports, all processing must occur locally on the user's machine, and no data should be transmitted externally.

## Constraints & Assumptions
**Constraints**
* **Timeline:** There is a non-negotiable one-week deadline to produce a working demo for the presentation on August 5th (China Time).
* **Resources:** The development team consists of two members.
* **Technical:** The solution must be a local Windows desktop application and must maintain compatibility with older, enterprise-standard versions of Microsoft Excel (including `.xls` format).

**Key Assumptions**
* **Technical Feasibility:** We assume that the "semi-dynamic" UI and real-time Excel updates are technically feasible to implement as a proof-of-concept within the one-week timeframe.
* **Novel Workflow Capability:** We assume the workflow generation engine will be robust enough to handle a *novel*, simple workflow request live during the demo, beyond the pre-planned primary use cases. The system will not be hardcoded only for the specific examples.
* **User Permissions:** We assume that the Junior Analysts will have the necessary permissions on their corporate machines to run the standalone executable tools generated by MAGK.
* **Source Stability:** We assume that the website layouts and PDF report structures for any potential demo use cases will not change during the development week.
* **Environment Stability:** We assume a stable and controlled technical environment will be available for the live presentation.

## Risks & Open Questions
**Key Risks**
* **Technical Risk (Novelty Engine):** The requirement for the engine to handle a *novel*, simple workflow live is the most significant risk. The generalized engine may not be robust enough to handle an unexpected request flawlessly within the one-week timeframe.
    * **Mitigation Strategy:** A pre-scripted backup workflow demo will be prepared as a contingency in case the live novel request fails during the presentation.
* **Technical Risk (Demo Magic):** The "real-time" Excel updates and semi-dynamic UI are technically complex. There's a risk they could consume a disproportionate amount of development time, jeopardizing the core automation workflow.
* **Timeline Risk:** The one-week timeline is extremely aggressive for the current scope and has no buffer for unexpected technical hurdles, debugging, or environment setup issues.
* **Dependency Risk:** The demo relies on the structure of third-party websites and PDF reports, which could change without notice and break the workflow right before the presentation.

**Areas Needing Further Research**
* The most reliable Python libraries for interacting with older Excel (`.xls`) formats.
* The most robust method for creating a standalone Python executable on Windows.
* A quick prototype to validate the feasibility of the "real-time" Excel update mechanism.

## Next Steps
**Immediate Actions**
1.  Review and give final approval for this completed Project Brief.
2.  Begin technical research on the identified areas: the most reliable Python library for Excel 2007 (`.xls`) compatibility and the best method for packaging the tool as a Windows Executable.
3.  Prepare the pre-scripted backup workflow demo as a contingency.
4.  Proceed with the BMad workflow by handing this brief to the Product Manager (PM) to begin creating the detailed Product Requirements Document (PRD).

**PM Handoff**
This Project Brief provides the full context for the MAGK Demo. Please start in 'PRD Generation Mode', review the brief thoroughly to work with the user to create the PRD section by section as the template indicates, asking for any necessary clarification or suggesting improvements.