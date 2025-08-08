# Claude Flow: Complete Agents & Commands Documentation

## 📚 Table of Contents
1. [All 54 Agents - Detailed Documentation](#all-54-agents)
2. [Complete Command Reference](#complete-command-reference)
3. [MCP Tool Commands](#mcp-tool-commands)
4. [Usage Examples](#usage-examples)
5. [Quick Reference Tables](#quick-reference-tables)

---

## 🤖 All 54 Agents - Detailed Documentation {#all-54-agents}

### 1. Core Development Agents

#### **coder**
- **Purpose**: Implementation specialist for writing clean, efficient code
- **Capabilities**: Code generation, refactoring, optimization, implementation
- **Best For**: New features, bug fixes, code improvements
- **Usage**: `Task("Coder agent: Implement user authentication with JWT")`

#### **reviewer**
- **Purpose**: Code review and quality assurance specialist
- **Capabilities**: PR reviews, best practices validation, security checks, style adherence
- **Best For**: Pull request reviews, code quality assessment
- **Usage**: `Task("Reviewer agent: Review PR #123 for security and performance")`

#### **tester**
- **Purpose**: Comprehensive testing and quality assurance specialist
- **Capabilities**: Unit tests, integration tests, e2e tests, test coverage analysis
- **Best For**: Test suite creation, validation, regression testing
- **Usage**: `Task("Tester agent: Create comprehensive test suite for API endpoints")`

#### **planner**
- **Purpose**: Strategic planning and task orchestration agent
- **Capabilities**: Project decomposition, workflow design, resource allocation, timeline planning
- **Best For**: Project planning, task breakdown, sprint planning
- **Usage**: `Task("Planner agent: Create development roadmap for Q1 features")`

#### **researcher**
- **Purpose**: Deep research and information gathering specialist
- **Capabilities**: Documentation analysis, solution research, API exploration, best practices research
- **Best For**: Technical research, feasibility studies, technology evaluation
- **Usage**: `Task("Researcher agent: Research best practices for microservices architecture")`

### 2. Swarm Coordination Agents

#### **hierarchical-coordinator**
- **Purpose**: Queen-led hierarchical swarm coordination with specialized workers
- **Architecture**: Centralized command structure with clear delegation
- **Strengths**: Efficient resource allocation, clear command chain
- **Usage**: `mcp__claude-flow__agent_spawn { type: "coordinator", name: "hierarchical-coordinator" }`

#### **mesh-coordinator**
- **Purpose**: Peer-to-peer mesh network swarm with distributed decision making
- **Architecture**: Fully connected network, no single point of failure
- **Strengths**: High fault tolerance, resilient to node failures
- **Usage**: `mcp__claude-flow__agent_spawn { type: "coordinator", name: "mesh-coordinator" }`

#### **adaptive-coordinator**
- **Purpose**: Dynamic topology switching coordinator with self-organizing patterns
- **Architecture**: ML-optimized topology that adapts to workload
- **Strengths**: Self-optimizing, learns from performance metrics
- **Usage**: `mcp__claude-flow__agent_spawn { type: "coordinator", name: "adaptive-coordinator" }`

#### **collective-intelligence-coordinator**
- **Purpose**: Neural center orchestrating collective decision-making and shared intelligence
- **Capabilities**: Consensus building, knowledge aggregation, distributed learning
- **Best For**: Complex decision making, multi-agent learning
- **Usage**: `mcp__claude-flow__agent_spawn { type: "coordinator", name: "collective-intelligence-coordinator" }`

#### **swarm-memory-manager**
- **Purpose**: Distributed memory coordination and optimization specialist
- **Capabilities**: Memory sharing, state synchronization, cache management
- **Best For**: Cross-agent memory, persistent state management
- **Usage**: `mcp__claude-flow__agent_spawn { type: "coordinator", name: "swarm-memory-manager" }`

### 3. Consensus & Distributed Systems Agents

#### **byzantine-coordinator**
- **Purpose**: Coordinates Byzantine fault-tolerant consensus protocols
- **Protocol**: PBFT (Practical Byzantine Fault Tolerance)
- **Tolerance**: Handles up to f < n/3 malicious nodes
- **Usage**: `mcp__claude-flow__daa_consensus { agents: ["node1", "node2"], proposal: {...} }`

#### **raft-manager**
- **Purpose**: Manages Raft consensus algorithm with leader election
- **Features**: Leader election, log replication, snapshot management
- **Best For**: Strongly consistent distributed systems
- **Usage**: `mcp__claude-flow__agent_spawn { type: "specialist", name: "raft-manager" }`

#### **gossip-coordinator**
- **Purpose**: Coordinates gossip-based consensus for scalable systems
- **Protocol**: Epidemic dissemination, anti-entropy
- **Scalability**: O(log n) message complexity
- **Usage**: `mcp__claude-flow__agent_spawn { type: "specialist", name: "gossip-coordinator" }`

#### **consensus-builder**
- **Purpose**: Byzantine fault-tolerant consensus and voting mechanism specialist
- **Capabilities**: Threshold signatures, voting protocols, quorum management
- **Best For**: Distributed decision making, consensus protocols
- **Usage**: `Task("Consensus builder: Implement voting mechanism for feature flags")`

#### **crdt-synchronizer**
- **Purpose**: Implements Conflict-free Replicated Data Types
- **Types**: G-Counter, PN-Counter, OR-Set, LWW-Register, RGA
- **Consistency**: Eventually consistent, conflict-free
- **Usage**: `mcp__claude-flow__agent_spawn { type: "specialist", name: "crdt-synchronizer" }`

#### **quorum-manager**
- **Purpose**: Implements dynamic quorum adjustment and membership management
- **Capabilities**: Adaptive quorum sizing, membership protocols, partition handling
- **Best For**: Distributed systems requiring flexible consensus
- **Usage**: `Task("Quorum manager: Optimize quorum size for network conditions")`

#### **security-manager**
- **Purpose**: Implements comprehensive security for distributed protocols
- **Features**: Threshold cryptography, zero-knowledge proofs, attack mitigation
- **Protection**: Byzantine, Sybil, Eclipse, DoS attack defense
- **Usage**: `mcp__claude-flow__agent_spawn { type: "specialist", name: "security-manager" }`

### 4. Performance & Optimization Agents

#### **perf-analyzer**
- **Purpose**: Performance bottleneck analyzer for workflow inefficiencies
- **Capabilities**: Profiling, bottleneck detection, optimization recommendations
- **Metrics**: CPU, memory, I/O, network analysis
- **Usage**: `mcp__claude-flow__bottleneck_analyze { component: "api-server" }`

#### **performance-benchmarker**
- **Purpose**: Comprehensive performance benchmarking for protocols
- **Capabilities**: Load testing, stress testing, comparative analysis
- **Output**: Detailed metrics, graphs, optimization suggestions
- **Usage**: `mcp__claude-flow__benchmark_run { suite: "comprehensive" }`

#### **task-orchestrator**
- **Purpose**: Central coordination for task decomposition and result synthesis
- **Capabilities**: Task scheduling, dependency management, parallel execution
- **Strategies**: Sequential, parallel, adaptive execution
- **Usage**: `mcp__claude-flow__task_orchestrate { task: "Build feature", strategy: "parallel" }`

#### **memory-coordinator**
- **Purpose**: Manage persistent memory across sessions
- **Capabilities**: Cross-session state, memory optimization, garbage collection
- **Features**: Namespacing, TTL management, compression
- **Usage**: `mcp__claude-flow__memory_usage { action: "store", key: "state", value: "..." }`

### 5. GitHub & Repository Management Agents

#### **github-modes**
- **Purpose**: Comprehensive GitHub integration with batch optimization
- **Capabilities**: PR management, issue tracking, workflow automation
- **Features**: Batch operations, API optimization, webhook handling
- **Usage**: `Task("GitHub modes: Setup automated PR workflow")`

#### **pr-manager**
- **Purpose**: Pull request management with swarm coordination
- **Capabilities**: Automated reviews, merge management, conflict resolution
- **Automation**: Auto-merge, review assignment, status checks
- **Usage**: `mcp__claude-flow__github_pr_manage { repo: "owner/repo", action: "review" }`

#### **code-review-swarm**
- **Purpose**: Deploy specialized AI agents for intelligent code reviews
- **Capabilities**: Security analysis, performance review, best practices check
- **Coverage**: Beyond static analysis, semantic understanding
- **Usage**: `Task("Code review swarm: Perform comprehensive review of PR #456")`

#### **issue-tracker**
- **Purpose**: Intelligent issue management with automated tracking
- **Capabilities**: Triage, prioritization, assignment, progress tracking
- **Automation**: Auto-labeling, duplicate detection, milestone tracking
- **Usage**: `mcp__claude-flow__github_issue_track { repo: "owner/repo", action: "triage" }`

#### **release-manager**
- **Purpose**: Automated release coordination and deployment
- **Capabilities**: Version management, changelog generation, deployment orchestration
- **Features**: Semantic versioning, rollback support, multi-environment
- **Usage**: `mcp__claude-flow__github_release_coord { repo: "owner/repo", version: "1.2.0" }`

#### **workflow-automation**
- **Purpose**: GitHub Actions workflow automation with multi-agent coordination
- **Capabilities**: CI/CD pipeline creation, workflow optimization, matrix builds
- **Integration**: Self-organizing pipelines, adaptive optimization
- **Usage**: `mcp__claude-flow__github_workflow_auto { repo: "owner/repo", workflow: {...} }`

#### **project-board-sync**
- **Purpose**: Synchronize AI swarms with GitHub Projects
- **Capabilities**: Visual task management, progress tracking, team coordination
- **Features**: Kanban boards, sprint planning, burndown charts
- **Usage**: `Task("Project board sync: Update GitHub Project with swarm progress")`

#### **repo-architect**
- **Purpose**: Repository structure optimization and multi-repo management
- **Capabilities**: Monorepo design, dependency management, structure optimization
- **Best For**: Large-scale projects, microservices architecture
- **Usage**: `Task("Repo architect: Design optimal monorepo structure")`

#### **multi-repo-swarm**
- **Purpose**: Cross-repository swarm orchestration
- **Capabilities**: Organization-wide automation, cross-repo synchronization
- **Scale**: Manages 10-100+ repositories simultaneously
- **Usage**: `mcp__claude-flow__github_sync_coord { repos: ["repo1", "repo2", "repo3"] }`

### 6. SPARC Methodology Agents

#### **sparc-coord**
- **Purpose**: SPARC methodology orchestrator for phase coordination
- **Phases**: Specification → Pseudocode → Architecture → Refinement → Completion
- **Coordination**: Manages phase transitions, ensures completeness
- **Usage**: `npx claude-flow sparc pipeline "Build authentication system"`

#### **sparc-coder**
- **Purpose**: Transform specifications into working code with TDD
- **Approach**: Test-first development, incremental implementation
- **Output**: Production-ready code with full test coverage
- **Usage**: `npx claude-flow sparc tdd "Implement user registration"`

#### **specification**
- **Purpose**: SPARC Specification phase for requirements analysis
- **Capabilities**: Requirements gathering, user story creation, acceptance criteria
- **Output**: Detailed specifications, API contracts, data models
- **Usage**: `npx claude-flow sparc run spec "Define payment processing requirements"`

#### **pseudocode**
- **Purpose**: SPARC Pseudocode phase for algorithm design
- **Capabilities**: Logic design, algorithm planning, flow diagrams
- **Output**: Pseudocode, algorithmic complexity analysis
- **Usage**: `npx claude-flow sparc run pseudocode "Design sorting algorithm"`

#### **architecture**
- **Purpose**: SPARC Architecture phase for system design
- **Capabilities**: Component design, interface definitions, data flow
- **Output**: Architecture diagrams, component specifications
- **Usage**: `npx claude-flow sparc run architect "Design microservices architecture"`

#### **refinement**
- **Purpose**: SPARC Refinement phase for iterative improvement
- **Capabilities**: Code optimization, refactoring, performance tuning
- **Approach**: Continuous improvement, feedback incorporation
- **Usage**: `npx claude-flow sparc run refine "Optimize database queries"`

### 7. Specialized Development Agents

#### **backend-dev**
- **Purpose**: Specialized agent for backend API development
- **Technologies**: REST, GraphQL, gRPC, WebSocket
- **Capabilities**: Database design, API endpoints, authentication, caching
- **Usage**: `Task("Backend dev: Create GraphQL API for user management")`

#### **mobile-dev**
- **Purpose**: Expert agent for React Native mobile development
- **Platforms**: iOS, Android, cross-platform
- **Capabilities**: Native modules, navigation, state management, push notifications
- **Usage**: `Task("Mobile dev: Implement offline-first mobile app")`

#### **ml-developer**
- **Purpose**: Machine learning model development and deployment
- **Capabilities**: Model training, hyperparameter tuning, deployment, monitoring
- **Frameworks**: TensorFlow, PyTorch, scikit-learn, MLflow
- **Usage**: `Task("ML developer: Train sentiment analysis model")`

#### **cicd-engineer**
- **Purpose**: GitHub Actions CI/CD pipeline creation and optimization
- **Capabilities**: Pipeline design, matrix builds, deployment automation
- **Features**: Caching, parallelization, environment management
- **Usage**: `Task("CI/CD engineer: Setup multi-stage deployment pipeline")`

#### **api-docs**
- **Purpose**: Expert agent for OpenAPI/Swagger documentation
- **Capabilities**: API specification, example generation, SDK creation
- **Output**: OpenAPI 3.0 specs, interactive documentation, client libraries
- **Usage**: `Task("API docs: Generate comprehensive API documentation")`

#### **system-architect**
- **Purpose**: Expert agent for system architecture and high-level design
- **Capabilities**: Pattern selection, scalability design, technology selection
- **Expertise**: Microservices, serverless, event-driven architecture
- **Usage**: `Task("System architect: Design scalable e-commerce platform")`

#### **code-analyzer**
- **Purpose**: Advanced code quality analysis for improvements
- **Capabilities**: Static analysis, complexity metrics, dependency analysis
- **Tools**: AST analysis, cyclomatic complexity, code smell detection
- **Usage**: `Task("Code analyzer: Analyze codebase for technical debt")`

#### **base-template-generator**
- **Purpose**: Create foundational templates and boilerplate code
- **Capabilities**: Project scaffolding, component templates, configuration setup
- **Output**: Clean, well-structured templates following best practices
- **Usage**: `Task("Template generator: Create React component boilerplate")`

#### **smart-agent**
- **Purpose**: Intelligent agent coordination and dynamic spawning
- **Capabilities**: Agent selection, capability matching, auto-spawning
- **Intelligence**: Learns optimal agent combinations for tasks
- **Usage**: `mcp__claude-flow__daa_capability_match { task_requirements: [...] }`

### 8. Testing & Validation Agents

#### **tdd-london-swarm**
- **Purpose**: TDD London School specialist for mock-driven development
- **Approach**: Outside-in TDD, mock-first, behavior verification
- **Tools**: Mock frameworks, stub generation, test doubles
- **Usage**: `Task("TDD London: Implement payment service with mocks")`

#### **production-validator**
- **Purpose**: Production validation ensuring deployment readiness
- **Checks**: Health checks, smoke tests, performance validation, security scans
- **Criteria**: Deployment checklist, rollback readiness, monitoring setup
- **Usage**: `Task("Production validator: Validate release candidate 2.0")`

### 9. Migration & Planning Agents

#### **migration-planner**
- **Purpose**: Comprehensive migration planning for system transitions
- **Capabilities**: Dependency analysis, risk assessment, rollback planning
- **Strategies**: Blue-green, canary, rolling deployments
- **Usage**: `Task("Migration planner: Plan database migration to PostgreSQL")`

#### **swarm-init**
- **Purpose**: Swarm initialization and topology optimization specialist
- **Capabilities**: Topology selection, agent allocation, resource planning
- **Optimization**: Performance tuning, load balancing, fault tolerance
- **Usage**: `mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 8 }`

---

## 📝 Complete Command Reference {#complete-command-reference}

### SPARC Commands

#### Basic SPARC Commands
```bash
# List all available SPARC modes
npx claude-flow sparc modes

# Get detailed information about a specific mode
npx claude-flow sparc info <mode>
# Example: npx claude-flow sparc info spec

# Run a specific SPARC mode
npx claude-flow sparc run <mode> "<task description>"
# Example: npx claude-flow sparc run architect "Design payment system"

# Execute complete TDD workflow
npx claude-flow sparc tdd "<feature description>"
# Example: npx claude-flow sparc tdd "User authentication with OAuth2"
```

#### Batch Processing Commands
```bash
# Execute multiple modes in parallel
npx claude-flow sparc batch <mode1,mode2,mode3> "<task>"
# Example: npx claude-flow sparc batch spec,pseudocode,architect "Build chat system"

# Run complete SPARC pipeline (all phases)
npx claude-flow sparc pipeline "<task description>"
# Example: npx claude-flow sparc pipeline "Create e-commerce platform"

# Process multiple tasks concurrently from file
npx claude-flow sparc concurrent <mode> "<tasks-file>"
# Example: npx claude-flow sparc concurrent tdd "./tasks.txt"
```

### Swarm Management Commands

#### Initialization Commands
```bash
# Initialize swarm with specific topology
npx claude-flow swarm init --topology <type> --max-agents <number>
# Topology options: mesh, hierarchical, ring, star
# Example: npx claude-flow swarm init --topology hierarchical --max-agents 10

# Initialize with strategy
npx claude-flow swarm init --topology mesh --strategy adaptive
# Strategy options: balanced, specialized, adaptive
```

#### Agent Commands
```bash
# Spawn a new agent
npx claude-flow agent spawn --type <type> --name <name> --capabilities <list>
# Types: researcher, coder, analyst, optimizer, coordinator
# Example: npx claude-flow agent spawn --type coder --name "backend-specialist"

# List all agents
npx claude-flow agent list --filter <filter>
# Filters: all, active, idle, busy
# Example: npx claude-flow agent list --filter active

# Get agent metrics
npx claude-flow agent metrics --agent-id <id> --metric <type>
# Metrics: all, cpu, memory, tasks, performance
# Example: npx claude-flow agent metrics --agent-id "agent-123" --metric performance

# Terminate agent
npx claude-flow agent terminate --agent-id <id>
# Example: npx claude-flow agent terminate --agent-id "agent-123"
```

#### Task Commands
```bash
# Orchestrate a task
npx claude-flow task orchestrate --task "<description>" --strategy <type> --priority <level>
# Strategy: parallel, sequential, adaptive
# Priority: low, medium, high, critical
# Example: npx claude-flow task orchestrate --task "Refactor auth module" --strategy parallel --priority high

# Check task status
npx claude-flow task status --task-id <id> --detailed
# Example: npx claude-flow task status --task-id "task-456" --detailed

# Get task results
npx claude-flow task results --task-id <id> --format <type>
# Format: summary, detailed, raw
# Example: npx claude-flow task results --task-id "task-456" --format detailed

# Cancel task
npx claude-flow task cancel --task-id <id>
# Example: npx claude-flow task cancel --task-id "task-456"
```

### Hook Commands

#### Session Management Hooks
```bash
# Pre-task initialization
npx claude-flow hooks pre-task --description "<task>" --priority <level>
# Example: npx claude-flow hooks pre-task --description "API development" --priority high

# Session restoration
npx claude-flow hooks session-restore --session-id <id> --load-memory
# Example: npx claude-flow hooks session-restore --session-id "swarm-789" --load-memory

# Session end with metrics export
npx claude-flow hooks session-end --export-metrics --save-state
# Example: npx claude-flow hooks session-end --export-metrics true --save-state true
```

#### Operation Hooks
```bash
# Post-edit hook
npx claude-flow hooks post-edit --file <path> --memory-key <key> --notify
# Example: npx claude-flow hooks post-edit --file "./src/api.js" --memory-key "swarm/coder/step1"

# Notification hook
npx claude-flow hooks notify --message "<message>" --level <type>
# Levels: info, warning, error, success
# Example: npx claude-flow hooks notify --message "Deployment complete" --level success

# Post-task hook
npx claude-flow hooks post-task --task-id <id> --save-results
# Example: npx claude-flow hooks post-task --task-id "task-123" --save-results
```

### Memory Commands

#### Basic Memory Operations
```bash
# Store memory
npx claude-flow memory store --key <key> --value <value> --namespace <ns> --ttl <seconds>
# Example: npx claude-flow memory store --key "config" --value "{...}" --namespace "app" --ttl 3600

# Retrieve memory
npx claude-flow memory retrieve --key <key> --namespace <ns>
# Example: npx claude-flow memory retrieve --key "config" --namespace "app"

# Delete memory
npx claude-flow memory delete --key <key> --namespace <ns>
# Example: npx claude-flow memory delete --key "temp-data" --namespace "cache"

# List all keys
npx claude-flow memory list --namespace <ns> --limit <number>
# Example: npx claude-flow memory list --namespace "app" --limit 50
```

#### Advanced Memory Operations
```bash
# Search memory with pattern
npx claude-flow memory search --pattern <regex> --namespace <ns> --limit <number>
# Example: npx claude-flow memory search --pattern "user_*" --namespace "auth" --limit 20

# Backup memory
npx claude-flow memory backup --path <directory> --compress
# Example: npx claude-flow memory backup --path "./backups" --compress

# Restore memory
npx claude-flow memory restore --backup-path <path> --overwrite
# Example: npx claude-flow memory restore --backup-path "./backups/backup-2024.tar.gz"

# Compress namespace
npx claude-flow memory compress --namespace <ns> --algorithm <type>
# Algorithms: gzip, lz4, zstd
# Example: npx claude-flow memory compress --namespace "logs" --algorithm zstd
```

### Performance Commands

#### Benchmarking
```bash
# Run benchmarks
npx claude-flow benchmark run --suite <type> --iterations <number> --output <path>
# Suites: all, wasm, swarm, agent, task
# Example: npx claude-flow benchmark run --suite all --iterations 100 --output "./results.json"

# Compare benchmarks
npx claude-flow benchmark compare --baseline <file> --current <file>
# Example: npx claude-flow benchmark compare --baseline "v1.json" --current "v2.json"
```

#### Performance Analysis
```bash
# Generate performance report
npx claude-flow performance report --format <type> --timeframe <period>
# Format: summary, detailed, json
# Timeframe: 24h, 7d, 30d
# Example: npx claude-flow performance report --format detailed --timeframe 7d

# Analyze bottlenecks
npx claude-flow bottleneck analyze --component <name> --metrics <list>
# Example: npx claude-flow bottleneck analyze --component "api-server" --metrics "cpu,memory,io"

# Token usage analysis
npx claude-flow token usage --operation <type> --timeframe <period>
# Example: npx claude-flow token usage --operation "all" --timeframe 24h
```

### GitHub Integration Commands

#### Repository Management
```bash
# Analyze repository
npx claude-flow github repo analyze --repo <owner/name> --type <analysis>
# Types: code_quality, performance, security
# Example: npx claude-flow github repo analyze --repo "myorg/myrepo" --type security

# Get repository metrics
npx claude-flow github metrics --repo <owner/name> --period <timeframe>
# Example: npx claude-flow github metrics --repo "myorg/myrepo" --period 30d
```

#### Pull Request Management
```bash
# Manage pull requests
npx claude-flow github pr manage --repo <owner/name> --pr <number> --action <type>
# Actions: review, merge, close, approve
# Example: npx claude-flow github pr manage --repo "myorg/myrepo" --pr 123 --action review

# Create pull request
npx claude-flow github pr create --repo <owner/name> --title "<title>" --body "<description>"
# Example: npx claude-flow github pr create --repo "myorg/myrepo" --title "Add auth" --body "Implements OAuth2"
```

#### Issue Management
```bash
# Track issues
npx claude-flow github issue track --repo <owner/name> --action <type>
# Actions: triage, assign, label, close
# Example: npx claude-flow github issue track --repo "myorg/myrepo" --action triage

# Create issue
npx claude-flow github issue create --repo <owner/name> --title "<title>" --labels <list>
# Example: npx claude-flow github issue create --repo "myorg/myrepo" --title "Bug in auth" --labels "bug,high"
```

---

## 🔧 MCP Tool Commands {#mcp-tool-commands}

### Swarm Coordination Tools

```javascript
// Initialize swarm
mcp__claude-flow__swarm_init({
  topology: "mesh|hierarchical|ring|star",
  maxAgents: 10,
  strategy: "balanced|specialized|adaptive"
})

// Spawn agent
mcp__claude-flow__agent_spawn({
  type: "coordinator|analyst|optimizer|documenter|monitor|specialist",
  name: "custom-name",
  capabilities: ["capability1", "capability2"],
  swarmId: "swarm-123"
})

// Task orchestration
mcp__claude-flow__task_orchestrate({
  task: "Build authentication system",
  strategy: "parallel|sequential|adaptive",
  priority: "low|medium|high|critical",
  dependencies: ["task1", "task2"]
})

// Swarm monitoring
mcp__claude-flow__swarm_monitor({
  swarmId: "swarm-123",
  interval: 1000, // milliseconds
})
```

### Memory Management Tools

```javascript
// Memory operations
mcp__claude-flow__memory_usage({
  action: "store|retrieve|list|delete|search",
  key: "memory-key",
  value: "data",
  namespace: "default",
  ttl: 3600 // seconds
})

// Memory search
mcp__claude-flow__memory_search({
  pattern: "user_*",
  namespace: "auth",
  limit: 10
})

// Memory persistence
mcp__claude-flow__memory_persist({
  sessionId: "session-123"
})

// Memory backup
mcp__claude-flow__memory_backup({
  path: "./backups/memory.bak"
})
```

### Neural & AI Tools

```javascript
// Neural training
mcp__claude-flow__neural_train({
  pattern_type: "coordination|optimization|prediction",
  training_data: "dataset",
  epochs: 50
})

// Neural prediction
mcp__claude-flow__neural_predict({
  modelId: "model-123",
  input: "input-data"
})

// Pattern recognition
mcp__claude-flow__neural_patterns({
  action: "analyze|learn|predict",
  operation: "classification",
  metadata: { confidence: 0.95 }
})

// Cognitive analysis
mcp__claude-flow__cognitive_analyze({
  behavior: "user-interaction-pattern"
})
```

### Performance Tools

```javascript
// Performance report
mcp__claude-flow__performance_report({
  format: "summary|detailed|json",
  timeframe: "24h|7d|30d"
})

// Bottleneck analysis
mcp__claude-flow__bottleneck_analyze({
  component: "api-server",
  metrics: ["cpu", "memory", "network"]
})

// Benchmark execution
mcp__claude-flow__benchmark_run({
  suite: "comprehensive|minimal|custom"
})

// Metrics collection
mcp__claude-flow__metrics_collect({
  components: ["swarm", "agents", "memory", "neural"]
})
```

### GitHub Integration Tools

```javascript
// Repository analysis
mcp__claude-flow__github_repo_analyze({
  repo: "owner/repository",
  analysis_type: "code_quality|performance|security"
})

// PR management
mcp__claude-flow__github_pr_manage({
  repo: "owner/repository",
  pr_number: 123,
  action: "review|merge|close"
})

// Issue tracking
mcp__claude-flow__github_issue_track({
  repo: "owner/repository",
  action: "triage|assign|label"
})

// Release coordination
mcp__claude-flow__github_release_coord({
  repo: "owner/repository",
  version: "1.2.0"
})
```

---

## 💡 Usage Examples {#usage-examples}

### Example 1: Complete Feature Development
```bash
# Initialize swarm for feature development
npx claude-flow swarm init --topology hierarchical --max-agents 8

# Run SPARC pipeline for complete feature
npx claude-flow sparc pipeline "Build user authentication with OAuth2"

# The system will automatically:
# 1. Analyze requirements (Specification)
# 2. Design algorithms (Pseudocode)
# 3. Create architecture (Architecture)
# 4. Implement with TDD (Refinement)
# 5. Integrate and validate (Completion)
```

### Example 2: Multi-Agent Code Review
```javascript
// Spawn code review swarm
await mcp__claude-flow__swarm_init({ topology: "mesh", maxAgents: 5 });

await Promise.all([
  mcp__claude-flow__agent_spawn({ type: "reviewer", name: "security-reviewer" }),
  mcp__claude-flow__agent_spawn({ type: "reviewer", name: "performance-reviewer" }),
  mcp__claude-flow__agent_spawn({ type: "reviewer", name: "style-reviewer" })
]);

// Orchestrate review
await mcp__claude-flow__task_orchestrate({
  task: "Review PR #456 for security, performance, and style",
  strategy: "parallel",
  priority: "high"
});
```

### Example 3: Production Deployment
```bash
# Validate production readiness
npx claude-flow agent spawn --type production-validator --name "prod-check"

# Run validation suite
npx claude-flow task orchestrate --task "Validate release 2.0" --priority critical

# Create release
npx claude-flow github release coord --repo "myorg/myapp" --version "2.0.0"

# Deploy with monitoring
npx claude-flow hooks notify --message "Deployment started" --level info
npx claude-flow swarm monitor --duration 300 --interval 5
```

### Example 4: Performance Optimization
```bash
# Analyze current performance
npx claude-flow bottleneck analyze --component "api-server"

# Spawn optimization team
npx claude-flow swarm init --topology adaptive --max-agents 6

# Run optimization tasks
npx claude-flow sparc batch perf-analyzer,code-analyzer,optimizer "Optimize API performance"

# Benchmark improvements
npx claude-flow benchmark run --suite all --output "./after-optimization.json"
npx claude-flow benchmark compare --baseline "./before.json" --current "./after-optimization.json"
```

---

## 📊 Quick Reference Tables {#quick-reference-tables}

### Agent Categories Quick Reference

| Category | Count | Primary Agents | Use Case |
|----------|-------|----------------|----------|
| Core Development | 5 | coder, reviewer, tester | Basic development tasks |
| Swarm Coordination | 5 | hierarchical, mesh, adaptive | Multi-agent orchestration |
| Consensus | 7 | byzantine, raft, gossip | Distributed systems |
| Performance | 4 | perf-analyzer, benchmarker | Optimization tasks |
| GitHub | 9 | pr-manager, issue-tracker | Repository management |
| SPARC | 6 | sparc-coord, sparc-coder | Methodology execution |
| Specialized | 9 | backend-dev, mobile-dev, ml | Domain-specific tasks |
| Testing | 2 | tdd-london, production-validator | Quality assurance |
| Migration | 2 | migration-planner, swarm-init | System transitions |

### Command Categories Quick Reference

| Category | Command Prefix | Example | Purpose |
|----------|---------------|---------|---------|
| SPARC | `npx claude-flow sparc` | `sparc run spec "task"` | Methodology execution |
| Swarm | `npx claude-flow swarm` | `swarm init --topology mesh` | Swarm management |
| Agent | `npx claude-flow agent` | `agent spawn --type coder` | Agent operations |
| Task | `npx claude-flow task` | `task orchestrate --task "..."` | Task management |
| Memory | `npx claude-flow memory` | `memory store --key "..."` | Memory operations |
| Hooks | `npx claude-flow hooks` | `hooks pre-task --description` | Event hooks |
| GitHub | `npx claude-flow github` | `github pr manage --repo` | GitHub integration |
| Performance | `npx claude-flow performance` | `performance report` | Performance analysis |

### MCP Tool Prefixes

| Prefix | Purpose | Example Tool |
|--------|---------|--------------|
| `swarm_` | Swarm management | `swarm_init`, `swarm_status` |
| `agent_` | Agent operations | `agent_spawn`, `agent_list` |
| `task_` | Task management | `task_orchestrate`, `task_status` |
| `memory_` | Memory operations | `memory_usage`, `memory_search` |
| `neural_` | AI/ML operations | `neural_train`, `neural_predict` |
| `github_` | GitHub integration | `github_pr_manage`, `github_issue_track` |
| `performance_` | Performance tools | `performance_report`, `bottleneck_analyze` |
| `daa_` | Distributed agents | `daa_consensus`, `daa_agent_create` |

### Topology Comparison

| Topology | Coordination | Fault Tolerance | Scalability | Best For |
|----------|-------------|-----------------|-------------|----------|
| Hierarchical | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Structured projects |
| Mesh | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Critical systems |
| Adaptive | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Variable workloads |
| Ring | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | Sequential tasks |
| Star | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | Simple coordination |

---

## 🎯 Best Practices

1. **Always batch operations** - Use single messages for multiple operations
2. **Choose appropriate topology** - Match topology to task requirements
3. **Monitor performance** - Track metrics and optimize continuously
4. **Use memory wisely** - Leverage persistent memory for state management
5. **Enable hooks** - Automate common patterns with hooks
6. **Test thoroughly** - Use TDD agents for comprehensive testing
7. **Document everything** - Use api-docs agent for documentation

---

どういたしまして! (You're welcome!)

*This documentation covers all 54 agents and complete command reference for Claude Flow v2.0.0*