# Development Workflow Guide

## Overview

This document outlines the standardized development workflow for the MAGK Excel project. Following this workflow ensures consistency, quality, and effective collaboration across the development team. This workflow is designed to work with the BMad methodology and AI-assisted development while maintaining human oversight and control.

## Prerequisites

Before starting development, ensure you have:

- **Completed onboarding**: Follow the [Getting Started Guide](getting-started.md) to set up your development environment
- **Understood the project**: Read the [Project Brief](brief.md) for context and objectives
- **Familiarized with architecture**: Review the technical documentation in `docs/architecture/`
- **Set up BMad agents**: Understand the [BMad Agents workflow](bmad-agents.md)

## Core Development Principles

### 1. Human-Centric AI Collaboration
- **You are in control**: AI is a tool, not a replacement for human judgment
- **Review every change**: Never let AI make changes without your explicit approval
- **Question AI decisions**: If something doesn't make sense, ask for clarification or do it manually
- **Stay focused**: If AI goes off-track, restart the conversation or switch to manual development

### 2. Quality-First Approach
- **Test early and often**: Get the smallest feature working before expanding
- **Real data only**: Never use fake or mock data in tests
- **Document as you go**: Write clear, concise documentation for your code
- **Iterate to stability**: Keep refining until acceptance criteria are met

## Development Workflow Steps

### Step 1: Project Understanding and Preparation

#### 1.1 Read and Understand Documentation
- **Start with the story**: Read the complete story file you're working on
- **Review related documents**: Check PRD sections, architecture docs, and related stories
- **Understand acceptance criteria**: Know exactly what "done" looks like
- **Identify dependencies**: Note any other components or services your work depends on

#### 1.2 Ask Questions Early
- **Clarify requirements**: If anything is unclear in the story, ask questions immediately
- **Verify assumptions**: Confirm your understanding of the technical approach
- **Check constraints**: Understand any limitations or requirements (e.g., Excel 2007 compatibility)
- **Discuss integration points**: Understand how your work fits with other components

#### 1.3 Plan Your Approach
- **Break down the work**: Identify the smallest working piece you can build first
- **Consider testing strategy**: Plan how you'll test each component
- **Think about data**: Identify what real data you'll use for testing
- **Document your plan**: Write down your approach before starting

### Step 2: AI-Assisted Development

#### 2.1 Setting Up AI Collaboration
- **Use appropriate agents**: Follow the [BMad Agents workflow](bmad-agents.md)
- **Provide clear context**: Give AI the complete story and relevant documentation
- **Set expectations**: Tell AI exactly what you want it to help with
- **Maintain control**: You approve every change, not AI

#### 2.2 Working with AI Effectively
- **Start small**: Begin with the simplest possible implementation
- **Review every suggestion**: Don't accept AI changes without understanding them
- **Ask for explanations**: If AI suggests something complex, ask it to explain why
- **Provide feedback**: Tell AI when its approach isn't working
- **Know when to stop**: If AI is struggling, switch to manual development

#### 2.3 Handling AI Challenges
- **AI going off-track**: If AI starts implementing features not in the story, redirect it
- **Complex solutions**: If AI suggests overly complex solutions, ask for simpler alternatives
- **Incorrect assumptions**: If AI makes wrong assumptions, correct them immediately
- **Performance issues**: If AI-generated code is slow, ask for optimizations

### Step 3: Testing Strategy

#### 3.1 Start with the Smallest Working Feature
- **Identify the core**: Find the smallest piece that can work independently
- **Build incrementally**: Get this core piece working before adding features
- **Test immediately**: Test each small piece as you build it
- **Expand gradually**: Add features one at a time, testing each addition

#### 3.2 Using Real Data for Testing
- **Leverage existing data**: Use the data sources mentioned in the project brief
- **Use Slack data**: Reference the data Alex provided in Slack for different sections
- **Create realistic scenarios**: Test with data that represents real use cases
- **Avoid mocks**: Never use fake data or mock objects in tests

#### 3.3 Test Implementation Guidelines
```python
# Example of good test structure
def test_web_extraction_with_real_data():
    """Test web extraction using real Hong Kong immigration data"""
    # Use actual URL and real data structure
    test_url = "https://www.immd.gov.hk/eng/stat_20231231.html"
    expected_columns = ["Year", "Month", "Total Arrivals", "Total Departures"]
    
    result = extract_table_data(test_url, "immigration_stats")
    
    assert result is not None
    assert all(col in result.columns for col in expected_columns)
    assert len(result) > 0  # Should have actual data
```

#### 3.4 Testing Best Practices
- **Test the happy path**: Ensure normal operation works correctly
- **Test edge cases**: Handle empty data, malformed inputs, network errors
- **Test integration points**: Verify components work together
- **Test performance**: Ensure reasonable response times
- **Automate tests**: Make tests repeatable and automated

### Step 4: Dependency and Library Management

#### 4.1 Managing Requirements
- **Update requirements.txt**: Add new libraries as you use them
- **Specify versions**: Use specific versions to ensure consistency
- **Document dependencies**: Explain why each library is needed
- **Test compatibility**: Ensure new libraries work with existing code

#### 4.2 Example requirements.txt update
```txt
# Add new dependencies with clear comments
selenium==4.16.0          # Web scraping and automation
openpyxl==3.1.2           # Excel file manipulation
PyMuPDF==1.23.8           # PDF parsing and extraction
pytest==8.0.0             # Testing framework
```

#### 4.3 Library Selection Guidelines
- **Prefer established libraries**: Choose well-maintained, popular libraries
- **Check compatibility**: Ensure libraries work with Python 3.10+ and Windows
- **Consider licensing**: Use libraries with appropriate licenses
- **Document choices**: Explain why you chose specific libraries

### Step 5: Story Management and Updates

#### 5.1 When to Update Stories
- **Minor changes**: Update story files directly for small adjustments
- **Significant changes**: Use BMad agents for major changes (different services, architecture changes)
- **Document decisions**: Record why changes were made
- **Update status**: Keep story status current as work progresses

#### 5.2 Story Update Guidelines
```markdown
# Example story update
## Dev Agent Record
- [x] Implemented basic web extraction functionality
- [x] Added Excel output generation
- [ ] Need to handle PDF parsing edge cases

## File List
- apps/server/chalicelib/web_extractor.py (new)
- apps/server/chalicelib/excel_integration.py (modified)
- tests/unit/test_web_extractor.py (new)

## Status: In Progress
```

### Step 6: Documentation Standards

#### 6.1 Code Documentation
- **Function documentation**: Explain what each function does and how to use it
- **Class documentation**: Describe the purpose and usage of classes
- **Module documentation**: Explain the overall purpose of each module
- **Example usage**: Provide examples of how to use your code

#### 6.2 Example Documentation
```python
def extract_table_from_website(url: str, table_identifier: str) -> pd.DataFrame:
    """
    Extract table data from a website using Selenium.
    
    This function navigates to the specified URL and extracts table data
    based on the provided identifier. It handles common web scraping
    challenges like dynamic loading and table formatting.
    
    Args:
        url (str): The website URL to scrape
        table_identifier (str): CSS selector or XPath to identify the table
        
    Returns:
        pd.DataFrame: Extracted table data
        
    Raises:
        WebDriverException: If the website cannot be accessed
        ValueError: If the table cannot be found
        
    Example:
        >>> df = extract_table_from_website(
        ...     "https://example.com/data",
        ...     "#main-table"
        ... )
        >>> print(df.head())
    """
```

#### 6.3 Tool Documentation
- **Usage instructions**: Explain how to use any tools you create
- **Configuration**: Document any configuration options
- **Troubleshooting**: Provide common solutions to issues
- **Integration**: Explain how tools work with other components

### Step 7: Iteration and Refinement

#### 7.1 Continuous Improvement
- **Test frequently**: Run tests after every significant change
- **Refactor as needed**: Improve code quality as you go
- **Address feedback**: Respond to code review comments promptly
- **Optimize performance**: Look for ways to improve speed and efficiency

#### 7.2 Stability Criteria
- **All tests pass**: Ensure comprehensive test coverage
- **Acceptance criteria met**: Verify the story requirements are satisfied
- **Integration works**: Confirm components work together
- **Documentation complete**: Ensure code is well-documented
- **Performance acceptable**: Meet performance requirements

#### 7.3 Final Validation
- **Self-review**: Review your own code before submitting
- **Test with real scenarios**: Use realistic data and scenarios
- **Check integration**: Ensure your work integrates with other components
- **Update story status**: Mark story as complete when done

## Bug Resolution Workflow

### 1. Identify the Issue
- **Reproduce the bug**: Create a minimal test case that demonstrates the problem
- **Document the behavior**: Write down what you expect vs. what actually happens
- **Check recent changes**: Identify what might have caused the issue

### 2. Research Solutions
- **Search online**: Look for similar issues and solutions
- **Check documentation**: Review library documentation and examples
- **Consult team**: Ask colleagues if they've encountered similar issues
- **Use AI assistance**: Ask AI for potential solutions, but verify them

### 3. Implement Fixes
- **Start with the simplest solution**: Try the most straightforward fix first
- **Test thoroughly**: Ensure the fix doesn't break other functionality
- **Document the fix**: Explain what was wrong and how you fixed it
- **Update tests**: Add tests to prevent the bug from recurring

## Quality Assurance Checklist

Before considering any story complete, verify:

- [ ] **Code quality**: Code is clean, readable, and follows project standards
- [ ] **Documentation**: All code is properly documented
- [ ] **Testing**: Comprehensive tests with real data
- [ ] **Integration**: Works with other project components
- [ ] **Performance**: Meets performance requirements
- [ ] **Acceptance criteria**: All story requirements are satisfied
- [ ] **Story status**: Story file is updated with current status
- [ ] **Requirements updated**: Any new dependencies are documented

## Common Pitfalls to Avoid

### 1. AI Dependency
- **Don't rely too heavily on AI**: Use AI as a tool, not a crutch
- **Maintain understanding**: Always understand what AI is doing
- **Know when to stop**: Switch to manual development if AI isn't helping

### 2. Testing Issues
- **Don't use fake data**: Always test with real, representative data
- **Don't skip tests**: Write tests for all functionality
- **Don't ignore failures**: Fix test failures immediately

### 3. Documentation Problems
- **Don't skip documentation**: Document as you go, not at the end
- **Don't assume knowledge**: Write for someone who doesn't know your code
- **Don't forget examples**: Provide usage examples for complex functionality

### 4. Integration Issues
- **Don't work in isolation**: Consider how your code integrates with others
- **Don't ignore dependencies**: Update requirements.txt and document changes
- **Don't break existing functionality**: Ensure your changes don't break other components

## Resources and References

- **[Project Brief](brief.md)**: Overall project context and objectives
- **[Getting Started Guide](getting-started.md)**: Environment setup and onboarding
- **[BMad Agents Workflow](bmad-agents.md)**: AI agent collaboration process
- **[CLAUDE.md](../CLAUDE.md)**: Technical architecture and development guidelines
- **[Architecture Documentation](../architecture/)**: Technical design and implementation details
- **[Product Requirements](../prd/)**: Detailed functional requirements

## Getting Help

When you encounter issues:

1. **Check documentation first**: Review relevant documentation
2. **Search for similar issues**: Look for existing solutions
3. **Ask specific questions**: Provide context and specific error details
4. **Use AI assistance**: Ask AI for help, but verify solutions
5. **Consult the team**: Reach out to colleagues for guidance

---

**Remember**: The goal is to deliver high-quality, well-tested, and well-documented code that meets the acceptance criteria and contributes to the overall success of the MAGK Excel project. Quality and consistency are more important than speed.
