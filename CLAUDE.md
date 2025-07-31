# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MAGK Excel is a desktop automation platform that enables users to define data extraction workflows using natural language. It's architected as a hybrid client-server application with a PyQt desktop client and serverless AWS backend.

## Key Architecture Components

### Client-Server Architecture
- **Desktop Client**: PyQt-based Windows application (apps/client/)
- **Serverless Backend**: AWS Lambda + Chalice framework (apps/server/)
- **AI Integration**: Amazon Bedrock for natural language workflow generation
- **Data Sources**: Web pages, PDFs, and Excel files

### Core Technologies
- **Frontend**: Python 3.13.x + PyQt 6.x
- **Backend**: Python 3.13.x + AWS Chalice 1.31.x  
- **Web Scraping**: Selenium 4.x
- **PDF Parsing**: PyMuPDF 1.23.x
- **Excel Manipulation**: openpyxl 3.1.x
- **Testing**: pytest 8.x

## Project Structure (approximate and subject to change)

```
magk-demo/
├── apps/
│   ├── client/           # Desktop client application
│   │   ├── src/
│   │   │   ├── ui/       # PyQt UI components
│   │   │   ├── api/      # Backend API client
│   │   │   ├── workflows/ # Local workflow management
│   │   │   └── main.py   # Client entry point
│   │   └── tests/
│   └── server/           # Serverless backend
│       ├── app.py        # Chalice app routes
│       ├── chalicelib/   # Backend modules
│       └── tests/
├── docs/
│   ├── stories/          # Development stories
│   ├── architecture/     # Technical documentation
│   └── prd/              # Product requirements
└── .bmad-core/           # BMad methodology files
```

## Development Commands

### Testing
```bash
# Run backend tests
cd apps/server && pytest

# Run client tests  
cd apps/client && pytest
```

### Deployment
```bash
# Deploy backend to AWS
cd apps/server && chalice deploy
```

## BMad Development Methodology

This project uses the BMad methodology with specialized agents:

### Key Commands
- `/BMad:agents:dev` - Activate Developer agent for story implementation
- `/BMad:agents:bmad-orchestrator` - Coordinate agents and workflows
- `*help` - Show available commands (when in agent mode)
- `*develop-story` - Implement a story from docs/stories/

### Story Development Workflow
1. Stories are located in `docs/stories/*.story.md`
2. Dev agent only updates specific sections in story files:
   - Task/subtask checkboxes
   - Dev Agent Record sections
   - File List
   - Status
3. Follow task order exactly as specified in story
4. Run tests after each implementation

### Important Files
- `.bmad-core/core-config.yaml` - BMad configuration
- `docs/architecture/tech-stack.md` - Technology choices
- `docs/prd/2-requirements.md` - Functional requirements

## API Endpoints

### POST /execute-workflow
- **Purpose**: Trigger data extraction workflow
- **Request**: WorkflowConfig JSON
- **Response**: `{ "outputUrl": "<S3 pre-signed URL>" }`

## Key Data Models

### WorkflowConfig
- `sourceType`: 'web' | 'pdf' | 'excel'
- `sourceUri`: URL or file path
- `dataIdentifier`: Table/data identifier
- `outputConfig`: Excel output settings

## Testing Requirements
- All new modules require unit tests
- Use pytest with proper fixtures
s- Maintain test coverage for critical paths

## Development Guidelines

## Code Documentation and Quality Guidelines
- NO EMOJIs in any .bat scripts or .md files in general
- Always document your code effectively when you code in whatever language that needs documentation so that it's more human readable (this is very important)
- Always write test cases with real data rather than fake or mock datas
- Always organize your docs effectively in the right folders, only create new folders if necessary
- Always write code rigorously and review the code 2-3 times before commiting