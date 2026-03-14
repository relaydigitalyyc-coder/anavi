# Autonomous Development System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build layered orchestrator synthesizing Ralph spec system, DeepSeek swarm, AgenticSeek research, and ANAVI validation rules for autonomous development with configurable wave patterns.

**Architecture:** Wave Orchestrator manages execution patterns, Enhanced Ralph Core handles spec decomposition, Agent Dispatcher routes tasks, integrations with existing systems (AgenticSeek API, DeepSeek swarm, ANAVI validation).

**Tech Stack:** Node.js/TypeScript for orchestration, Python for agent integrations, Redis for state management, existing Ralph scripts in bash.

---

## Task 1: Project Structure and Dependencies

**Files:**
- Create: `anavi/scripts/autonomous-dev/package.json`
- Create: `anavi/scripts/autonomous-dev/tsconfig.json`
- Create: `anavi/scripts/autonomous-dev/README.md`

**Step 1: Create project directory and package.json**

```bash
mkdir -p anavi/scripts/autonomous-dev
cd anavi/scripts/autonomous-dev
```

```json
{
  "name": "autonomous-dev-orchestrator",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "redis": "^4.6.0",
    "axios": "^1.6.0",
    "yaml": "^2.3.0",
    "commander": "^11.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "vitest": "^1.0.0",
    "@types/redis": "^4.0.0"
  }
}
```

**Step 2: Create TypeScript configuration**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Step 3: Create README with setup instructions**

```markdown
# Autonomous Development Orchestrator

Orchestrates Ralph spec system, DeepSeek swarm, AgenticSeek research, and ANAVI validation.

## Setup
1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Run: `node dist/index.js --help`

## Configuration
- Set `AGENTICSEEK_URL` for research integration
- Set `REDIS_URL` for state management
- Configure wave patterns in `config/wave-patterns.yaml`
```

**Step 4: Install dependencies**

```bash
cd anavi/scripts/autonomous-dev
npm install
```

**Step 5: Commit initial structure**

```bash
git add anavi/scripts/autonomous-dev/
git commit -m "feat: autonomous dev orchestrator project structure"
```

---

## Task 2: Wave Orchestrator Core

**Files:**
- Create: `anavi/scripts/autonomous-dev/src/core/WaveOrchestrator.ts`
- Create: `anavi/scripts/autonomous-dev/src/core/WavePattern.ts`
- Create: `anavi/scripts/autonomous-dev/src/core/types.ts`

**Step 1: Define types for wave execution**

```typescript
// src/core/types.ts
export type WavePattern = 'sequential' | 'parallel' | 'pipeline' | 'dynamic';

export interface WaveConfig {
  pattern: WavePattern;
  maxConcurrentAgents: number;
  timeoutMs: number;
  retryAttempts: number;
}

export interface WaveTask {
  id: string;
  type: 'research' | 'coding' | 'validation' | 'prd';
  description: string;
  dependencies: string[];
  agentType: 'agenticseek' | 'deepseek' | 'anavi' | 'prd';
  config?: Record<string, any>;
}

export interface WaveProgress {
  waveId: string;
  pattern: WavePattern;
  tasks: WaveTask[];
  completed: string[];
  failed: string[];
  startedAt: Date;
  finishedAt?: Date;
}
```

**Step 2: Create WavePattern base class and implementations**

```typescript
// src/core/WavePattern.ts
import { WaveConfig, WaveTask, WaveProgress } from './types';

export abstract class WavePatternExecutor {
  constructor(protected config: WaveConfig) {}

  abstract execute(tasks: WaveTask[]): Promise<WaveProgress>;
  abstract cancel(waveId: string): Promise<void>;
}

export class SequentialWave extends WavePatternExecutor {
  async execute(tasks: WaveTask[]): Promise<WaveProgress> {
    const progress: WaveProgress = {
      waveId: `wave_${Date.now()}`,
      pattern: 'sequential',
      tasks,
      completed: [],
      failed: [],
      startedAt: new Date()
    };

    for (const task of tasks) {
      try {
        // Execute task sequentially
        await this.executeTask(task);
        progress.completed.push(task.id);
      } catch (error) {
        progress.failed.push(task.id);
        if (this.config.retryAttempts > 0) {
          // Implement retry logic
        }
      }
    }

    progress.finishedAt = new Date();
    return progress;
  }

  private async executeTask(task: WaveTask): Promise<void> {
    // Task execution will be implemented in AgentDispatcher
  }
}

// Similar implementations for ParallelWave, PipelineWave, DynamicWave
```

**Step 3: Create WaveOrchestrator main class**

```typescript
// src/core/WaveOrchestrator.ts
import { WavePattern, WaveConfig, WaveTask, WaveProgress } from './types';
import {
  SequentialWave,
  ParallelWave,
  PipelineWave,
  DynamicWave
} from './WavePattern';

export class WaveOrchestrator {
  private waveExecutors: Map<WavePattern, WavePatternExecutor> = new Map();

  constructor(private config: WaveConfig) {
    this.initializeExecutors();
  }

  private initializeExecutors(): void {
    this.waveExecutors.set('sequential', new SequentialWave(this.config));
    this.waveExecutors.set('parallel', new ParallelWave(this.config));
    this.waveExecutors.set('pipeline', new PipelineWave(this.config));
    this.waveExecutors.set('dynamic', new DynamicWave(this.config));
  }

  async executeWave(tasks: WaveTask[]): Promise<WaveProgress> {
    const executor = this.waveExecutors.get(this.config.pattern);
    if (!executor) {
      throw new Error(`Unsupported wave pattern: ${this.config.pattern}`);
    }

    return executor.execute(tasks);
  }

  async cancelWave(waveId: string): Promise<void> {
    // Implementation for cancellation
  }
}
```

**Step 4: Write basic tests for WaveOrchestrator**

```typescript
// src/core/WaveOrchestrator.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { WaveOrchestrator } from './WaveOrchestrator';
import { WaveConfig } from './types';

describe('WaveOrchestrator', () => {
  let config: WaveConfig;

  beforeEach(() => {
    config = {
      pattern: 'sequential',
      maxConcurrentAgents: 1,
      timeoutMs: 30000,
      retryAttempts: 3
    };
  });

  it('should initialize with sequential pattern', () => {
    const orchestrator = new WaveOrchestrator(config);
    expect(orchestrator).toBeDefined();
  });
});
```

**Step 5: Run tests to verify they fail**

```bash
cd anavi/scripts/autonomous-dev
npm test -- src/core/WaveOrchestrator.test.ts
```

Expected: FAIL with import errors

**Step 6: Commit wave orchestrator core**

```bash
git add anavi/scripts/autonomous-dev/src/core/
git commit -m "feat: wave orchestrator core types and base classes"
```

---

## Task 3: Enhanced Ralph Core Integration

**Files:**
- Modify: `../../../scripts/ralph-loop-codex.sh` (add wave orchestration flag)
- Create: `anavi/scripts/autonomous-dev/src/integrations/RalphIntegration.ts`
- Create: `anavi/scripts/autonomous-dev/src/integrations/SpecParser.ts`

**Step 1: Add wave orchestration flag to Ralph script**

```bash
# In ../../../scripts/ralph-loop-codex.sh, add:
# WAVE_ORCHESTRATION=true
# if [ "$WAVE_ORCHESTRATION" = "true" ]; then
#   echo "Using wave orchestration mode"
#   node anavi/scripts/autonomous-dev/dist/cli.js --spec "$SPEC_PATH"
# else
#   # Original Ralph logic
# fi
```

**Step 2: Create SpecParser to analyze spec files**

```typescript
// src/integrations/SpecParser.ts
import { readFile } from 'fs/promises';
import { WaveTask } from '../core/types';

export class SpecParser {
  async parseSpec(specPath: string): Promise<WaveTask[]> {
    const content = await readFile(specPath, 'utf-8');
    const tasks: WaveTask[] = [];

    // Analyze spec content for task types
    if (content.includes('research') || content.includes('analyze')) {
      tasks.push({
        id: `research_${Date.now()}`,
        type: 'research',
        description: 'Research requirements and existing solutions',
        dependencies: [],
        agentType: 'agenticseek'
      });
    }

    if (content.includes('implement') || content.includes('code')) {
      tasks.push({
        id: `coding_${Date.now()}`,
        type: 'coding',
        description: 'Implement feature based on spec requirements',
        dependencies: ['research_*'],
        agentType: 'deepseek'
      });
    }

    if (content.includes('test') || content.includes('validate')) {
      tasks.push({
        id: `validation_${Date.now()}`,
        type: 'validation',
        description: 'Validate implementation against ANAVI rules',
        dependencies: ['coding_*'],
        agentType: 'anavi'
      });
    }

    return tasks;
  }
}
```

**Step 3: Create RalphIntegration to bridge Ralph and wave orchestrator**

```typescript
// src/integrations/RalphIntegration.ts
import { WaveOrchestrator } from '../core/WaveOrchestrator';
import { SpecParser } from './SpecParser';
import { WaveConfig, WaveTask } from '../core/types';

export class RalphIntegration {
  constructor(
    private orchestrator: WaveOrchestrator,
    private specParser: SpecParser
  ) {}

  async executeSpec(specPath: string, wavePattern: string): Promise<void> {
    const tasks = await this.specParser.parseSpec(specPath);

    const config: WaveConfig = {
      pattern: wavePattern as any,
      maxConcurrentAgents: 5,
      timeoutMs: 300000,
      retryAttempts: 3
    };

    const progress = await this.orchestrator.executeWave(tasks);

    // Report completion to Ralph
    if (progress.failed.length === 0) {
      console.log('<promise>DONE</promise>');
    } else {
      console.log(`<promise>PARTIAL_COMPLETE with ${progress.failed.length} failures</promise>`);
    }
  }
}
```

**Step 4: Write tests for SpecParser**

```typescript
// src/integrations/SpecParser.test.ts
import { describe, it, expect, vi } from 'vitest';
import { SpecParser } from './SpecParser';
import { readFile } from 'fs/promises';

vi.mock('fs/promises');

describe('SpecParser', () => {
  it('should parse research tasks from spec', async () => {
    const mockContent = 'Research existing solutions and analyze requirements';
    vi.mocked(readFile).mockResolvedValue(mockContent);

    const parser = new SpecParser();
    const tasks = await parser.parseSpec('/fake/path.md');

    expect(tasks).toHaveLength(1);
    expect(tasks[0].type).toBe('research');
  });
});
```

**Step 5: Commit Ralph integration**

```bash
git add anavi/scripts/autonomous-dev/src/integrations/ ../../../scripts/ralph-loop-codex.sh
git commit -m "feat: Ralph integration with spec parsing and wave orchestration"
```

---

## Task 4: Agent Dispatcher

**Files:**
- Create: `anavi/scripts/autonomous-dev/src/agents/AgentDispatcher.ts`
- Create: `anavi/scripts/autonomous-dev/src/agents/AgentFactory.ts`
- Create: `anavi/scripts/autonomous-dev/src/agents/types.ts`

**Step 1: Define agent interfaces**

```typescript
// src/agents/types.ts
export interface Agent {
  execute(task: AgentTask): Promise<AgentResult>;
  cancel(): Promise<void>;
}

export interface AgentTask {
  id: string;
  type: 'research' | 'coding' | 'validation' | 'prd';
  description: string;
  config: Record<string, any>;
}

export interface AgentResult {
  taskId: string;
  success: boolean;
  output?: string;
  error?: string;
  metadata?: Record<string, any>;
}
```

**Step 2: Create AgentFactory to instantiate appropriate agents**

```typescript
// src/agents/AgentFactory.ts
import { Agent, AgentTask } from './types';
import { AgenticSeekAgent } from './AgenticSeekAgent';
import { DeepSeekAgent } from './DeepSeekAgent';
import { AnaviValidationAgent } from './AnaviValidationAgent';
import { PrdGeneratorAgent } from './PrdGeneratorAgent';

export class AgentFactory {
  static createAgent(taskType: string): Agent {
    switch (taskType) {
      case 'research':
        return new AgenticSeekAgent();
      case 'coding':
        return new DeepSeekAgent();
      case 'validation':
        return new AnaviValidationAgent();
      case 'prd':
        return new PrdGeneratorAgent();
      default:
        throw new Error(`Unknown agent type: ${taskType}`);
    }
  }
}
```

**Step 3: Create AgentDispatcher to manage agent execution**

```typescript
// src/agents/AgentDispatcher.ts
import { Agent, AgentTask, AgentResult } from './types';
import { AgentFactory } from './AgentFactory';

export class AgentDispatcher {
  private activeAgents: Map<string, Agent> = new Map();

  async dispatchTask(task: AgentTask): Promise<AgentResult> {
    const agent = AgentFactory.createAgent(task.type);
    this.activeAgents.set(task.id, agent);

    try {
      const result = await agent.execute(task);
      this.activeAgents.delete(task.id);
      return result;
    } catch (error) {
      this.activeAgents.delete(task.id);
      return {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    const agent = this.activeAgents.get(taskId);
    if (agent) {
      await agent.cancel();
      this.activeAgents.delete(taskId);
    }
  }
}
```

**Step 4: Create stub agent implementations**

```typescript
// src/agents/AgenticSeekAgent.ts
import { Agent, AgentTask, AgentResult } from './types';

export class AgenticSeekAgent implements Agent {
  async execute(task: AgentTask): Promise<AgentResult> {
    // TODO: Integrate with AgenticSeek API
    return {
      taskId: task.id,
      success: true,
      output: `Research completed for: ${task.description}`,
      metadata: { source: 'agenticseek' }
    };
  }

  async cancel(): Promise<void> {
    // Cancel ongoing research
  }
}

// Similar stubs for DeepSeekAgent, AnaviValidationAgent, PrdGeneratorAgent
```

**Step 5: Write tests for AgentDispatcher**

```typescript
// src/agents/AgentDispatcher.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentDispatcher } from './AgentDispatcher';
import { AgentTask } from './types';

describe('AgentDispatcher', () => {
  let dispatcher: AgentDispatcher;

  beforeEach(() => {
    dispatcher = new AgentDispatcher();
  });

  it('should dispatch research task to AgenticSeekAgent', async () => {
    const task: AgentTask = {
      id: 'test-1',
      type: 'research',
      description: 'Research web frameworks',
      config: {}
    };

    const result = await dispatcher.dispatchTask(task);
    expect(result.taskId).toBe('test-1');
  });
});
```

**Step 6: Commit agent dispatcher**

```bash
git add anavi/scripts/autonomous-dev/src/agents/
git commit -m "feat: agent dispatcher with factory pattern and stub agents"
```

---

## Task 5: AgenticSeek Integration

**Files:**
- Create: `anavi/scripts/autonomous-dev/src/integrations/AgenticSeekClient.ts`
- Create: `anavi/scripts/autonomous-dev/src/agents/AgenticSeekAgent.ts` (update)
- Create: `anavi/scripts/autonomous-dev/config/agenticseek.yaml`

**Step 1: Create AgenticSeek API client**

```typescript
// src/integrations/AgenticSeekClient.ts
import axios from 'axios';

export interface AgenticSeekTask {
  query: string;
  max_results?: number;
  timeout_ms?: number;
}

export interface AgenticSeekResult {
  success: boolean;
  data: any[];
  error?: string;
  metadata: {
    sources: string[];
    processing_time_ms: number;
  };
}

export class AgenticSeekClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.AGENTICSEEK_URL || 'http://localhost:7777') {
    this.baseUrl = baseUrl;
  }

  async research(query: string, options: Partial<AgenticSeekTask> = {}): Promise<AgenticSeekResult> {
    try {
      const task: AgenticSeekTask = {
        query,
        max_results: options.max_results || 10,
        timeout_ms: options.timeout_ms || 30000
      };

      const response = await axios.post(`${this.baseUrl}/api/research`, task, {
        timeout: 60000
      });

      return {
        success: true,
        data: response.data.results || [],
        metadata: {
          sources: response.data.sources || [],
          processing_time_ms: response.data.processing_time_ms || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { sources: [], processing_time_ms: 0 }
      };
    }
  }

  async browse(url: string): Promise<AgenticSeekResult> {
    // Similar implementation for web browsing
  }
}
```

**Step 2: Update AgenticSeekAgent to use real client**

```typescript
// src/agents/AgenticSeekAgent.ts
import { Agent, AgentTask, AgentResult } from './types';
import { AgenticSeekClient } from '../integrations/AgenticSeekClient';

export class AgenticSeekAgent implements Agent {
  private client: AgenticSeekClient;

  constructor() {
    this.client = new AgenticSeekClient();
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    try {
      const result = await this.client.research(task.description, task.config);

      if (!result.success) {
        return {
          taskId: task.id,
          success: false,
          error: result.error,
          metadata: result.metadata
        };
      }

      return {
        taskId: task.id,
        success: true,
        output: JSON.stringify(result.data, null, 2),
        metadata: {
          ...result.metadata,
          agent: 'agenticseek',
          results_count: result.data.length
        }
      };
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async cancel(): Promise<void> {
    // AgenticSeek doesn't support cancellation via API
  }
}
```

**Step 3: Create configuration file**

```yaml
# config/agenticseek.yaml
defaults:
  max_results: 10
  timeout_ms: 30000
  include_sources: true

research_templates:
  technology_analysis: "Analyze {technology} for {use_case}. Include pros/cons, alternatives, and implementation considerations."
  market_research: "Research {market} trends, key players, and opportunities for {product_type}."

fallback_local_llm:
  enabled: true
  model: "llama3"
  temperature: 0.7
```

**Step 4: Write integration tests**

```typescript
// src/integrations/AgenticSeekClient.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgenticSeekClient } from './AgenticSeekClient';
import axios from 'axios';

vi.mock('axios');

describe('AgenticSeekClient', () => {
  let client: AgenticSeekClient;

  beforeEach(() => {
    client = new AgenticSeekClient('http://localhost:7777');
  });

  it('should make research request to AgenticSeek API', async () => {
    const mockResponse = {
      data: {
        results: [{ title: 'Test Result', content: 'Test content' }],
        sources: ['https://example.com'],
        processing_time_ms: 1500
      }
    };
    vi.mocked(axios.post).mockResolvedValue(mockResponse);

    const result = await client.research('test query');
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });
});
```

**Step 5: Commit AgenticSeek integration**

```bash
git add anavi/scripts/autonomous-dev/src/integrations/AgenticSeekClient.ts anavi/scripts/autonomous-dev/src/agents/AgenticSeekAgent.ts anavi/scripts/autonomous-dev/config/
git commit -m "feat: AgenticSeek API client integration"
```

---

## Task 6: DeepSeek Swarm Controller

**Files:**
- Create: `anavi/scripts/autonomous-dev/src/integrations/DeepSeekSwarmController.ts`
- Create: `anavi/scripts/autonomous-dev/src/agents/DeepSeekAgent.ts` (update)
- Modify: `../../../scripts/ds-swarm.py` (add orchestration support)

**Step 1: Create Python wrapper for DeepSeek swarm**

```python
# anavi/scripts/autonomous-dev/python/deepseek_orchestrator.py
import subprocess
import json
import tempfile
import os
from typing import List, Dict, Any
import sys

class DeepSeekOrchestrator:
    def __init__(self, api_key: str = None, model: str = "deepseek-chat"):
        self.api_key = api_key or os.getenv('DEEPSEEK_API_KEY')
        self.model = model
        self.swarm_script = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'scripts', 'ds-swarm.py'
        )

    def execute_swarm(self, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Execute multiple tasks using ds-swarm.py"""

        # Create temporary tasks file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(tasks, f, indent=2)
            tasks_file = f.name

        try:
            # Build command
            cmd = [
                sys.executable, self.swarm_script,
                tasks_file,
                '--model', self.model
            ]

            if self.api_key:
                env = os.environ.copy()
                env['DEEPSEEK_API_KEY'] = self.api_key
            else:
                env = os.environ.copy()

            # Execute swarm
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes timeout
            )

            # Parse results
            return {
                'success': result.returncode == 0,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode
            }

        finally:
            # Clean up temporary file
            if os.path.exists(tasks_file):
                os.unlink(tasks_file)

    def execute_single_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute single task using ds-agent.py"""
        # Similar implementation for single tasks
        pass
```

**Step 2: Create TypeScript controller**

```typescript
// src/integrations/DeepSeekSwarmController.ts
import { spawn } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export interface DeepSeekTask {
  name: string;
  task: string;
  files?: string[];
  constraints?: string[];
}

export interface DeepSeekResult {
  taskId: string;
  success: boolean;
  output?: string;
  error?: string;
  fileChanges?: Record<string, string>;
}

export class DeepSeekSwarmController {
  constructor(
    private apiKey: string = process.env.DEEPSEEK_API_KEY || '',
    private model: string = 'deepseek-chat'
  ) {}

  async executeSwarm(tasks: DeepSeekTask[]): Promise<DeepSeekResult[]> {
    const tempFile = join(tmpdir(), `deepseek-swarm-${Date.now()}.json`);

    try {
      // Write tasks to temp file
      await writeFile(tempFile, JSON.stringify(tasks, null, 2));

      // Execute swarm script
      const pythonScript = join(__dirname, '../../../../../scripts/ds-swarm.py');

      const child = spawn('python3', [
        pythonScript,
        tempFile,
        '--model', this.model
      ], {
        env: { ...process.env, DEEPSEEK_API_KEY: this.apiKey },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const exitCode = await new Promise<number>((resolve) => {
        child.on('close', resolve);
      });

      // Parse results from output files
      const results: DeepSeekResult[] = [];
      for (const task of tasks) {
        const resultFile = `/tmp/ds-swarm-${task.name}.txt`;
        try {
          const output = await readFile(resultFile, 'utf-8');
          results.push({
            taskId: task.name,
            success: !output.includes('ERROR') && !output.includes('FAILED'),
            output,
            fileChanges: this.extractFileChanges(output)
          });
        } catch {
          results.push({
            taskId: task.name,
            success: false,
            error: 'No output file found'
          });
        }
      }

      return results;

    } finally {
      // Clean up temp file
      try {
        await promisify(require('fs').unlink)(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  private extractFileChanges(output: string): Record<string, string> {
    // Parse file changes from swarm output
    const changes: Record<string, string> = {};
    // Implementation to extract changed files
    return changes;
  }
}
```

**Step 3: Update DeepSeekAgent to use controller**

```typescript
// src/agents/DeepSeekAgent.ts
import { Agent, AgentTask, AgentResult } from './types';
import { DeepSeekSwarmController, DeepSeekTask } from '../integrations/DeepSeekSwarmController';

export class DeepSeekAgent implements Agent {
  private controller: DeepSeekSwarmController;

  constructor() {
    this.controller = new DeepSeekSwarmController();
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const deepSeekTask: DeepSeekTask = {
      name: task.id,
      task: task.description,
      constraints: task.config?.constraints || []
    };

    const results = await this.controller.executeSwarm([deepSeekTask]);
    const result = results[0];

    return {
      taskId: task.id,
      success: result.success,
      output: result.output,
      error: result.error,
      metadata: {
        agent: 'deepseek',
        model: this.controller['model'],
        fileChanges: result.fileChanges
      }
    };
  }

  async cancel(): Promise<void> {
    // DeepSeek swarm doesn't support cancellation
  }
}
```

**Step 4: Add orchestration support to ds-swarm.py**

```python
# In ../../../scripts/ds-swarm.py, add:
# if __name__ == "__main__":
#     # Existing code
#
#     # Add orchestration mode
#     if '--orchestration' in sys.argv:
#         print(json.dumps({"status": "ready", "version": "1.0.0"}))
```

**Step 5: Write tests for swarm controller**

```typescript
// src/integrations/DeepSeekSwarmController.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeepSeekSwarmController } from './DeepSeekSwarmController';
import { spawn } from 'child_process';
import { readFile, writeFile } from 'fs/promises';

vi.mock('child_process');
vi.mock('fs/promises');

describe('DeepSeekSwarmController', () => {
  let controller: DeepSeekSwarmController;

  beforeEach(() => {
    controller = new DeepSeekSwarmController('test-key', 'deepseek-chat');
  });

  it('should execute swarm with tasks', async () => {
    const mockSpawn = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event, callback) => {
        if (event === 'close') setTimeout(() => callback(0), 10);
      })
    };
    vi.mocked(spawn).mockReturnValue(mockSpawn as any);
    vi.mocked(readFile).mockResolvedValue('Task completed successfully');

    const tasks = [{ name: 'test-task', task: 'Fix TypeScript errors' }];
    const results = await controller.executeSwarm(tasks);

    expect(results).toHaveLength(1);
    expect(results[0].taskId).toBe('test-task');
  });
});
```

**Step 6: Commit DeepSeek integration**

```bash
git add anavi/scripts/autonomous-dev/src/integrations/DeepSeekSwarmController.ts anavi/scripts/autonomous-dev/src/agents/DeepSeekAgent.ts anavi/scripts/autonomous-dev/python/ ../../../scripts/ds-swarm.py
git commit -m "feat: DeepSeek swarm controller integration"
```

---

## Task 7: ANAVI Rule Enforcer

**Files:**
- Create: `anavi/scripts/autonomous-dev/src/validation/AnaviRuleEnforcer.ts`
- Create: `anavi/scripts/autonomous-dev/src/validation/rules/`
- Create: `anavi/scripts/autonomous-dev/src/agents/AnaviValidationAgent.ts` (update)

**Step 1: Create base rule interface**

```typescript
// src/validation/Rule.ts
export interface ValidationRule {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  validate(context: ValidationContext): Promise<ValidationResult>;
}

export interface ValidationContext {
  specPath: string;
  workingDir: string;
  changes: FileChange[];
}

export interface ValidationResult {
  rule: string;
  passed: boolean;
  message: string;
  details?: any;
  suggestions?: string[];
}

export interface FileChange {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  content?: string;
}
```

**Step 2: Implement ANAVI-specific rules**

```typescript
// src/validation/rules/RepositoryConventionRule.ts
import { ValidationRule, ValidationContext, ValidationResult } from '../Rule';

export class RepositoryConventionRule implements ValidationRule {
  name = 'repository-convention';
  description = 'Check compliance with AGENTS.md and CLAUDE.md conventions';
  severity = 'error';

  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: string[] = [];

    // Check if changes are in correct directories
    for (const change of context.changes) {
      if (change.path.startsWith('anavi/')) {
        // Validate path conventions
        if (change.path.includes('/server/routers/') && !change.path.endsWith('.ts')) {
          issues.push(`Router file must be TypeScript: ${change.path}`);
        }
      }
    }

    return {
      rule: this.name,
      passed: issues.length === 0,
      message: issues.length === 0
        ? 'All changes follow repository conventions'
        : `Found ${issues.length} convention violations`,
      details: issues,
      suggestions: issues.map(issue => `Fix: ${issue}`)
    };
  }
}

// Similar implementations for:
// - DocumentationHygieneRule
// - TestCoverageRule
// - BuildValidationRule
// - TypeScriptValidationRule
```

**Step 3: Create ANAVI Rule Enforcer**

```typescript
// src/validation/AnaviRuleEnforcer.ts
import { ValidationRule, ValidationContext, ValidationResult } from './Rule';
import { RepositoryConventionRule } from './rules/RepositoryConventionRule';
import { DocumentationHygieneRule } from './rules/DocumentationHygieneRule';
import { TestCoverageRule } from './rules/TestCoverageRule';
import { BuildValidationRule } from './rules/BuildValidationRule';
import { TypeScriptValidationRule } from './rules/TypeScriptValidationRule';

export class AnaviRuleEnforcer {
  private rules: ValidationRule[];

  constructor() {
    this.rules = [
      new RepositoryConventionRule(),
      new DocumentationHygieneRule(),
      new TestCoverageRule(),
      new BuildValidationRule(),
      new TypeScriptValidationRule()
    ];
  }

  async validate(context: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const rule of this.rules) {
      try {
        const result = await rule.validate(context);
        results.push(result);
      } catch (error) {
        results.push({
          rule: rule.name,
          passed: false,
          message: `Rule validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { error }
        });
      }
    }

    return results;
  }

  hasCriticalErrors(results: ValidationResult[]): boolean {
    return results.some(result =>
      !result.passed && result.ruleSeverity === 'error'
    );
  }
}
```

**Step 4: Update ANAVI Validation Agent**

```typescript
// src/agents/AnaviValidationAgent.ts
import { Agent, AgentTask, AgentResult } from './types';
import { AnaviRuleEnforcer } from '../validation/AnaviRuleEnforcer';
import { ValidationContext } from '../validation/Rule';

export class AnaviValidationAgent implements Agent {
  private enforcer: AnaviRuleEnforcer;

  constructor() {
    this.enforcer = new AnaviRuleEnforcer();
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    // Extract validation context from task
    const context: ValidationContext = {
      specPath: task.config?.specPath || '',
      workingDir: task.config?.workingDir || process.cwd(),
      changes: task.config?.changes || []
    };

    const results = await this.enforcer.validate(context);
    const hasErrors = this.enforcer.hasCriticalErrors(results);

    return {
      taskId: task.id,
      success: !hasErrors,
      output: JSON.stringify(results, null, 2),
      metadata: {
        agent: 'anavi',
        totalRules: results.length,
        passedRules: results.filter(r => r.passed).length,
        failedRules: results.filter(r => !r.passed).length
      }
    };
  }

  async cancel(): Promise<void> {
    // Validation is quick, no cancellation needed
  }
}
```

**Step 5: Implement BuildValidationRule (example)**

```typescript
// src/validation/rules/BuildValidationRule.ts
import { ValidationRule, ValidationContext, ValidationResult } from '../Rule';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class BuildValidationRule implements ValidationRule {
  name = 'build-validation';
  description = 'Run pnpm check and pnpm test to validate changes';
  severity = 'error';

  async validate(context: ValidationContext): Promise<ValidationResult> {
    try {
      // Run pnpm check
      const checkResult = await execAsync('pnpm check', {
        cwd: context.workingDir,
        timeout: 120000
      });

      // Run pnpm test
      const testResult = await execAsync('pnpm test', {
        cwd: context.workingDir,
        timeout: 180000
      });

      return {
        rule: this.name,
        passed: true,
        message: 'Build and tests passed successfully',
        details: {
          checkOutput: checkResult.stdout,
          testOutput: testResult.stdout
        }
      };

    } catch (error) {
      return {
        rule: this.name,
        passed: false,
        message: 'Build or tests failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}
```

**Step 6: Write tests for rule enforcer**

```typescript
// src/validation/AnaviRuleEnforcer.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnaviRuleEnforcer } from './AnaviRuleEnforcer';
import { ValidationContext } from './Rule';

describe('AnaviRuleEnforcer', () => {
  let enforcer: AnaviRuleEnforcer;
  let context: ValidationContext;

  beforeEach(() => {
    enforcer = new AnaviRuleEnforcer();
    context = {
      specPath: '/fake/spec.md',
      workingDir: '/fake/dir',
      changes: []
    };
  });

  it('should validate with all rules', async () => {
    const results = await enforcer.validate(context);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => typeof r.passed === 'boolean')).toBe(true);
  });
});
```

**Step 7: Commit ANAVI rule enforcer**

```bash
git add anavi/scripts/autonomous-dev/src/validation/ anavi/scripts/autonomous-dev/src/agents/AnaviValidationAgent.ts
git commit -m "feat: ANAVI rule enforcer with validation rules"
```

---

## Task 8: PRD Generator

**Files:**
- Create: `anavi/scripts/autonomous-dev/src/prd/PrdGenerator.ts`
- Create: `anavi/scripts/autonomous-dev/src/prd/templates/`
- Create: `anavi/scripts/autonomous-dev/src/agents/PrdGeneratorAgent.ts` (update)
- Create: `anavi/scripts/autonomous-dev/config/prd-templates.yaml`

**Step 1: Create PRD template system**

```typescript
// src/prd/PrdTemplate.ts
export interface PrdTemplate {
  name: string;
  description: string;
  sections: PrdSection[];
  variables: Record<string, string>;
}

export interface PrdSection {
  title: string;
  template: string;
  required: boolean;
  variables: string[];
}

export interface PrdData {
  title: string;
  description: string;
  requirements: string[];
  acceptanceCriteria: string[];
  researchFindings: Record<string, any>[];
  technicalSpecifications: Record<string, any>;
  timeline?: string;
  dependencies?: string[];
}
```

**Step 2: Create PRD Generator**

```typescript
// src/prd/PrdGenerator.ts
import { PrdTemplate, PrdData, PrdSection } from './PrdTemplate';
import { readFile } from 'fs/promises';
import { join } from 'path';

export class PrdGenerator {
  private templates: Map<string, PrdTemplate> = new Map();

  async loadTemplates(templateDir: string): Promise<void> {
    // Load templates from directory
    const templateFiles = [
      'anavi-feature.md',
      'refactoring.md',
      'tooling.md',
      'general.md'
    ];

    for (const file of templateFiles) {
      const templatePath = join(templateDir, file);
      try {
        const content = await readFile(templatePath, 'utf-8');
        const template = this.parseTemplate(content, file);
        this.templates.set(template.name, template);
      } catch (error) {
        console.warn(`Failed to load template ${file}:`, error);
      }
    }
  }

  private parseTemplate(content: string, filename: string): PrdTemplate {
    // Parse template with frontmatter
    const lines = content.split('\n');
    const sections: PrdSection[] = [];
    let currentSection: PrdSection | null = null;

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.substring(3).trim(),
          template: '',
          required: true,
          variables: []
        };
      } else if (currentSection) {
        currentSection.template += line + '\n';
        // Extract variables like {{variable}}
        const variableMatches = line.match(/\{\{(\w+)\}\}/g);
        if (variableMatches) {
          currentSection.variables.push(...variableMatches.map(v => v.slice(2, -2)));
        }
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return {
      name: filename.replace('.md', ''),
      description: `Template for ${filename}`,
      sections,
      variables: {}
    };
  }

  async generatePrd(templateName: string, data: PrdData): Promise<string> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    let prd = `# ${data.title}\n\n`;
    prd += `*Generated: ${new Date().toISOString()}*\n\n`;

    for (const section of template.sections) {
      prd += `## ${section.title}\n\n`;

      let sectionContent = section.template;

      // Replace variables
      for (const variable of section.variables) {
        if (data[variable as keyof PrdData]) {
          const value = data[variable as keyof PrdData];
          sectionContent = sectionContent.replace(
            new RegExp(`\\{\\{${variable}\\}\\}`, 'g'),
            typeof value === 'string' ? value : JSON.stringify(value, null, 2)
          );
        }
      }

      prd += sectionContent + '\n\n';
    }

    return prd;
  }
}
```

**Step 3: Create ANAVI feature template**

```markdown
# {{title}}

*Date: {{date}}*
*Status: Draft*
*Owner: {{owner}}*

## Overview
{{description}}

## Goals
1. {{goal1}}
2. {{goal2}}
3. {{goal3}}

## Requirements
{{requirements}}

## ANAVI Terminology Alignment
- **Relationship Custody**: {{relationship_custody_impact}}
- **Trust Score**: {{trust_score_impact}}
- **Blind Matching**: {{blind_matching_impact}}
- **Deal Room**: {{deal_room_impact}}
- **Attribution**: {{attribution_impact}}
- **Intent**: {{intent_impact}}

## Technical Specifications
{{technical_specifications}}

## Acceptance Criteria
{{acceptance_criteria}}

## Research Findings
{{research_findings}}

## Implementation Plan
{{implementation_plan}}

## Testing Strategy
{{testing_strategy}}

## Documentation Updates
- [ ] Update `anavi/docs/plans/README.md`
- [ ] Update `anavi/docs/ops/TODO_BOARD.md`
- [ ] Update `anavi/docs/ops/ENGINEERING_MEMORY.md`

## Dependencies
{{dependencies}}
```

**Step 4: Update PRD Generator Agent**

```typescript
// src/agents/PrdGeneratorAgent.ts
import { Agent, AgentTask, AgentResult } from './types';
import { PrdGenerator } from '../prd/PrdGenerator';
import { PrdData } from '../prd/PrdTemplate';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export class PrdGeneratorAgent implements Agent {
  private generator: PrdGenerator;

  constructor() {
    this.generator = new PrdGenerator();
    // Load templates
    this.generator.loadTemplates(join(__dirname, '../../config/prd-templates'));
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    try {
      // Extract PRD data from task
      const prdData: PrdData = {
        title: task.config?.title || `PRD for ${task.id}`,
        description: task.description,
        requirements: task.config?.requirements || [],
        acceptanceCriteria: task.config?.acceptanceCriteria || [],
        researchFindings: task.config?.researchFindings || [],
        technicalSpecifications: task.config?.technicalSpecifications || {},
        timeline: task.config?.timeline,
        dependencies: task.config?.dependencies
      };

      // Generate PRD
      const templateName = task.config?.template || 'anavi-feature';
      const prdContent = await this.generator.generatePrd(templateName, prdData);

      // Save to file
      const outputPath = join(
        task.config?.outputDir || process.cwd(),
        `prd-${Date.now()}.md`
      );
      await writeFile(outputPath, prdContent, 'utf-8');

      return {
        taskId: task.id,
        success: true,
        output: prdContent,
        metadata: {
          agent: 'prd-generator',
          template: templateName,
          outputPath,
          sections: prdContent.split('## ').length - 1
        }
      };

    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async cancel(): Promise<void> {
    // PRD generation is quick, no cancellation needed
  }
}
```

**Step 5: Create configuration for templates**

```yaml
# config/prd-templates.yaml
default_template: anavi-feature

templates:
  anavi-feature:
    path: templates/anavi-feature.md
    description: Standard ANAVI feature PRD with terminology alignment
    required_variables: [title, description, requirements]

  refactoring:
    path: templates/refactoring.md
    description: Refactoring and cleanup PRD
    required_variables: [title, scope, impacted_files]

  tooling:
    path: templates/tooling.md
    description: Development tooling and infrastructure PRD
    required_variables: [title, purpose, integration_points]

output:
  directory: generated-prds
  format: markdown
  include_timestamp: true
  auto_commit: true
```

**Step 6: Write tests for PRD generator**

```typescript
// src/prd/PrdGenerator.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrdGenerator } from './PrdGenerator';
import { PrdData } from './PrdTemplate';
import { readFile } from 'fs/promises';

vi.mock('fs/promises');

describe('PrdGenerator', () => {
  let generator: PrdGenerator;
  let testData: PrdData;

  beforeEach(() => {
    generator = new PrdGenerator();
    testData = {
      title: 'Test Feature',
      description: 'Test description',
      requirements: ['Req 1', 'Req 2'],
      acceptanceCriteria: ['AC 1', 'AC 2'],
      researchFindings: [],
      technicalSpecifications: {}
    };
  });

  it('should generate PRD with title', async () => {
    vi.mocked(readFile).mockResolvedValue('# {{title}}\n\n{{description}}');

    await generator.loadTemplates('/fake/templates');
    const prd = await generator.generatePrd('test', testData);

    expect(prd).toContain('# Test Feature');
    expect(prd).toContain('Test description');
  });
});
```

**Step 7: Commit PRD generator**

```bash
git add anavi/scripts/autonomous-dev/src/prd/ anavi/scripts/autonomous-dev/src/agents/PrdGeneratorAgent.ts anavi/scripts/autonomous-dev/config/prd-templates.yaml
git commit -m "feat: PRD generator with templating system"
```

---

## Task 9: State Manager

**Files:**
- Create: `anavi/scripts/autonomous-dev/src/state/StateManager.ts`
- Create: `anavi/scripts/autonomous-dev/src/state/RedisStateManager.ts`
- Create: `anavi/scripts/autonomous-dev/src/state/FileStateManager.ts`
- Create: `anavi/scripts/autonomous-dev/config/state.yaml`

**Step 1: Create state management interface**

```typescript
// src/state/StateManager.ts
export interface StateManager {
  saveWaveProgress(waveId: string, progress: WaveProgress): Promise<void>;
  getWaveProgress(waveId: string): Promise<WaveProgress | null>;
  deleteWaveProgress(waveId: string): Promise<void>;

  saveAgentResult(taskId: string, result: AgentResult): Promise<void>;
  getAgentResult(taskId: string): Promise<AgentResult | null>;

  savePrd(prdId: string, content: string): Promise<void>;
  getPrd(prdId: string): Promise<string | null>;

  listActiveWaves(): Promise<string[]>;
  cleanupOldStates(daysOld: number): Promise<void>;
}

export interface WaveProgress {
  waveId: string;
  pattern: string;
  tasks: any[];
  completed: string[];
  failed: string[];
  startedAt: Date;
  finishedAt?: Date;
  metadata?: Record<string, any>;
}
```

**Step 2: Implement Redis state manager**

```typescript
// src/state/RedisStateManager.ts
import { createClient, RedisClientType } from 'redis';
import { StateManager, WaveProgress } from './StateManager';
import { AgentResult } from '../agents/types';

export class RedisStateManager implements StateManager {
  private client: RedisClientType;

  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.client = createClient({ url: redisUrl });
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async saveWaveProgress(waveId: string, progress: WaveProgress): Promise<void> {
    await this.connect();
    const key = `wave:${waveId}`;
    await this.client.set(key, JSON.stringify(progress));
    await this.client.expire(key, 86400); // 24 hours TTL
  }

  async getWaveProgress(waveId: string): Promise<WaveProgress | null> {
    await this.connect();
    const data = await this.client.get(`wave:${waveId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteWaveProgress(waveId: string): Promise<void> {
    await this.connect();
    await this.client.del(`wave:${waveId}`);
  }

  async saveAgentResult(taskId: string, result: AgentResult): Promise<void> {
    await this.connect();
    const key = `agent:${taskId}`;
    await this.client.set(key, JSON.stringify(result));
    await this.client.expire(key, 86400);
  }

  async getAgentResult(taskId: string): Promise<AgentResult | null> {
    await this.connect();
    const data = await this.client.get(`agent:${taskId}`);
    return data ? JSON.parse(data) : null;
  }

  async savePrd(prdId: string, content: string): Promise<void> {
    await this.connect();
    const key = `prd:${prdId}`;
    await this.client.set(key, content);
    // PRDs have longer TTL - 7 days
    await this.client.expire(key, 604800);
  }

  async getPrd(prdId: string): Promise<string | null> {
    await this.connect();
    return await this.client.get(`prd:${prdId}`);
  }

  async listActiveWaves(): Promise<string[]> {
    await this.connect();
    const keys = await this.client.keys('wave:*');
    return keys.map(key => key.substring(5)); // Remove 'wave:' prefix
  }

  async cleanupOldStates(daysOld: number): Promise<void> {
    await this.connect();
    // Implementation would scan and delete old keys
  }
}
```

**Step 3: Implement file-based state manager (fallback)**

```typescript
// src/state/FileStateManager.ts
import { StateManager, WaveProgress } from './StateManager';
import { AgentResult } from '../agents/types';
import {
  mkdir, readFile, writeFile, unlink, readdir
} from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export class FileStateManager implements StateManager {
  private baseDir: string;

  constructor(baseDir: string = join(process.cwd(), '.autonomous-state')) {
    this.baseDir = baseDir;
    this.ensureDir();
  }

  private async ensureDir(): Promise<void> {
    if (!existsSync(this.baseDir)) {
      await mkdir(this.baseDir, { recursive: true });
    }
    for (const subdir of ['waves', 'agents', 'prds']) {
      const path = join(this.baseDir, subdir);
      if (!existsSync(path)) {
        await mkdir(path, { recursive: true });
      }
    }
  }

  private getWavePath(waveId: string): string {
    return join(this.baseDir, 'waves', `${waveId}.json`);
  }

  private getAgentPath(taskId: string): string {
    return join(this.baseDir, 'agents', `${taskId}.json`);
  }

  private getPrdPath(prdId: string): string {
    return join(this.baseDir, 'prds', `${prdId}.md`);
  }

  async saveWaveProgress(waveId: string, progress: WaveProgress): Promise<void> {
    const path = this.getWavePath(waveId);
    await writeFile(path, JSON.stringify(progress, null, 2), 'utf-8');
  }

  async getWaveProgress(waveId: string): Promise<WaveProgress | null> {
    const path = this.getWavePath(waveId);
    try {
      const data = await readFile(path, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async deleteWaveProgress(waveId: string): Promise<void> {
    const path = this.getWavePath(waveId);
    try {
      await unlink(path);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  async saveAgentResult(taskId: string, result: AgentResult): Promise<void> {
    const path = this.getAgentPath(taskId);
    await writeFile(path, JSON.stringify(result, null, 2), 'utf-8');
  }

  async getAgentResult(taskId: string): Promise<AgentResult | null> {
    const path = this.getAgentPath(taskId);
    try {
      const data = await readFile(path, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async savePrd(prdId: string, content: string): Promise<void> {
    const path = this.getPrdPath(prdId);
    await writeFile(path, content, 'utf-8');
  }

  async getPrd(prdId: string): Promise<string | null> {
    const path = this.getPrdPath(prdId);
    try {
      return await readFile(path, 'utf-8');
    } catch {
      return null;
    }
  }

  async listActiveWaves(): Promise<string[]> {
    const wavesDir = join(this.baseDir, 'waves');
    try {
      const files = await readdir(wavesDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch {
      return [];
    }
  }

  async cleanupOldStates(daysOld: number): Promise<void> {
    // Implementation would check file modification times
  }
}
```

**Step 4: Create state manager factory**

```typescript
// src/state/index.ts
import { StateManager } from './StateManager';
import { RedisStateManager } from './RedisStateManager';
import { FileStateManager } from './FileStateManager';

export class StateManagerFactory {
  static createStateManager(): StateManager {
    const useRedis = process.env.USE_REDIS === 'true' && process.env.REDIS_URL;

    if (useRedis) {
      return new RedisStateManager(process.env.REDIS_URL);
    } else {
      return new FileStateManager();
    }
  }
}
```

**Step 5: Create state configuration**

```yaml
# config/state.yaml
storage:
  # Primary storage (redis recommended for production)
  primary: redis
  fallback: file

redis:
  url: ${REDIS_URL:-redis://localhost:6379}
  ttl:
    waves: 86400    # 24 hours
    agents: 86400   # 24 hours
    prds: 604800    # 7 days

file:
  directory: .autonomous-state
  cleanup:
    enabled: true
    keep_days: 7

backup:
  enabled: true
  interval_hours: 24
  backup_dir: .autonomous-backups
```

**Step 6: Integrate state manager with wave orchestrator**

```typescript
// Update WaveOrchestrator.ts to use StateManager
import { StateManagerFactory } from '../state';

export class WaveOrchestrator {
  private stateManager: StateManager;

  constructor(private config: WaveConfig) {
    this.initializeExecutors();
    this.stateManager = StateManagerFactory.createStateManager();
  }

  async executeWave(tasks: WaveTask[]): Promise<WaveProgress> {
    const waveId = `wave_${Date.now()}`;
    const progress: WaveProgress = {
      waveId,
      pattern: this.config.pattern,
      tasks,
      completed: [],
      failed: [],
      startedAt: new Date()
    };

    // Save initial state
    await this.stateManager.saveWaveProgress(waveId, progress);

    const executor = this.waveExecutors.get(this.config.pattern);
    if (!executor) {
      throw new Error(`Unsupported wave pattern: ${this.config.pattern}`);
    }

    const result = await executor.execute(tasks);

    // Update and save final state
    result.waveId = waveId;
    result.finishedAt = new Date();
    await this.stateManager.saveWaveProgress(waveId, result);

    return result;
  }
}
```

**Step 7: Write tests for state management**

```typescript
// src/state/FileStateManager.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileStateManager } from './FileStateManager';
import { WaveProgress } from './StateManager';
import { AgentResult } from '../agents/types';
import { existsSync, mkdir, writeFile, readFile, unlink } from 'fs/promises';

vi.mock('fs/promises');
vi.mock('fs');

describe('FileStateManager', () => {
  let manager: FileStateManager;
  const testBaseDir = '/test/state';

  beforeEach(() => {
    vi.mocked(existsSync).mockReturnValue(false);
    manager = new FileStateManager(testBaseDir);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should save and retrieve wave progress', async () => {
    const waveProgress: WaveProgress = {
      waveId: 'test-wave',
      pattern: 'sequential',
      tasks: [],
      completed: [],
      failed: [],
      startedAt: new Date()
    };

    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(waveProgress));

    await manager.saveWaveProgress('test-wave', waveProgress);
    const retrieved = await manager.getWaveProgress('test-wave');

    expect(retrieved).toEqual(waveProgress);
  });
});
```

**Step 8: Commit state manager**

```bash
git add anavi/scripts/autonomous-dev/src/state/ anavi/scripts/autonomous-dev/config/state.yaml anavi/scripts/autonomous-dev/src/core/WaveOrchestrator.ts
git commit -m "feat: state manager with Redis and file storage"
```

---

## Task 10: CLI and Main Entry Point

**Files:**
- Create: `anavi/scripts/autonomous-dev/src/cli.ts`
- Create: `anavi/scripts/autonomous-dev/src/index.ts`
- Create: `anavi/scripts/autonomous-dev/scripts/start.sh`
- Update: `package.json` (add CLI commands)

**Step 1: Create CLI using Commander.js**

```typescript
// src/cli.ts
import { Command } from 'commander';
import { WaveOrchestrator } from './core/WaveOrchestrator';
import { RalphIntegration } from './integrations/RalphIntegration';
import { SpecParser } from './integrations/SpecParser';
import { WaveConfig } from './core/types';

const program = new Command();

program
  .name('autonomous-dev')
  .description('Autonomous development system orchestrator')
  .version('1.0.0');

program
  .command('execute-spec')
  .description('Execute a spec using wave orchestration')
  .requiredOption('-s, --spec <path>', 'Path to spec file')
  .option('-p, --pattern <pattern>', 'Wave pattern (sequential|parallel|pipeline|dynamic)', 'sequential')
  .option('-c, --concurrent <number>', 'Max concurrent agents', '5')
  .action(async (options) => {
    const config: WaveConfig = {
      pattern: options.pattern as any,
      maxConcurrentAgents: parseInt(options.concurrent),
      timeoutMs: 300000,
      retryAttempts: 3
    };

    const orchestrator = new WaveOrchestrator(config);
    const specParser = new SpecParser();
    const integration = new RalphIntegration(orchestrator, specParser);

    try {
      await integration.executeSpec(options.spec, options.pattern);
      console.log('Spec execution completed successfully');
    } catch (error) {
      console.error('Spec execution failed:', error);
      process.exit(1);
    }
  });

program
  .command('generate-prd')
  .description('Generate a PRD from research findings')
  .requiredOption('-t, --title <title>', 'PRD title')
  .option('-d, --description <description>', 'PRD description')
  .option('-r, --research <path>', 'Path to research findings JSON')
  .option('-o, --output <path>', 'Output directory', './generated-prds')
  .action(async (options) => {
    // PRD generation logic
  });

program
  .command('validate')
  .description('Validate current state against ANAVI rules')
  .option('-s, --spec <path>', 'Spec file to validate against')
  .action(async (options) => {
    // Validation logic
  });

program
  .command('status')
  .description('Show status of active waves and agents')
  .action(async () => {
    // Status display logic
  });

program
  .command('cleanup')
  .description('Cleanup old state files')
  .option('-d, --days <days>', 'Days to keep', '7')
  .action(async (options) => {
    // Cleanup logic
  });

export { program };
```

**Step 2: Create main entry point**

```typescript
// src/index.ts
import { program } from './cli';

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
```

**Step 3: Create startup script**

```bash
#!/bin/bash
# scripts/start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

# Build if needed
if [ ! -d "$PROJECT_DIR/dist" ] || [ "$1" = "--build" ]; then
  echo "Building autonomous dev orchestrator..."
  cd "$PROJECT_DIR"
  npm run build
fi

# Run CLI
cd "$PROJECT_DIR"
node dist/index.js "$@"
```

**Step 4: Update package.json with scripts**

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "test": "vitest run",
    "start": "node dist/index.js",
    "cli": "node dist/index.js",
    "exec-spec": "node dist/index.js execute-spec",
    "gen-prd": "node dist/index.js generate-prd",
    "validate": "node dist/index.js validate",
    "status": "node dist/index.js status",
    "cleanup": "node dist/index.js cleanup"
  }
}
```

**Step 5: Create integration test script**

```typescript
// scripts/test-integration.ts
import { WaveOrchestrator } from './src/core/WaveOrchestrator';
import { WaveConfig, WaveTask } from './src/core/types';

async function testIntegration() {
  console.log('Testing autonomous dev system integration...');

  const config: WaveConfig = {
    pattern: 'sequential',
    maxConcurrentAgents: 1,
    timeoutMs: 30000,
    retryAttempts: 3
  };

  const tasks: WaveTask[] = [
    {
      id: 'test-research',
      type: 'research',
      description: 'Test research task',
      dependencies: [],
      agentType: 'agenticseek'
    },
    {
      id: 'test-coding',
      type: 'coding',
      description: 'Test coding task',
      dependencies: ['test-research'],
      agentType: 'deepseek'
    }
  ];

  const orchestrator = new WaveOrchestrator(config);

  try {
    const progress = await orchestrator.executeWave(tasks);
    console.log('Integration test completed:', {
      waveId: progress.waveId,
      completed: progress.completed.length,
      failed: progress.failed.length,
      duration: progress.finishedAt
        ? progress.finishedAt.getTime() - progress.startedAt.getTime()
        : 'incomplete'
    });
  } catch (error) {
    console.error('Integration test failed:', error);
    process.exit(1);
  }
}

testIntegration();
```

**Step 6: Create documentation**

```markdown
# Autonomous Development System CLI

## Installation
```bash
cd anavi/scripts/autonomous-dev
npm install
npm run build
```

## Usage

### Execute a spec with wave orchestration
```bash
npm run exec-spec -- --spec ../../../specs/000-dashboard-logical-integrity-and-relevance.md --pattern parallel
```

### Generate a PRD
```bash
npm run gen-prd -- --title "New Feature" --description "Feature description" --research research.json
```

### Validate against ANAVI rules
```bash
npm run validate -- --spec path/to/spec.md
```

### Show system status
```bash
npm run status
```

## Environment Variables
- `AGENTICSEEK_URL`: URL for AgenticSeek API (default: http://localhost:7777)
- `DEEPSEEK_API_KEY`: API key for DeepSeek swarm
- `REDIS_URL`: Redis connection URL for state management
- `USE_REDIS`: Set to 'true' to use Redis (default: file-based)
```

**Step 7: Write CLI tests**

```typescript
// src/cli.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { program } from './cli';

describe('CLI', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should have execute-spec command', () => {
    const command = program.commands.find(c => c.name() === 'execute-spec');
    expect(command).toBeDefined();
    expect(command?.description()).toContain('Execute a spec');
  });

  it('should have generate-prd command', () => {
    const command = program.commands.find(c => c.name() === 'generate-prd');
    expect(command).toBeDefined();
  });
});
```

**Step 8: Commit CLI and entry point**

```bash
git add anavi/scripts/autonomous-dev/src/cli.ts anavi/scripts/autonomous-dev/src/index.ts anavi/scripts/autonomous-dev/scripts/ anavi/scripts/autonomous-dev/package.json
git commit -m "feat: CLI interface and main entry point"
```

---

## Task 11: Integration and Final Assembly

**Files:**
- Create: `anavi/scripts/autonomous-dev/src/App.ts` (main application)
- Update: All component imports and exports
- Create: `anavi/scripts/autonomous-dev/README.md` (complete documentation)
- Update: Ralph scripts to use new system

**Step 1: Create main application class**

```typescript
// src/App.ts
import { WaveOrchestrator } from './core/WaveOrchestrator';
import { AgentDispatcher } from './agents/AgentDispatcher';
import { AnaviRuleEnforcer } from './validation/AnaviRuleEnforcer';
import { PrdGenerator } from './prd/PrdGenerator';
import { StateManagerFactory } from './state';
import { WaveConfig } from './core/types';

export class AutonomousDevApp {
  private orchestrator: WaveOrchestrator;
  private agentDispatcher: AgentDispatcher;
  private ruleEnforcer: AnaviRuleEnforcer;
  private prdGenerator: PrdGenerator;

  constructor(config: WaveConfig) {
    this.orchestrator = new WaveOrchestrator(config);
    this.agentDispatcher = new AgentDispatcher();
    this.ruleEnforcer = new AnaviRuleEnforcer();
    this.prdGenerator = new PrdGenerator();
  }

  async initialize(): Promise<void> {
    console.log('Initializing autonomous development system...');

    // Load PRD templates
    await this.prdGenerator.loadTemplates('./config/prd-templates');

    // Initialize state manager
    const stateManager = StateManagerFactory.createStateManager();

    console.log('System initialized successfully');
  }

  async executeFullPipeline(specPath: string): Promise<void> {
    console.log(`Executing full pipeline for spec: ${specPath}`);

    // 1. Parse spec and create tasks
    // 2. Execute wave orchestration
    // 3. Generate PRD from results
    // 4. Validate against ANAVI rules
    // 5. Report completion

    console.log('Pipeline execution completed');
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down autonomous development system...');
    // Cleanup resources
  }
}
```

**Step 2: Update index.ts to use App class**

```typescript
// Update src/index.ts
import { program } from './cli';
import { AutonomousDevApp } from './App';
import { WaveConfig } from './core/types';

async function main() {
  // Initialize app
  const config: WaveConfig = {
    pattern: 'sequential',
    maxConcurrentAgents: 5,
    timeoutMs: 300000,
    retryAttempts: 3
  };

  const app = new AutonomousDevApp(config);
  await app.initialize();

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await app.shutdown();
  }
}
```

**Step 3: Create comprehensive README**

```markdown
# Autonomous Development System

Synthesizes Ralph spec system, DeepSeek swarm, AgenticSeek research, and ANAVI validation rules into a layered orchestrator for autonomous development.

## Features
- **Configurable Wave Patterns**: Sequential, parallel, pipeline, and dynamic execution
- **Multi-Agent Integration**: Research (AgenticSeek), coding (DeepSeek), validation (ANAVI)
- **Automated PRD Generation**: Template-based Product Requirements Documents
- **State Management**: Redis or file-based progress tracking
- **ANAVI Rule Enforcement**: Repository convention validation and quality gates

## Architecture

```
┌─────────────────────────────────────────┐
│           Wave Orchestrator             │
├─────────────────────────────────────────┤
│            Ralph Integration            │
├─────────────────────────────────────────┤
│         Agent Dispatcher                │
├─────────────────────────────────────────┤
│  Research   │   Coding   │  Validation  │
│ (AgenticSeek│ (DeepSeek  │   (ANAVI     │
│   Browser)  │   Swarm)   │    Rules)    │
└─────────────────────────────────────────┘
│           PRD Generator                 │
└─────────────────────────────────────────┘
│          State Manager                  │
└─────────────────────────────────────────┘
```

## Installation

```bash
cd anavi/scripts/autonomous-dev
npm install
npm run build
```

## Configuration

1. Copy `.env.example` to `.env` and set your API keys:
   ```
   AGENTICSEEK_URL=http://localhost:7777
   DEEPSEEK_API_KEY=your_key_here
   REDIS_URL=redis://localhost:6379
   USE_REDIS=true
   ```

2. Configure wave patterns in `config/wave-patterns.yaml`

3. Add PRD templates to `config/prd-templates/`

## Usage with Ralph

Enable wave orchestration in Ralph scripts:

```bash
# In scripts/ralph-loop-codex.sh
export WAVE_ORCHESTRATION=true
./scripts/ralph-loop-codex.sh --spec specs/000-dashboard-logical-integrity-and-relevance.md
```

## Manual Execution

```bash
# Execute spec with parallel waves
npm run exec-spec -- --spec path/to/spec.md --pattern parallel

# Generate PRD
npm run gen-prd -- --title "Feature Name" --description "Description"

# Validate changes
npm run validate -- --spec path/to/spec.md

# Check system status
npm run status
```

## Development

```bash
# Run tests
npm test

# Development mode with hot reload
npm run dev

# Build for production
npm run build
```

## Integration Points

- **Ralph**: Enhanced to decompose specs and call wave orchestrator
- **DeepSeek**: Wrapped `ds-swarm.py` for parallel coding tasks
- **AgenticSeek**: API client for research and web browsing
- **ANAVI Rules**: Validation of repository conventions and quality gates

## Testing

Run the full test suite:
```bash
npm test
```

Run integration tests:
```bash
npm run test:integration
```

## Contributing

1. Follow ANAVI repository conventions (AGENTS.md, CLAUDE.md)
2. Write tests for new features
3. Update documentation
4. Create PRD for significant changes
```

**Step 4: Update Ralph scripts to integrate with new system**

```bash
# Update ../../../scripts/ralph-loop-codex.sh
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if wave orchestration is enabled
if [ "$WAVE_ORCHESTRATION" = "true" ]; then
  echo "=== Using Autonomous Development System (Wave Orchestration) ==="

  # Build autonomous dev system if needed
  if [ ! -f "$REPO_ROOT/anavi/scripts/autonomous-dev/dist/index.js" ]; then
    echo "Building autonomous dev orchestrator..."
    cd "$REPO_ROOT/anavi/scripts/autonomous-dev"
    npm run build
  fi

  # Execute spec with wave orchestration
  cd "$REPO_ROOT"
  node anavi/scripts/autonomous-dev/dist/index.js execute-spec \
    --spec "$1" \
    --pattern "${WAVE_PATTERN:-parallel}" \
    --concurrent "${MAX_AGENTS:-5}"
else
  # Original Ralph logic
  # ... existing code ...
fi
```

**Step 5: Create demo spec for testing**

```markdown
# Demo: Autonomous System Integration Test

## Goal
Test the autonomous development system integration with all components.

## Tasks
1. Research current autonomous development tools and patterns
2. Generate PRD for test feature
3. Implement simple test function
4. Validate implementation against ANAVI rules

## Acceptance Criteria
- [ ] Research task completes with findings
- [ ] PRD generated with proper structure
- [ ] Test function implemented correctly
- [ ] All ANAVI validation rules pass
- [ ] Completion signal emitted correctly

## Test Data
Use simple test function: `function add(a, b) { return a + b; }`

## Wave Pattern
Test all patterns: sequential, parallel, pipeline, dynamic
```

**Step 6: Run integration tests**

```bash
cd anavi/scripts/autonomous-dev
npm test
npm run build
node dist/index.js execute-spec --spec ../../../specs/demo-autonomous-test.md --pattern sequential
```

**Step 7: Update plans README**

```markdown
# Add to anavi/docs/plans/README.md under "Active / Current"

### Autonomous Development System
- `2026-03-13-autonomous-dev-system-design.md` - Architecture design for synthesizing Ralph, DeepSeek swarm, AgenticSeek, and ANAVI rules
- `2026-03-13-autonomous-dev-system-implementation.md` - Complete implementation plan with 11 tasks
```

**Step 8: Final commit of integrated system**

```bash
git add anavi/scripts/autonomous-dev/src/App.ts anavi/scripts/autonomous-dev/README.md ../../../scripts/ralph-loop-codex.sh anavi/docs/plans/README.md
git commit -m "feat: complete autonomous dev system integration with CLI, App class, and Ralph integration"
```

---

## Execution Options

Plan complete and saved to `anavi/docs/plans/2026-03-13-autonomous-dev-system-implementation.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**