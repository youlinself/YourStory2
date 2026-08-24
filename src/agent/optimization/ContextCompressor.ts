import type { ConversationTurn } from '../session/types'
import type { LLMAdapter } from '../llm/LLMAdapter'

export interface CompressionResult {
  compressedHistory: ConversationTurn[]
  summary: string
  removedCount: number
  tokensSaved: number
}

export interface CompressionOptions {
  keepRecent?: number
  summaryPrompt?: string
  maxTurns?: number
  maxTokens?: number
}

export class ContextCompressor {
  private llmAdapter: LLMAdapter

  constructor(llmAdapter: LLMAdapter) {
    this.llmAdapter = llmAdapter
  }

  /** 检查是否需要压缩 */
  shouldCompress(
    history: ConversationTurn[],
    maxTurns: number = 20,
    maxTokens: number = 50000
  ): boolean {
    if (history.length > maxTurns) return true

    const totalTokens = history.reduce(
      (sum, turn) => sum + this.estimateTokens(turn.content),
      0
    )

    return totalTokens > maxTokens
  }

  /** 执行压缩 */
  async compress(
    history: ConversationTurn[],
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const { keepRecent = 5 } = options

    if (history.length <= keepRecent) {
      return {
        compressedHistory: history,
        summary: '',
        removedCount: 0,
        tokensSaved: 0
      }
    }

    const toCompress = history.slice(0, -keepRecent)
    const toKeep = history.slice(-keepRecent)

    const summary = await this.generateSummary(toCompress, options.summaryPrompt)

    const compressedHistory: ConversationTurn[] = [
      {
        role: 'system',
        content: `[之前的对话摘要]\n${summary}`,
        timestamp: toCompress[0].timestamp
      },
      ...toKeep
    ]

    const originalTokens = this.calculateTokens(history)
    const compressedTokens = this.calculateTokens(compressedHistory)

    return {
      compressedHistory,
      summary,
      removedCount: toCompress.length,
      tokensSaved: originalTokens - compressedTokens
    }
  }

  /** 生成对话摘要 */
  private async generateSummary(
    turns: ConversationTurn[],
    customPrompt?: string
  ): Promise<string> {
    const conversationText = turns
      .map(t => `${t.role}: ${t.content}`)
      .join('\n')

    const prompt = customPrompt ?? `
请将以下对话内容压缩为简洁的摘要，保留关键信息、决策和情感要点：

${conversationText}

要求：
1. 提取关键事件和决定
2. 保留重要的人物和情感信息
3. 用简洁的语言总结
4. 字数控制在原文的 20-30%
    `.trim()

    return this.llmAdapter.generate(prompt, {
      model: 'default',
      temperature: 0.3
    })
  }

  /** 估算 Token */
  estimateTokens(text: string): number {
    return Math.ceil(text.length * 0.75)
  }

  /** 计算历史总 Token */
  private calculateTokens(history: ConversationTurn[]): number {
    return history.reduce((sum, turn) => sum + this.estimateTokens(turn.content), 0)
  }
}
