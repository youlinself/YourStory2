import { generateId } from '../../utils'

export interface WorkflowScript {
  name: string
  description: string
  phases: WorkflowPhase[]
}

export interface WorkflowPhase {
  name: string
  description: string
  steps: WorkflowStep[]
}

export interface WorkflowStep {
  id: string
  type: 'agent' | 'tool' | 'condition' | 'parallel'
  config: Record<string, unknown>
  onError?: 'abort' | 'continue' | 'retry'
}

export interface WorkflowContext {
  sessionId: string
  variables: Record<string, unknown>
  signal?: AbortSignal
}

export interface WorkflowResult {
  success: boolean
  workflowId: string
  result?: unknown
  error?: string
}

export interface RunningWorkflow {
  id: string
  script: WorkflowScript
  context: WorkflowContext
  status: 'running' | 'completed' | 'failed' | 'force-terminated'
  abortController: AbortController
  startTime: number
}

export class WorkflowEngine {
  private scripts: Map<string, WorkflowScript> = new Map()
  private runningWorkflows: Map<string, RunningWorkflow> = new Map()

  registerScript(script: WorkflowScript): void {
    this.scripts.set(script.name, script)
  }

  getScript(name: string): WorkflowScript | undefined {
    return this.scripts.get(name)
  }

  getAllScriptNames(): string[] {
    return Array.from(this.scripts.keys())
  }

  async execute(scriptName: string, context: WorkflowContext): Promise<WorkflowResult> {
    const script = this.scripts.get(scriptName)
    if (!script) throw new Error(`Workflow script not found: ${scriptName}`)

    const workflowId = generateId()
    const abortController = new AbortController()

    const running: RunningWorkflow = {
      id: workflowId,
      script,
      context,
      status: 'running',
      abortController,
      startTime: Date.now()
    }
    this.runningWorkflows.set(workflowId, running)

    try {
      const result = await this.runScript(script, context, abortController.signal)
      running.status = 'completed'
      return { success: true, workflowId, result }
    } catch (error) {
      running.status = 'failed'
      return { success: false, workflowId, error: error instanceof Error ? error.message : String(error) }
    } finally {
      this.runningWorkflows.delete(workflowId)
    }
  }

  cancel(workflowId: string, gracePeriodMs: number = 5000): void {
    const running = this.runningWorkflows.get(workflowId)
    if (!running) return

    running.abortController.abort()

    setTimeout(() => {
      if (running.status === 'running') {
        running.status = 'force-terminated'
      }
    }, gracePeriodMs)
  }

  getRunningWorkflow(id: string): RunningWorkflow | undefined {
    return this.runningWorkflows.get(id)
  }

  getAllRunningWorkflows(): RunningWorkflow[] {
    return Array.from(this.runningWorkflows.values())
  }

  private async runScript(
    script: WorkflowScript,
    context: WorkflowContext,
    signal: AbortSignal
  ): Promise<unknown> {
    const results: unknown[] = []

    for (const phase of script.phases) {
      if (signal.aborted) throw new Error('Workflow cancelled')

      for (const step of phase.steps) {
        if (signal.aborted) throw new Error('Workflow cancelled')

        const stepResult = await this.executeStep(step, context, signal)
        results.push(stepResult)
      }
    }

    return results
  }

  private async executeStep(
    step: WorkflowStep,
    context: WorkflowContext,
    signal: AbortSignal
  ): Promise<unknown> {
    switch (step.type) {
      case 'agent':
        return this.executeAgentStep(step.config, signal)
      case 'tool':
        return this.executeToolStep(step.config, signal)
      case 'condition':
        return this.evaluateCondition(step.config, context)
      case 'parallel':
        return this.executeParallel(step.config, signal)
      default:
        throw new Error(`Unknown step type: ${step.type}`)
    }
  }

  private async executeAgentStep(
    config: Record<string, unknown>,
    signal: AbortSignal
  ): Promise<unknown> {
    if (signal.aborted) throw new Error('Workflow cancelled')
    return { type: 'agent', config, status: 'completed' }
  }

  private async executeToolStep(
    config: Record<string, unknown>,
    signal: AbortSignal
  ): Promise<unknown> {
    if (signal.aborted) throw new Error('Workflow cancelled')
    return { type: 'tool', config, status: 'completed' }
  }

  private evaluateCondition(
    config: Record<string, unknown>,
    context: WorkflowContext
  ): boolean {
    const condition = config.condition as string
    const variable = config.variable as string
    const expected = config.expected

    const actualValue = context.variables[variable]
    switch (condition) {
      case 'equals':
        return actualValue === expected
      case 'not_equals':
        return actualValue !== expected
      case 'exists':
        return actualValue !== undefined
      default:
        return false
    }
  }

  private async executeParallel(
    config: Record<string, unknown>,
    signal: AbortSignal
  ): Promise<unknown[]> {
    const steps = config.steps as WorkflowStep[]
    const promises = steps.map(step => this.executeStep(step, { sessionId: '', variables: {} }, signal))
    return Promise.all(promises)
  }
}
