# Claude Sub-Agents Guide

## Overview

Claude provides access to specialized sub-agents that can be invoked to handle specific development tasks. These agents are designed to work alongside the main BMad agents (SM, Dev, QA) to provide expert assistance in particular domains.

## Core Development Agents

### Debugger Agent
**Invocation**: `@debugger` or `/debugger`

**Purpose**: Specialized debugging for errors, test failures, and unexpected behavior.

**When to Use**:
- When encountering any errors or exceptions
- When tests are failing unexpectedly
- When code behavior doesn't match expectations
- When performance issues arise

**Capabilities**:
- Root cause analysis of errors
- Stack trace interpretation
- Reproduction step identification
- Minimal fix implementation
- Strategic debug logging
- Variable state inspection

**Example Usage**:
```
@debugger
I'm getting a WebDriverException when trying to access the website. 
Error: "chrome not reachable"
```

### Python Pro Agent
**Invocation**: `@python-pro` or `/python-pro`

**Purpose**: Advanced Python development with idiomatic code, performance optimization, and comprehensive testing.

**When to Use**:
- Writing complex Python features
- Refactoring existing code
- Performance optimization
- Implementing design patterns
- Setting up comprehensive testing

**Capabilities**:
- Advanced Python features (decorators, metaclasses, descriptors)
- Async/await and concurrent programming
- Performance optimization and profiling
- Design patterns and SOLID principles
- Comprehensive testing (pytest, mocking, fixtures)
- Type hints and static analysis

**Example Usage**:
```
@python-pro
I need to refactor this web scraping code to use async/await for better performance
and add comprehensive error handling with custom exceptions.
```

## Testing and Quality Assurance

### Test Automator Agent
**Invocation**: `@test-automator` or `/test-automator`

**Purpose**: Comprehensive test suite creation with unit, integration, and e2e tests.

**When to Use**:
- Setting up test coverage for new features
- Improving existing test suites
- Setting up CI/CD test pipelines
- Creating test data management strategies

**Capabilities**:
- Unit test design with mocking and fixtures
- Integration tests with test containers
- E2E tests with Playwright/Cypress
- CI/CD test pipeline configuration
- Test data management and factories
- Coverage analysis and reporting

**Example Usage**:
```
@test-automator
I need to create comprehensive tests for the web extraction functionality
using real data from the Hong Kong immigration website.
```

## AI and Machine Learning

### AI Engineer Agent
**Invocation**: `@ai-engineer` or `/ai-engineer`

**Purpose**: Building LLM applications, RAG systems, and AI-powered features.

**When to Use**:
- Implementing AI-powered features
- Setting up RAG (Retrieval-Augmented Generation) systems
- Integrating with LLM APIs
- Building chatbot functionality
- Implementing vector search

**Capabilities**:
- LLM integration (OpenAI, Anthropic, local models)
- RAG systems with vector databases
- Prompt engineering and optimization
- Agent frameworks (LangChain, LangGraph)
- Embedding strategies and semantic search
- Token optimization and cost management

**Example Usage**:
```
@ai-engineer
I need to implement a RAG system for the MAGK Excel project that can
understand user queries and generate appropriate automation workflows.
```

### Prompt Engineer Agent
**Invocation**: `@prompt-engineer` or `/prompt-engineer`

**Purpose**: Optimizing prompts for LLMs and AI systems.

**When to Use**:
- Building AI features that require specific prompting
- Improving agent performance
- Crafting system prompts
- Optimizing AI responses

**Capabilities**:
- Few-shot vs zero-shot prompt selection
- Chain-of-thought reasoning
- Role-playing and perspective setting
- Output format specification
- Constraint and boundary setting
- Model-specific optimization

**Example Usage**:
```
@prompt-engineer
I need to create a prompt that can reliably extract table data from
various website formats and return it in a consistent JSON structure.
```

## Documentation and API Development

### API Documenter Agent
**Invocation**: `@api-documenter` or `/api-documenter`

**Purpose**: Creating OpenAPI/Swagger specs, generating SDKs, and writing developer documentation.

**When to Use**:
- Documenting API endpoints
- Creating OpenAPI specifications
- Generating client libraries
- Writing developer documentation
- Setting up interactive documentation

**Capabilities**:
- OpenAPI 3.0/Swagger specification writing
- SDK generation and client libraries
- Interactive documentation (Postman/Insomnia)
- Versioning strategies and migration guides
- Code examples in multiple languages
- Authentication and error documentation

**Example Usage**:
```
@api-documenter
I need to create OpenAPI documentation for the MAGK Excel API endpoints
including authentication, error handling, and usage examples.
```

## Agent Selection Guidelines

### When to Use Multiple Agents
- **Complex features**: Combine Python Pro + Test Automator for new functionality
- **AI integration**: Use AI Engineer + Prompt Engineer for AI-powered features
- **Bug resolution**: Start with Debugger, then use appropriate specialist
- **Documentation**: Use API Documenter for API work, general documentation for other code

### Agent Workflow Integration
1. **Start with main BMad agents** (SM, Dev, QA) for story management
2. **Invoke specialists** when you need domain expertise
3. **Combine agents** for complex tasks requiring multiple specialties
4. **Maintain human oversight** - you control the process

### Best Practices
- **Be specific**: Tell agents exactly what you need help with
- **Provide context**: Share relevant code, errors, or requirements
- **Review suggestions**: Always review and approve agent recommendations
- **Iterate**: Use agent feedback to improve your approach
- **Know when to stop**: Switch to manual development if agents aren't helping

## Agent Invocation Examples

### Debugging Session
```
@debugger
I'm getting this error when running the web extraction:
WebDriverException: Message: chrome not reachable
Stack trace: [detailed trace here]

I've tried restarting Chrome and updating ChromeDriver, but the issue persists.
```

### Python Refactoring
```
@python-pro
I need to refactor this synchronous web scraping code to use async/await:

[code block]

The goal is to improve performance when scraping multiple pages and add
proper error handling with custom exceptions.
```

### Test Creation
```
@test-automator
I need to create comprehensive tests for the PDF extraction functionality.
The code handles various PDF formats and extracts table data.
Please use real PDF data from the Alibaba annual report for testing.
```

### AI Feature Implementation
```
@ai-engineer
I need to implement a natural language workflow generator that can:
1. Parse user requests in natural language
2. Generate appropriate automation workflows
3. Handle various data sources (web, PDF, Excel)
4. Provide error handling and validation

This should integrate with the existing MAGK Excel architecture.
```

## Integration with Development Workflow

### Story Development Process
1. **SM Agent**: Creates and manages stories
2. **Dev Agent**: Main implementation work
3. **Specialist Agents**: Domain-specific assistance as needed
4. **QA Agent**: Review and quality assurance
5. **Debugger Agent**: Handle any issues that arise

### Quality Assurance Integration
- **Test Automator**: Ensures comprehensive test coverage
- **Python Pro**: Code quality and performance optimization
- **API Documenter**: Documentation completeness
- **Debugger**: Issue resolution and prevention

### Continuous Improvement
- Use agents proactively for code reviews
- Leverage specialists for performance optimization
- Employ AI Engineer for advanced features
- Utilize Prompt Engineer for AI interaction improvements

## Troubleshooting Agent Issues

### Common Problems
- **Agent not responding**: Check invocation syntax and try again
- **Incorrect suggestions**: Provide more context or try a different agent
- **Conflicting advice**: Use your judgment to choose the best approach
- **Performance issues**: Switch to manual development if needed

### Getting Help
- **Check documentation**: Review agent capabilities and limitations
- **Try different agents**: Some agents may be better suited for specific tasks
- **Provide more context**: Detailed information helps agents provide better assistance
- **Use human judgment**: You're always in control of the development process

---

**Remember**: These agents are tools to enhance your development capabilities, not replacements for human expertise and judgment. Always review and approve their suggestions before implementing changes.
