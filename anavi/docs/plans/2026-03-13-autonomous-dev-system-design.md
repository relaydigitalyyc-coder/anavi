# Autonomous Development System Design

## Overview
This system synthesizes the strongest elements from existing ANAVI tooling (Ralph spec system, DeepSeek swarm, AgenticSeek, ANAVI agent rules) into a layered orchestrator that can operate in multiple wave patterns. The system is ANAVI-optimized but extensible for other projects, enabling spec-driven development with parallel agent execution, research capabilities, and automated PRD generation.

## Goals
1. Enable spec-driven autonomous development with configurable wave execution patterns (sequential, parallel, pipeline, dynamic).
2. Integrate existing components: Ralph for spec interpretation, DeepSeek swarm for parallel coding, AgenticSeek for research/web browsing, ANAVI rules for validation.
3. Provide automated PRD generation combining research insights with templated documentation.
4. Support hybrid approach: ANAVI-optimized core with extensibility for other project structures.
5. Implement all wave structures: sequential phases, dynamic orchestration, all-at-once parallel, and pipeline workflows.

## Key Components

### 1. Wave Orchestrator
Manages execution patterns and coordinates waves. Configurable wave patterns (sequential, parallel, pipeline, dynamic) with progress tracking, error recovery, retry logic, timeout management, and wave cancellation. Implementation: New Python/Node.js service callable from Ralph scripts.

### 2. Enhanced Ralph Core
Existing spec system enhanced with task decomposition capabilities. Adds ability to parse specs and identify task types (research, coding, validation), integrate with Wave Orchestrator API, generate task dependency graphs, and report progress back to Ralph completion tracking. Preserves existing spec system, constitution, and completion signals.

### 3. Agent Dispatcher
Intelligent routing of tasks to appropriate agent type. Decision logic: research tasks → AgenticSeek, coding tasks → DeepSeek swarm, validation tasks → ANAVI rules, PRD generation → PRD Generator. Implementation: Simple classifier service analyzing task descriptions.

### 4. AgenticSeek Integration
Web browsing, research, and planning capabilities. Integration via API client to AgenticSeek backend (port 7777). Task serialization: research questions → AgenticSeek format. Result parsing: extract insights for PRD generation. Fallback: Use local LLM if AgenticSeek unavailable.

### 5. DeepSeek Swarm Controller
Parallel coding agent management. Wrapper around existing `ds-swarm.py` with enhanced orchestration. Features: task chunking for optimal parallelization, result aggregation, conflict resolution, progress reporting to Wave Orchestrator.

### 6. ANAVI Rule Enforcer
Validation and repository hygiene. Checks: repository convention compliance (AGENTS.md, CLAUDE.md), documentation hygiene (plans, ops, TODO_BOARD updates), test execution and coverage verification (`pnpm check && pnpm test`), code quality gates before completion.

### 7. PRD Generator
Automated Product Requirements Document creation. Workflow: research phase (AgenticSeek) gathers requirements, template system applies ANAVI-specific formatting, spec mapping links PRD to implementation specs, version control with git history tracking. Extensible template system for different project types.

### 8. State Manager
Cross-wave progress tracking and context persistence. Storage: Redis or file-based state store. Manages execution context (spec, wave progress, agent results), audit trail for debugging and analysis, resume capability for interrupted executions.

## Data Flow
1. **Spec Input**: Ralph reads spec from `specs/` directory and interprets requirements.
2. **Task Decomposition**: Enhanced Ralph Core analyzes spec, identifies task types, creates dependency graph.
3. **Wave Pattern Selection**: Wave Orchestrator selects execution pattern based on spec complexity and configuration.
4. **Agent Dispatch**: Agent Dispatcher routes tasks to appropriate agent types based on content analysis.
5. **Parallel Execution**:
   - Research tasks → AgenticSeek for web browsing/analysis
   - Coding tasks → DeepSeek swarm for parallel implementation
   - PRD generation → combines research insights with templating
6. **Validation Phase**: ANAVI Rule Enforcer verifies repository conventions, docs hygiene, test execution.
7. **Completion**: Ralph Core signals completion when all acceptance criteria met, all validation passes.
8. **Documentation Update**: System updates `anavi/docs/plans/`, `anavi/docs/ops/ENGINEERING_MEMORY.md`, `anavi/docs/ops/TODO_BOARD.md`.

## Wave Patterns

### Sequential Phases
Analysis → Planning → Implementation → Validation with clear handoffs between phases. Suitable for complex projects requiring staged validation.

### Dynamic Orchestration
Intelligent coordinator spawns agents as needed based on task complexity. Adapts to requirements in real-time, optimal for exploratory work.

### All-at-once Parallel
All agents run concurrently with coordination at completion. Maximizes parallelization for independent tasks.

### Pipeline Workflow
Each wave processes output of previous wave like assembly line. Research → PRD Generation → Planning → Implementation → Validation.

## Integration Points
- **Ralph Scripts**: Extend existing `ralph-loop-*.sh` scripts to call Wave Orchestrator
- **DeepSeek Swarm**: Wrap `ds-swarm.py` with orchestration layer
- **AgenticSeek**: API client to `http://localhost:7777`
- **ANAVI Validation**: Direct calls to `pnpm check`, `pnpm test`, documentation checks
- **State Storage**: Redis for production, file-based for local development

## Safety and Intelligence
- **Progress Tracking**: State Manager maintains execution context across waves and agents
- **Error Recovery**: Wave Orchestrator implements retry logic with exponential backoff
- **Validation Gates**: ANAVI Rule Enforcer prevents completion until all quality checks pass
- **Resource Management**: Timeout and cancellation mechanisms prevent hung agents
- **Audit Trail**: Complete execution history for debugging and analysis

## Next Steps
1. Confirm design and document acceptance.
2. Use `writing-plans` skill to craft implementation plan covering Wave Orchestrator, Enhanced Ralph Core, Agent Dispatcher, and all integrations.
3. Execute plan incrementally, verifying each component with test specs.
4. Create demo spec to validate full system workflow.