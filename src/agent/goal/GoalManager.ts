import { generateId } from '../../utils'

export type GoalPhase = 'active' | 'paused' | 'blocked' | 'complete'

export interface GoalMetric {
  name: string
  target: number
  current: number
  unit: string
}

export interface GoalProgress {
  timestamp: number
  note: string
  delta?: Partial<Goal>
}

export interface Goal {
  id: string
  sessionId: string
  title: string
  description: string
  phase: GoalPhase
  revision: number
  metrics?: GoalMetric[]
  progress: GoalProgress[]
  createdAt: number
  updatedAt: number
  completedAt?: number
}

export class GoalManager {
  private goals: Map<string, Goal> = new Map()
  private sessionGoals: Map<string, Set<string>> = new Map()

  createGoal(sessionId: string, title: string, description: string, metrics?: GoalMetric[]): Goal {
    const goal: Goal = {
      id: generateId(),
      sessionId,
      title,
      description,
      phase: 'active',
      revision: 0,
      metrics,
      progress: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.goals.set(goal.id, goal)
    const sessionGoalSet = this.sessionGoals.get(sessionId) || new Set()
    sessionGoalSet.add(goal.id)
    this.sessionGoals.set(sessionId, sessionGoalSet)

    return goal
  }

  updateGoal(
    goalId: string,
    expectedRevision: number,
    updates: Partial<Omit<Goal, 'id' | 'revision' | 'updatedAt'>>
  ): Goal | null {
    const goal = this.goals.get(goalId)
    if (!goal) return null

    if (goal.revision !== expectedRevision) {
      throw new Error(`CAS conflict: expected revision ${expectedRevision}, actual ${goal.revision}`)
    }

    const previousState = { ...goal }
    Object.assign(goal, updates, {
      revision: goal.revision + 1,
      updatedAt: Date.now()
    })

    goal.progress.push({
      timestamp: Date.now(),
      note: 'Goal updated',
      delta: previousState
    })

    return goal
  }

  getGoal(goalId: string): Goal | undefined {
    return this.goals.get(goalId)
  }

  getSessionGoals(sessionId: string): Goal[] {
    const goalIds = this.sessionGoals.get(sessionId) || new Set()
    return Array.from(goalIds).map(id => this.goals.get(id)).filter(Boolean) as Goal[]
  }

  getActiveGoals(sessionId: string): Goal[] {
    return this.getSessionGoals(sessionId).filter(g => g.phase === 'active')
  }

  getCompletedGoals(sessionId: string): Goal[] {
    return this.getSessionGoals(sessionId).filter(g => g.phase === 'complete')
  }

  completeGoal(goalId: string): void {
    const goal = this.goals.get(goalId)
    if (!goal) return

    goal.phase = 'complete'
    goal.completedAt = Date.now()
    goal.revision++
    goal.updatedAt = Date.now()

    goal.progress.push({
      timestamp: Date.now(),
      note: 'Goal completed'
    })
  }

  blockGoal(goalId: string, reason: string): void {
    const goal = this.goals.get(goalId)
    if (!goal) return

    goal.phase = 'blocked'
    goal.revision++
    goal.updatedAt = Date.now()
    goal.progress.push({
      timestamp: Date.now(),
      note: `Blocked: ${reason}`
    })
  }

  pauseGoal(goalId: string, reason: string): void {
    const goal = this.goals.get(goalId)
    if (!goal) return

    goal.phase = 'paused'
    goal.revision++
    goal.updatedAt = Date.now()
    goal.progress.push({
      timestamp: Date.now(),
      note: `Paused: ${reason}`
    })
  }

  resumeGoal(goalId: string): void {
    const goal = this.goals.get(goalId)
    if (!goal || goal.phase !== 'paused') return

    goal.phase = 'active'
    goal.revision++
    goal.updatedAt = Date.now()
    goal.progress.push({
      timestamp: Date.now(),
      note: 'Goal resumed'
    })
  }

  updateMetric(goalId: string, metricName: string, value: number): void {
    const goal = this.goals.get(goalId)
    if (!goal || !goal.metrics) return

    const metric = goal.metrics.find(m => m.name === metricName)
    if (metric) {
      metric.current = value
      goal.revision++
      goal.updatedAt = Date.now()
    }
  }

  deleteGoal(goalId: string): void {
    const goal = this.goals.get(goalId)
    if (!goal) return

    const sessionGoalSet = this.sessionGoals.get(goal.sessionId)
    if (sessionGoalSet) {
      sessionGoalSet.delete(goalId)
    }
    this.goals.delete(goalId)
  }

  cleanupSession(sessionId: string): void {
    const goalIds = this.sessionGoals.get(sessionId) || new Set()
    for (const id of goalIds) {
      this.goals.delete(id)
    }
    this.sessionGoals.delete(sessionId)
  }
}
