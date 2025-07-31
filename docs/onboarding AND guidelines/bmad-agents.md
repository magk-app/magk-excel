# BMad Agents - Sequential Development Workflow

## Overview

This document outlines the sequential development workflow for using the Scrum Master (SM), Developer (Dev), and Quality Assurance (QA) agents within the Cursor and Claude Code IDEs, based on the BMad-Method framework.

## Prerequisites

Before starting this workflow, you must have:

- Completed the Planning Phase, resulting in `docs/prd.md` and `docs/architecture.md`
- Successfully sharded your planning documents into the `docs/prd/` and `docs/architecture/` folders

## Core Principle: Context Management

For maximum effectiveness and to prevent AI context confusion, you **must start a new, clean chat session for each agent handoff** (from SM to Dev, and from Dev to QA).

## Step 1: Story Creation (SM Agent)

The Scrum Master agent creates the next user story from the sharded planning documents. This is an iterative process you will repeat for every story.

### Process:

1. **Start a New Chat in your IDE**

2. **Invoke the SM Agent:**
   - In Cursor: Type `@sm` in the chat prompt
   - In Claude Code: Type `/sm` in the chat prompt

3. **Run the Create Task:**
   - Type `*create`
   - The SM agent will execute the `create-next-story` task, find the next sequential story from the sharded documents in `docs/prd/`, and generate a new story file in the `docs/stories/` directory

4. **Review and Approve:**
   - The story is created with a **Status: Draft**
   - You must manually review the story
   - Once you are satisfied, change its status to **Status: Approved**
   - The **dev agent can only work on approved stories**

## Step 2: Story Implementation (Dev Agent)

The Developer agent takes the approved story and writes the code.

### Process:

1. **Start a New, Clean Chat**

2. **Invoke the Dev Agent:**
   - In Cursor: Type `@dev`
   - In Claude Code: Type `/dev`

3. **Provide the Story:**
   - The agent will ask which story to implement
   - Copy and paste the entire content of the approved story file into the chat
   - This provides the agent with the complete context it needs

4. **Implementation:**
   - The **dev agent** will follow the tasks and subtasks listed in the story, creating and modifying files as required
   - It will maintain a "File List" within the story file, documenting all changes

5. **Mark for Review:**
   - Once the agent completes the implementation and all tests pass, it will update the story's status to **Status: Review**

## Step 3: Quality Assurance (QA Agent - Optional)

The QA agent performs a senior-level code review and can refactor the code for improvements. This step is optional but highly recommended.

### Process:

1. **Start a New, Clean Chat**

2. **Invoke the QA Agent:**
   - In Cursor: Type `@qa`
   - In Claude Code: Type `/qa`

3. **Run the Review Task:**
   - Ask the agent to execute the `review-story` task, providing the relevant story file and its implemented code

4. **Review and Refactor:**
   - The QA agent reviews the code, can refactor it directly, and appends its findings to the story's QA Results section

5. **Finalize Status:**
   - **If Approved:** The QA agent updates the story's status to **Status: Done**
   - **If Changes are Needed:** The status remains **Status: Review**, and the agent will leave a checklist of items for the dev agent to address

## Step 4: Rework (If Necessary)

If the QA agent requested changes, the workflow loops back to the dev agent.

### Process:

1. **Start a New, Clean Chat** with the dev agent
2. **Provide the story context again**, along with the specific feedback from the QA agent
3. The **dev agent** will address the remaining items and resubmit the story for QA review

## Step 5: Repeat the Cycle

This entire **SM → Dev → QA** workflow is performed sequentially for each story until all stories for the epic are complete. **Only one story should be in progress at any given time.**

## Status Flow Summary

```
Draft → Approved → Review → Done
  ↑         ↓        ↓
  └── Rework ────────┘
```

## Key Points

- **Always start fresh chats** for agent handoffs
- **Only approved stories** can be worked on by dev agents
- **One story at a time** to maintain focus and quality
- **QA review is optional** but highly recommended for code quality
- **Iterative process** - repeat for each story in the epic
