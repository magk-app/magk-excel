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

## Claude Sub-Agents

Claude provides access to specialized sub-agents for specific development tasks. These agents work alongside the main BMad agents to provide expert assistance in particular domains.

### Core Development Agents
- **@debugger** - Specialized debugging for errors, test failures, and unexpected behavior
- **@python-pro** - Advanced Python development with idiomatic code, performance optimization, and comprehensive testing

### Testing and Quality Assurance
- **@test-automator** - Comprehensive test suite creation with unit, integration, and e2e tests

### AI and Machine Learning
- **@ai-engineer** - Building LLM applications, RAG systems, and AI-powered features
- **@prompt-engineer** - Optimizing prompts for LLMs and AI systems

### Documentation and API Development
- **@api-documenter** - Creating OpenAPI/Swagger specs, generating SDKs, and writing developer documentation

### Agent Usage Guidelines
- **Invoke with @agent-name** or **/agent-name** in chat
- **Provide specific context** about what you need help with
- **Review all suggestions** before implementing
- **Combine agents** for complex tasks requiring multiple specialties
- **Maintain human oversight** - you control the development process

For detailed information about each agent's capabilities and usage examples, see [Claude Sub-Agents Guide](docs/onboarding%20AND%20guidelines/claude-agents.md).

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
- Maintain test coverage for critical paths
- **Use real data only** - never use fake or mock data in tests
- **Always write unit tests for typescript projects, javascript and other things**

## Development Guidelines

### Code Quality Standards
- **Write rigorous code** and review 2-3 times before committing
- **Follow Python best practices** and PEP 8 style guidelines
- **Use type hints** for better code clarity and IDE support
- **Implement comprehensive error handling** with custom exceptions
- **Optimize for performance** when dealing with large datasets

### Documentation Requirements
- **Document all code effectively** in whatever language needs documentation
- **Write clear, human-readable documentation** that explains functionality
- **Include usage examples** for complex functions and classes
- **Document API endpoints** with request/response examples
- **Maintain up-to-date README files** for each module

### Testing Standards
- **Write test cases with real data** rather than fake or mock data
- **Use the data sources mentioned in the project brief** for testing
- **Reference data provided in Slack** for different sections
- **Test both happy path and edge cases**
- **Ensure tests are deterministic** and repeatable

### Project Organization
- **Organize documentation effectively** in the right folders
- **Only create new folders if necessary** to maintain clean structure
- **Follow the established project structure** for consistency
- **Keep related files together** in logical groupings

### File and Script Guidelines
- **NO EMOJIs in any .bat scripts or .md files** in general
- **Use clear, descriptive file names** that indicate purpose
- **Maintain consistent formatting** across all files
- **Include proper headers and metadata** in documentation files

### Development Workflow
- **Follow the BMad methodology** for story development
- **Use appropriate agents** for specialized tasks
- **Test frequently** during development
- **Update requirements.txt** when adding new dependencies
- **Document changes** in story files as work progresses

### Integration and Compatibility
- **Ensure backward compatibility** with Excel 2007 (.xls format)
- **Test on Windows environments** as the primary target platform
- **Verify Python 3.10+ compatibility** for all code
- **Check AWS service integration** for backend components
- **Validate PyQt compatibility** for desktop client features