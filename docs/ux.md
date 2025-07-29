## Introduction

This document defines the user experience goals, information architecture, user flows, and visual design specifications for the MAGK Demo's user interface. It serves as the foundation for visual design and frontend development, ensuring a cohesive and user-centered experience that feels "magical" and effortless.

### Overall UX Goals & Principles

### Target User Personas

- **Primary User (Operator): The Junior Analyst / Intern** - A tech-savvy but non-programming employee who is delegated manual data gathering tasks and needs a simple, reliable way to automate them.
- **Secondary User (Beneficiary): The Senior Equity Research Analyst** - The key stakeholder who identifies workflows for automation and benefits from the increased speed and data integrity of their team's output.

### Usability Goals

- **Effortless Automation:** A user must be able to turn a complex, multi-step workflow into a simple, one-click program through a single, natural language conversation.
- **Time Reduction:** Reduce the time to complete a complex data extraction task by over 90% compared to the manual process.
- **Flawless Accuracy:** Achieve 100% data accuracy for all demonstrated workflows.

### Design Principles

1. **Simplicity by Default:** The interface should be clean and intuitive, hiding all technical complexity.
2. **Conversational Flow:** The primary interaction should feel like a natural conversation with a helpful intern.
3. **Immediate & Transparent Feedback:** The user should always see the result of their actions.
4. **Clarity Over Cleverness:** Prioritize clear communication and straightforward interactions.

### Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| July 29, 2024 | 1.0 | Initial UI/UX Specification based on PRD v1.0. | Sally (UX Expert) |
| July 29, 2024 | 2.0 | Revised user flow to an in-app library model and added a file upload mechanism for improved feasibility and UX. | Sally (UX Expert) |

## Information Architecture (IA)

### Site Map / Screen Inventory

The application now includes a simple library to manage saved workflows.

```
graph TD
    A[Main Chat Window] --> B(Define Workflow);
    B --> C(Save Workflow);
    A --> D[Workflow Library];
    D --> E(Run Saved Workflow);

```

## User Flows

### Core User Flow: Workflow Definition and Execution

**User Goal:** To create a permanent, reusable automation tool from a simple conversation and run it with one click.

```
graph TD
    subgraph "Phase 1: Workflow Creation"
        A[User opens MAGK] --> B{User describes workflow};
        B -- Optional --> B1[User uploads a local file e.g., PDF];
        B1 --> C;
        B --> C;
        C[MAGK asks clarifying questions];
        C --> D{User confirms details};
        D --> E[User names the workflow];
        E --> F[Workflow is saved to Library];
    end
    subgraph "Phase 2: Workflow Execution"
        G[User opens Workflow Library] --> H[User clicks 'Run' on a saved workflow];
        H --> I[Tool UI with relevant inputs appears];
        I --> J[User provides inputs and clicks 'Run'];
        J --> K[MAGK executes workflow];
        K --> L[Results appear in Excel];
    end

```

## Wireframes & Mockups

### Key Screen Layouts

- **Screen: Main Chat Window**
    - **Purpose:** To provide a simple, conversational interface for defining a workflow.
    - **Key Elements:**
        - Conversation history display area.
        - Text input field for user messages.
        - **"Upload File" button.**
        - **(Optional) Drag-and-drop target area for files.**
        - "Send" button.
        - **"View Library" button.**
- **Screen: Workflow Library (Modal Window)**
    - **Purpose:** To view and run previously saved workflows.
    - **Key Elements:**
        - A list of saved workflow names.
        - A "Run" button next to each workflow.
- **Screen: Generated Tool UI (Modal Window)**
    - **Purpose:** To provide inputs for a specific workflow run.
    - **Key Elements:**
        - **Rules-based** input **controls** (e.g., a date-range picker, a text field for a year).
        - A "Run Workflow" button.
        - A status display area (e.g., "Processing...", "Done.").

## Component Library / Design System

- **Component: ChatInput:** Now includes an "Upload File" button.
- **Component: ChatMessage:** No change.
- **Component: RulesBasedFormControl:** (Formerly DynamicFormControl) Renders pre-built UI controls based on **simple keyword detection** in the workflow description (e.g., "date" -> DatePicker). **No** AI model **is used.**

## Animation & Micro-interactions

- **Key Animations:** A subtle "cell-by-cell" population animation will be **simulated by the client** after the data is fully processed and downloaded. This provides the impressive visual effect for the demo without the technical risk of live COM automation.