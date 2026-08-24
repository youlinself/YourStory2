import type {
  PreExecutionDecision,
  PostExecutionDecision,
  PipelineContext,
  PipelineResult
} from './types'
import type { ToolDefinition, ToolResult, ToolExecutionContext } from '../tools/ToolTypes'
import type { EventEmitter } from '../events/EventEmitter'

export type PreExecutionHook = (
  context: PipelineContext,
  next: () => Promise<PreExecutionDecision>
) => Promise<PreExecutionDecision>

export type PostExecutionHook = (
  context: PipelineContext,
  result: ToolResult,
  next: () => Promise<PostExecutionDecision>
) => Promise<PostExecutionDecision>

export class ExtractionPipeline {
  private preHooks: PreExecutionHook[] = []
  private postHooks: PostExecutionHook[] = []
  private events: EventEmitter

  constructor(events: EventEmitter) {
    this.events = events
  }

  /** 注册执行前钩子 */
  addPreHook(hook: PreExecutionHook): () => void {
    this.preHooks.push(hook)
    return () => {
      const index = this.preHooks.indexOf(hook)
      if (index >= 0) this.preHooks.splice(index, 1)
    }
  }

  /** 注册执行后钩子 */
  addPostHook(hook: PostExecutionHook): () => void {
    this.postHooks.push(hook)
    return () => {
      const index = this.postHooks.indexOf(hook)
      if (index >= 0) this.postHooks.splice(index, 1)
    }
  }

  /** 执行完整管道 */
  async execute(
    tool: ToolDefinition,
    args: unknown,
    context: PipelineContext
  ): Promise<PipelineResult> {
    const messages: string[] = []

    const preDecision = await this.runPreExecute(context)
    if (preDecision.kind === 'deny') {
      return {
        success: false,
        blocked: true,
        error: preDecision.reason,
        messages: [`执行被拒绝: ${preDecision.reason}`]
      }
    }

    let result: ToolResult
    try {
      const toolContext: ToolExecutionContext = {
        sessionId: context.sessionId,
        chapterId: context.sessionContext.chapterId,
        sessionContext: context.sessionContext,
        signal: context.signal
      }
      result = await tool.execute(args, toolContext)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        messages: ['工具执行出错']
      }
    }

    const postDecision = await this.runPostExecute(context, result)
    if (postDecision.kind === 'block') {
      return {
        success: false,
        blocked: true,
        error: postDecision.feedback,
        messages: [postDecision.feedback]
      }
    }

    messages.push(...(postDecision.additionalMessages || []))

    return {
      success: result.success,
      data: result.data,
      messages
    }
  }

  /** 执行 pre-execute 链 */
  private async runPreExecute(
    context: PipelineContext
  ): Promise<PreExecutionDecision> {
    let index = 0

    const next = async (): Promise<PreExecutionDecision> => {
      if (index >= this.preHooks.length) {
        return { kind: 'allow' }
      }
      const hook = this.preHooks[index++]
      return hook(context, next)
    }

    return next()
  }

  /** 执行 post-execute 链 */
  private async runPostExecute(
    context: PipelineContext,
    result: ToolResult
  ): Promise<PostExecutionDecision> {
    let index = 0

    const next = async (): Promise<PostExecutionDecision> => {
      if (index >= this.postHooks.length) {
        return { kind: 'accept', content: result.data }
      }
      const hook = this.postHooks[index++]
      return hook(context, result, next)
    }

    return next()
  }

  /** 获取 pre-hook 数量 */
  getPreHookCount(): number {
    return this.preHooks.length
  }

  /** 获取 post-hook 数量 */
  getPostHookCount(): number {
    return this.postHooks.length
  }

  /** 清空所有钩子 */
  clearHooks(): void {
    this.preHooks = []
    this.postHooks = []
  }
}
