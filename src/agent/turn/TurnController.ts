import type { ToolCallRecord } from '../session/types'

export type TurnEndReason =
  | 'completed'
  | 'tool_calls'
  | 'max_steps'
  | 'cancelled'
  | 'error'

export type StepEndReason =
  | 'tool_complete'
  | 'tool_error'
  | 'model_done'
  | 'interrupted'

export interface ModelRequest {
  messages: unknown[]
  tools?: unknown[]
  timestamp: number
}

export interface ModelResponse {
  content: string
  toolCalls?: ToolCallRecord[]
  usage?: {
    inputTokens: number
    outputTokens: number
  }
  timestamp: number
}

export interface Step {
  number: number
  turnNumber: number
  startTime: number
  endTime?: number
  reason?: StepEndReason
  toolCalls: ToolCallRecord[]
  modelRequest?: ModelRequest
  modelResponse?: ModelResponse
}

export interface Turn {
  number: number
  startTime: number
  endTime?: number
  reason?: TurnEndReason
  steps: Step[]
}

export class TurnController {
  private currentTurn: Turn | null = null
  private turnCounter = 0
  private stepCounter = 0
  private maxStepsPerTurn = 10

  startTurn(): Turn {
    this.turnCounter++
    this.stepCounter = 0
    this.currentTurn = {
      number: this.turnCounter,
      startTime: Date.now(),
      steps: []
    }
    return this.currentTurn
  }

  startStep(): Step {
    if (!this.currentTurn) {
      throw new Error('No active turn')
    }
    this.stepCounter++
    const step: Step = {
      number: this.stepCounter,
      turnNumber: this.currentTurn.number,
      startTime: Date.now(),
      toolCalls: []
    }
    this.currentTurn.steps.push(step)
    return step
  }

  endStep(reason: StepEndReason): void {
    if (!this.currentTurn) return
    const currentStep = this.currentTurn.steps[this.currentTurn.steps.length - 1]
    if (currentStep) {
      currentStep.endTime = Date.now()
      currentStep.reason = reason
    }
  }

  endTurn(reason: TurnEndReason): void {
    if (!this.currentTurn) return
    this.currentTurn.endTime = Date.now()
    this.currentTurn.reason = reason
  }

  shouldContinueTurn(): boolean {
    if (!this.currentTurn) return false
    return this.stepCounter < this.maxStepsPerTurn
  }

  getCurrentTurn(): Turn | null {
    return this.currentTurn
  }

  getCurrentStep(): Step | null {
    if (!this.currentTurn) return null
    return this.currentTurn.steps[this.currentTurn.steps.length - 1] || null
  }

  setMaxStepsPerTurn(max: number): void {
    this.maxStepsPerTurn = max
  }

  getMaxStepsPerTurn(): number {
    return this.maxStepsPerTurn
  }

  getTurnCount(): number {
    return this.turnCounter
  }
}
