# Claude Flow Complete Reference Guide

## 🚀 Overview

Claude Flow is an advanced AI orchestration system that enables systematic Test-Driven Development through the SPARC methodology (Specification, Pseudocode, Architecture, Refinement, Completion) with 54 specialized AI agents working in coordinated swarms.

### Key Achievements
- **84.8% SWE-Bench solve rate** - Industry-leading code generation accuracy
- **32.3% token reduction** - Optimized context usage
- **2.8-4.4x speed improvement** - Through parallel agent execution
- **27+ neural models** - Advanced pattern recognition and learning

## 📦 Installation

```bash
# Add Claude Flow MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Add RUV Swarm server (optional, for advanced features)
claude mcp add ruv-swarm npx ruv-swarm@latest mcp start
```

## 🤖 Complete Agent Catalog (54 Agents)

### Core Development Agents (5)
| Agent | Purpose | Best For |
|-------|---------|----------|
| **coder** | Implementation specialist for writing clean, efficient code | Writing new features, refactoring code |
| **reviewer** | Code review and quality assurance specialist | PR reviews, code quality checks |
| **tester** | Comprehensive testing and quality assurance | Unit tests, integration tests, e2e tests |
| **planner** | Strategic planning and task orchestration | Project decomposition, workflow design |
| **researcher** | Deep research and information gathering | Documentation analysis, solution research |

### Swarm Coordination Agents (5)
| Agent | Purpose | Architecture |
|-------|---------|--------------|
| **hierarchical-coordinator** | Queen-led hierarchical swarm coordination | Centralized command structure |
| **mesh-coordinator** | Peer-to-peer mesh network swarm | Distributed, fault-tolerant |
| **adaptive-coordinator** | Dynamic topology switching coordinator | Self-organizing patterns |
| **collective-intelligence-coordinator** | Neural center for collective decision-making | Shared intelligence |
| **swarm-memory-manager** | Distributed memory coordination | Cross-agent memory sharing |

### Consensus & Distributed Systems (7)
| Agent | Purpose | Protocol Type |
|-------|---------|---------------|
| **byzantine-coordinator** | Byzantine fault-tolerant consensus | PBFT implementation |
| **raft-manager** | Raft consensus algorithm management | Leader election, log replication |
| **gossip-coordinator** | Gossip-based consensus protocols | Epidemic dissemination |
| **consensus-builder** | Byzantine fault-tolerant voting mechanisms | Threshold signatures |
| **crdt-synchronizer** | Conflict-free Replicated Data Types | Eventually consistent |
| **quorum-manager** | Dynamic quorum adjustment | Intelligent membership |
| **security-manager** | Security mechanisms for consensus | Cryptographic protection |

### Performance & Optimization (4)
| Agent | Purpose | Specialization |
|-------|---------|----------------|
| **perf-analyzer** | Performance bottleneck analyzer | Workflow inefficiencies |
| **performance-benchmarker** | Comprehensive performance benchmarking | Protocol benchmarks |
| **task-orchestrator** | Central task coordination | Decomposition & synthesis |
| **memory-coordinator** | Persistent memory management | Cross-session memory |

### GitHub & Repository Management (9)
| Agent | Purpose | Integration Type |
|-------|---------|------------------|
| **github-modes** | Comprehensive GitHub integration | Workflow orchestration |
| **pr-manager** | Pull request management | Automated PR lifecycle |
| **code-review-swarm** | Deploy AI agents for code reviews | Beyond static analysis |
| **issue-tracker** | Intelligent issue management | Automated tracking |
| **release-manager** | Automated release coordination | Version management |
| **workflow-automation** | GitHub Actions automation | CI/CD pipelines |
| **project-board-sync** | Synchronize with GitHub Projects | Visual task management |
| **repo-architect** | Repository structure optimization | Scalable architecture |
| **multi-repo-swarm** | Cross-repository orchestration | Organization-wide |

### SPARC Methodology Agents (6)
| Agent | Purpose | SPARC Phase |
|-------|---------|-------------|
| **sparc-coord** | SPARC methodology orchestrator | Phase coordination |
| **sparc-coder** | Transform specs into code | Implementation |
| **specification** | Requirements analysis specialist | Specification phase |
| **pseudocode** | Algorithm design specialist | Pseudocode phase |
| **architecture** | System design specialist | Architecture phase |
| **refinement** | Iterative improvement specialist | Refinement phase |

### Specialized Development (9)
| Agent | Purpose | Technology Focus |
|-------|---------|------------------|
| **backend-dev** | Backend API development | REST, GraphQL |
| **mobile-dev** | React Native mobile development | iOS, Android |
| **ml-developer** | Machine learning development | Model training, deployment |
| **cicd-engineer** | CI/CD pipeline creation | GitHub Actions |
| **api-docs** | API documentation expert | OpenAPI/Swagger |
| **system-architect** | System architecture design | High-level patterns |
| **code-analyzer** | Advanced code quality analysis | Code improvements |
| **base-template-generator** | Template and boilerplate generation | Starter configurations |
| **smart-agent** | Intelligent agent coordination | Dynamic spawning |

### Testing & Validation (2)
| Agent | Purpose | Methodology |
|-------|---------|-------------|
| **tdd-london-swarm** | TDD London School specialist | Mock-driven development |
| **production-validator** | Production readiness validation | Deployment verification |

### Migration & Planning (2)
| Agent | Purpose | Focus Area |
|-------|---------|------------|
| **migration-planner** | Migration plan creation | Command-to-agent conversion |
| **swarm-init** | Swarm initialization specialist | Topology optimization |

## 📋 Command Reference

### Core SPARC Commands
```bash
# List available SPARC modes
npx claude-flow sparc modes

# Execute specific mode with task
npx claude-flow sparc run <mode> "<task description>"

# Run complete TDD workflow
npx claude-flow sparc tdd "<feature description>"

# Get detailed information about a mode
npx claude-flow sparc info <mode>
```

### Batch Processing Commands
```bash
# Execute multiple modes in parallel
npx claude-flow sparc batch <mode1,mode2,mode3> "<task>"

# Run full SPARC pipeline
npx claude-flow sparc pipeline "<task description>"

# Process multiple tasks concurrently
npx claude-flow sparc concurrent <mode> "<tasks-file.txt>"
```

### Hook Commands (Agent Coordination)
```bash
# Pre-task initialization
npx claude-flow hooks pre-task --description "[task description]"

# Session management
npx claude-flow hooks session-restore --session-id "swarm-[id]"
npx claude-flow hooks session-end --export-metrics true

# Post-operation hooks
npx claude-flow hooks post-edit --file "[filepath]" --memory-key "swarm/[agent]/[step]"
npx claude-flow hooks notify --message "[completion message]"
npx claude-flow hooks post-task --task-id "[task-id]"
```

### Memory Management Commands
```bash
# Store and retrieve memory
npx claude-flow memory store --key "key" --value "value" --namespace "namespace"
npx claude-flow memory retrieve --key "key" --namespace "namespace"

# Search and list memory
npx claude-flow memory list --namespace "namespace"
npx claude-flow memory search --pattern "search-pattern" --limit 10

# Backup and restore
npx claude-flow memory backup --path "./backup"
npx claude-flow memory restore --backup-path "./backup"
```

### Swarm Management Commands
```bash
# Initialize swarm with topology
npx claude-flow swarm init --topology "mesh|hierarchical|ring|star" --max-agents 10

# Monitor swarm status
npx claude-flow swarm status --verbose
npx claude-flow swarm monitor --duration 10 --interval 1

# Agent management
npx claude-flow agent spawn --type "researcher|coder|analyst|optimizer|coordinator"
npx claude-flow agent list --filter "all|active|idle|busy"
npx claude-flow agent metrics --agent-id "[id]"
```

### Performance Commands
```bash
# Run benchmarks
npx claude-flow benchmark run --suite "comprehensive"

# Analyze performance
npx claude-flow performance report --format "summary|detailed|json"
npx claude-flow bottleneck analyze --component "[component]"

# Token usage analysis
npx claude-flow token usage --timeframe "24h|7d|30d"
```

## 🛠️ MCP Tool Categories

### Coordination Tools
- `mcp__claude-flow__swarm_init` - Initialize swarm topology
- `mcp__claude-flow__agent_spawn` - Create specialized agents
- `mcp__claude-flow__task_orchestrate` - Orchestrate workflows
- `mcp__claude-flow__coordination_sync` - Sync agent coordination
- `mcp__claude-flow__load_balance` - Distribute tasks efficiently

### Monitoring Tools
- `mcp__claude-flow__swarm_status` - Swarm health status
- `mcp__claude-flow__agent_list` - List active agents
- `mcp__claude-flow__agent_metrics` - Performance metrics
- `mcp__claude-flow__task_status` - Task execution status
- `mcp__claude-flow__swarm_monitor` - Real-time monitoring

### Memory & Neural Tools
- `mcp__claude-flow__memory_usage` - Persistent memory management
- `mcp__claude-flow__memory_search` - Pattern-based search
- `mcp__claude-flow__neural_status` - Neural network status
- `mcp__claude-flow__neural_train` - Train with WASM SIMD
- `mcp__claude-flow__neural_patterns` - Cognitive analysis

### GitHub Integration Tools
- `mcp__claude-flow__github_repo_analyze` - Repository analysis
- `mcp__claude-flow__github_pr_manage` - PR management
- `mcp__claude-flow__github_issue_track` - Issue tracking
- `mcp__claude-flow__github_release_coord` - Release coordination
- `mcp__claude-flow__github_workflow_auto` - Workflow automation

### Performance Tools
- `mcp__claude-flow__performance_report` - Performance reports
- `mcp__claude-flow__bottleneck_analyze` - Bottleneck identification
- `mcp__claude-flow__benchmark_run` - Performance benchmarks
- `mcp__claude-flow__metrics_collect` - System metrics
- `mcp__claude-flow__trend_analysis` - Performance trends

## ⚡ Concurrent Execution Rules

### Golden Rule: "1 MESSAGE = ALL RELATED OPERATIONS"

#### ✅ CORRECT Pattern (Single Message)
```javascript
// All operations in ONE message
[BatchTool]:
  // Initialize swarm
  mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 6 }
  
  // Spawn all agents at once
  mcp__claude-flow__agent_spawn { type: "researcher" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "tester" }
  
  // Launch all tasks together
  Task("Research agent: Analyze requirements...")
  Task("Coder agent: Implement features...")
  Task("Tester agent: Create test suite...")
  
  // Batch all todos
  TodoWrite { todos: [
    {id: "1", content: "Research", status: "in_progress"},
    {id: "2", content: "Design", status: "pending"},
    {id: "3", content: "Implement", status: "pending"},
    {id: "4", content: "Test", status: "pending"},
    {id: "5", content: "Document", status: "pending"}
  ]}
  
  // Batch file operations
  Bash "mkdir -p src tests docs config scripts"
  Write "src/index.js"
  Write "tests/index.test.js"
  Write "docs/README.md"
```

#### ❌ WRONG Pattern (Multiple Messages)
```javascript
Message 1: mcp__claude-flow__swarm_init
Message 2: Task("agent 1")
Message 3: TodoWrite { todos: [single todo] }
Message 4: Write "file.js"
// This breaks parallel coordination!
```

## 🏗️ SPARC Workflow Phases

### 1. Specification Phase
- Requirements analysis and gathering
- User story decomposition
- Acceptance criteria definition
- Command: `npx claude-flow sparc run spec "<requirements>"`

### 2. Pseudocode Phase
- Algorithm design and planning
- Logic flow documentation
- Data structure planning
- Command: `npx claude-flow sparc run pseudocode "<algorithm>"`

### 3. Architecture Phase
- System design and structure
- Component boundaries
- Interface definitions
- Command: `npx claude-flow sparc run architect "<system>"`

### 4. Refinement Phase
- TDD implementation
- Iterative improvement
- Code optimization
- Command: `npx claude-flow sparc tdd "<feature>"`

### 5. Completion Phase
- Integration and deployment
- Final validation
- Documentation
- Command: `npx claude-flow sparc run integration "<project>"`

## 🎯 Division of Responsibilities

### Claude Code Handles
- ✅ All file operations (Read, Write, Edit, MultiEdit, Glob, Grep)
- ✅ Code generation and programming
- ✅ Bash commands and system operations
- ✅ Implementation work
- ✅ Project navigation and analysis
- ✅ TodoWrite and task management
- ✅ Git operations
- ✅ Package management
- ✅ Testing and debugging

### MCP Tools Handle
- ✅ Agent coordination and planning
- ✅ Memory management
- ✅ Neural features and training
- ✅ Performance tracking
- ✅ Swarm orchestration
- ✅ GitHub integration
- ✅ Distributed consensus
- ✅ Workflow automation

**Key Principle**: MCP coordinates, Claude Code executes.

## 📊 Performance Metrics

### Swarm Topologies Performance

| Topology | Coordination Efficiency | Fault Tolerance | Scalability | Best Use Case |
|----------|------------------------|-----------------|-------------|---------------|
| **Hierarchical** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Structured projects |
| **Mesh** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Critical systems |
| **Adaptive** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Variable workloads |
| **Ring** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | Sequential processing |
| **Star** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | Simple coordination |

### Agent Coordination Protocol

#### Before Work
```bash
npx claude-flow hooks pre-task --description "[task]"
npx claude-flow hooks session-restore --session-id "swarm-[id]"
```

#### During Work
```bash
npx claude-flow hooks post-edit --file "[file]" --memory-key "swarm/[agent]/[step]"
npx claude-flow hooks notify --message "[progress update]"
```

#### After Work
```bash
npx claude-flow hooks post-task --task-id "[task]"
npx claude-flow hooks session-end --export-metrics true
```

## 🔧 Configuration

### claude-flow.config.json
```json
{
  "features": {
    "autoTopologySelection": true,
    "parallelExecution": true,
    "neuralTraining": true,
    "bottleneckAnalysis": true,
    "smartAutoSpawning": true,
    "selfHealingWorkflows": true,
    "crossSessionMemory": true,
    "githubIntegration": true
  },
  "performance": {
    "maxAgents": 10,
    "defaultTopology": "hierarchical",
    "executionStrategy": "parallel",
    "tokenOptimization": true,
    "cacheEnabled": true,
    "telemetryLevel": "detailed"
  }
}
```

### .mcp.json
```json
{
  "mcpServers": {
    "claude-flow": {
      "command": "npx",
      "args": ["claude-flow@alpha", "mcp", "start"],
      "type": "stdio"
    },
    "ruv-swarm": {
      "command": "npx",
      "args": ["ruv-swarm@latest", "mcp", "start"],
      "type": "stdio"
    }
  }
}
```

## 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**
- `/src` - Source code files
- `/tests` - Test files  
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code

## 🚀 Quick Start Examples

### Example 1: Initialize a Development Swarm
```bash
# Initialize hierarchical swarm for structured development
npx claude-flow swarm init --topology hierarchical --max-agents 8

# Spawn specialized agents
npx claude-flow agent spawn --type researcher --name "req-analyst"
npx claude-flow agent spawn --type coder --name "backend-dev"
npx claude-flow agent spawn --type tester --name "qa-engineer"

# Orchestrate development task
npx claude-flow task orchestrate --task "Build user authentication system" --strategy parallel
```

### Example 2: Run Complete TDD Workflow
```bash
# Execute full TDD cycle with SPARC methodology
npx claude-flow sparc tdd "Create REST API for user management"

# This automatically:
# 1. Analyzes requirements (Specification)
# 2. Designs algorithms (Pseudocode)
# 3. Creates architecture (Architecture)
# 4. Implements with TDD (Refinement)
# 5. Integrates and validates (Completion)
```

### Example 3: GitHub Integration
```bash
# Analyze repository and create PR
npx claude-flow github repo analyze --repo "owner/repo"
npx claude-flow github pr create --title "Feature: Add authentication" --body "Implements OAuth2"

# Deploy code review swarm
npx claude-flow github code review --pr 123 --repo "owner/repo"
```

## 🛡️ Best Practices

### 1. Start Simple
- Begin with hierarchical topology for well-understood problems
- Scale agent count gradually (start with 3-5 agents)
- Use adaptive topology for production systems

### 2. Optimize Performance
- Batch all operations in single messages
- Use memory caching for repeated operations
- Enable token optimization in config

### 3. Ensure Reliability
- Implement proper error handling
- Use fault-tolerant topologies (mesh) for critical systems
- Monitor swarm health continuously

### 4. Security Considerations
- Never hardcode secrets or credentials
- Use secure communication channels
- Implement proper authentication for distributed systems

## 🔍 Troubleshooting

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| **Poor Performance** | Check agent capability matching and load distribution |
| **Coordination Failures** | Verify network connectivity and consensus thresholds |
| **Resource Exhaustion** | Monitor and scale agent pools proactively |
| **Learning Issues** | Validate training data quality and model convergence |
| **Memory Leaks** | Use memory cleanup hooks and session management |

## 📚 Advanced Features

### Neural Training System
- 27+ pre-trained neural models
- WASM SIMD acceleration
- Adaptive learning patterns
- Cross-domain transfer learning

### Distributed Consensus
- Byzantine fault tolerance (up to f < n/3 malicious nodes)
- Raft consensus for leader election
- CRDT synchronization for eventual consistency
- Gossip protocols for scalable communication

### GitHub Automation
- Automated PR creation and management
- Intelligent code review with AI swarms
- Issue triage and prioritization
- Release coordination across repositories

### Memory Management
- Cross-session persistence
- Namespace isolation
- Pattern-based search
- Automatic backup and restore

## 📈 Performance Benefits

- **84.8% SWE-Bench solve rate** - Industry-leading accuracy
- **32.3% token reduction** - Optimized context usage
- **2.8-4.4x speed improvement** - Through parallel execution
- **99.9% uptime** - With fault-tolerant topologies
- **<100ms latency** - For agent coordination

## 🔗 Integration Tips

1. **Start with swarm initialization** - Always initialize topology first
2. **Scale gradually** - Add agents as complexity increases
3. **Use memory for context** - Leverage persistent memory for state
4. **Monitor continuously** - Track metrics and performance
5. **Train from success** - Use neural training for pattern learning
6. **Enable automation** - Use hooks for automatic optimization
7. **Integrate GitHub early** - Use GitHub tools from the start

## 📖 Additional Resources

- **Documentation**: https://github.com/ruvnet/claude-flow
- **Issues & Support**: https://github.com/ruvnet/claude-flow/issues
- **Examples**: https://github.com/ruvnet/claude-flow/examples
- **API Reference**: https://docs.claude-flow.ai

## 🎭 Agent Selection Guide

### For Development Tasks
- Simple feature: `coder` + `tester`
- Complex system: `planner` + `architect` + `coder` + `tester`
- Bug fixing: `researcher` + `code-analyzer` + `coder`
- Refactoring: `code-analyzer` + `reviewer` + `coder`

### For Repository Management
- PR creation: `pr-manager` + `coder`
- Code review: `code-review-swarm` + `reviewer`
- Release: `release-manager` + `tester` + `production-validator`
- Multi-repo: `multi-repo-swarm` + `sync-coordinator`

### For Performance
- Optimization: `perf-analyzer` + `performance-benchmarker`
- Bottlenecks: `bottleneck-analyze` + `task-orchestrator`
- Monitoring: `swarm-monitor` + `agent-metrics`

### For AI/ML Tasks
- Model development: `ml-developer` + `neural-train`
- Pattern recognition: `neural-patterns` + `cognitive-analyze`
- Predictions: `neural-predict` + `ensemble-create`

## 🏁 Conclusion

Claude Flow represents a paradigm shift in AI-assisted development, combining 54 specialized agents with advanced orchestration capabilities to achieve unprecedented efficiency and accuracy in software development. By following the patterns and practices outlined in this guide, you can leverage the full power of distributed AI swarms for your development workflows.

**Remember**: Claude Flow coordinates, Claude Code creates!

---

*Version: 2.0.0 | Last Updated: 2025*
*For the latest updates, visit: https://github.com/ruvnet/claude-flow*