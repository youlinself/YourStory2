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
  signal?: AbortSignal
}

export type CompactionTrigger = 'pressure' | 'context-overflow' | 'compactNow'

export interface CompactionState {
  isCompacting: boolean
  lastCompactionTime?: number
  compactionCount: number
}

export interface ToolResultPruneOptions {
  headChars: number
  tailChars: number
  placeholder: string
}

export class ContextCompressor {
  private llmAdapter: LLMAdapter
  private compactionState: CompactionState = {
    isCompacting: false,
    compactionCount: 0
  }
  private pruneOptions: ToolResultPruneOptions = {
    headChars: 200,
    tailChars: 200,
    placeholder: '\n...[内容已修剪]...\n'
  }

  constructor(llmAdapter: LLMAdapter) {
    this.llmAdapter = llmAdapter
  }

  checkPressure(history: ConversationTurn[], maxTokens: number): number {
    const totalTokens = this.calculateTokens(history)
    return totalTokens / maxTokens
  }

  shouldCompress(
    history: ConversationTurn[],
    trigger: CompactionTrigger,
    options: CompressionOptions
  ): boolean {
    switch (trigger) {
      case 'pressure':
        return this.checkPressure(history, options.maxTokens || 50000) > 0.8
      case 'context-overflow':
        return this.calculateTokens(history) > (options.maxTokens || 50000)
      case 'compactNow':
        return true
      default:
        return false
    }
  }

  async compressWithLock(
    history: ConversationTurn[],
    options: CompressionOptions
  ): Promise<CompressionResult> {
    if (this.compactionState.isCompacting) {
      throw new Error('Compaction already in progress')
    }

    this.compactionState.isCompacting = true
    try {
      const prunedHistory = this.pruneToolResults(history)
      const result = await this.compress(prunedHistory, options)

      this.compactionState.lastCompactionTime = Date.now()
      this.compactionState.compactionCount++

      return result
    } finally {
      this.compactionState.isCompacting = false
    }
  }

  private pruneToolResults(history: ConversationTurn[]): ConversationTurn[] {
    return history.map(turn => {
      if (turn.role === 'system' && turn.content.includes('[工具结果]') && turn.content.length > this.pruneOptions.headChars + this.pruneOptions.tailChars) {
        const head = turn.content.slice(0, this.pruneOptions.headChars)
        const tail = turn.content.slice(-this.pruneOptions.tailChars)
        return {
          ...turn,
          content: head + this.pruneOptions.placeholder + tail
        }
      }
      return turn
    })
  }

  pruneAtCodePoint(text: string, headChars: number, tailChars: number): string {
    const codePoints = [...text]
    if (codePoints.length <= headChars + tailChars) return text

    const head = codePoints.slice(0, headChars).join('')
    const tail = codePoints.slice(-headChars).join('')
    return head + this.pruneOptions.placeholder + tail
  }

  getCompactionState(): CompactionState {
    return { ...this.compactionState }
  }

  shouldCompressLegacy(
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

  async compress(
    history: ConversationTurn[],
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const { keepRecent = 5, signal } = options

    if (history.length <= keepRecent) {
      return {
        compressedHistory: history,
        summary: '',
        removedCount: 0,
        tokensSaved: 0
      }
    }

    if (signal?.aborted) {
      throw new Error('Operation cancelled')
    }

    const toCompress = history.slice(0, -keepRecent)
    const toKeep = history.slice(-keepRecent)

    const summary = await this.generateSummary(toCompress, options.summaryPrompt, signal)

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

  private async generateSummary(
    turns: ConversationTurn[],
    customPrompt?: string,
    signal?: AbortSignal
  ): Promise<string> {
    if (signal?.aborted) {
      throw new Error('Operation cancelled')
    }

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

  estimateTokens(text: string): number {
    return Math.ceil(text.length * 0.75)
  }

  private calculateTokens(history: ConversationTurn[]): number {
    return history.reduce((sum, turn) => sum + this.estimateTokens(turn.content), 0)
  }
}
