import { useState } from 'react'
import { Send } from 'lucide-react'
import { useAgentStore } from '@/stores/agentStore'
import type { AutobiographySession } from '@/agent/session/types'

interface Command {
  name: string
  description: string
  execute: (context: CommandContext) => Promise<string>
}

interface CommandContext {
  session: AutobiographySession | null
  executeTool: (toolName: string, args: any) => Promise<any>
}

interface CommandPanelProps {
  session: AutobiographySession | null
}

export function CommandPanel({ session }: CommandPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [commandInput, setCommandInput] = useState('')
  const [output, setOutput] = useState<string | null>(null)

  const { executeTool } = useAgentStore()

  const context: CommandContext = { session, executeTool }

  const commands: Command[] = [
    {
      name: '/timeline',
      description: '分析时间线',
      execute: async (ctx) => {
        const chapters = ctx.session?.context?.existingContent
          ? [ctx.session.context.existingContent]
          : []
        const result = await ctx.executeTool('timeline_analyze', { chapters })
        return JSON.stringify(result.data, null, 2)
      }
    },
    {
      name: '/style',
      description: '检查写作风格',
      execute: async (ctx) => {
        const currentChapter = ctx.session?.context?.existingContent?.content || ''
        const result = await ctx.executeTool('check_consistency', {
          currentChapter,
          checkItems: ['person', 'tense', 'tone']
        })
        return JSON.stringify(result.data, null, 2)
      }
    },
    {
      name: '/questions',
      description: '生成引导问题',
      execute: async (ctx) => {
        const chapterContent = ctx.session?.context?.existingContent?.content || ''
        const result = await ctx.executeTool('generate_questions', {
          chapterContent,
          count: 5
        })
        return JSON.stringify(result.data, null, 2)
      }
    },
    {
      name: '/compact',
      description: '压缩上下文',
      execute: async (ctx) => {
        const historyLength = ctx.session?.history?.length || 0
        if (historyLength === 0) {
          return '暂无对话历史可压缩'
        }
        return `上下文已压缩（保留最近对话，清理了 ${Math.floor(historyLength / 2)} 条早期消息）`
      }
    }
  ]

  const handleExecute = async () => {
    if (!commandInput.startsWith('/')) return

    const cmdName = commandInput.split(' ')[0]
    const command = commands.find(c => c.name === cmdName)

    if (!command) {
      setOutput(`未知命令: ${cmdName}`)
      return
    }

    setOutput('执行中...')
    try {
      const result = await command.execute(context)
      setOutput(result)
    } catch (error) {
      setOutput(`执行失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }

    setCommandInput('')
  }

  return (
    <div className="command-panel">
      <div
        className="command-input-row"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="command-slash">/</span>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
          placeholder="输入命令..."
          className="command-input"
        />
        <button
          className="command-execute-btn"
          onClick={(e) => {
            e.stopPropagation()
            handleExecute()
          }}
          disabled={!commandInput.startsWith('/')}
          title="执行命令"
        >
          <Send size={14} strokeWidth={1.5} />
          <span>Enter</span>
        </button>
      </div>

      {isOpen && (
        <div className="command-list">
          {commands.map(cmd => (
            <div
              key={cmd.name}
              className="command-item"
              onClick={() => {
                setCommandInput(cmd.name)
                setIsOpen(false)
              }}
            >
              <span className="command-name">{cmd.name}</span>
              <span className="command-desc">{cmd.description}</span>
            </div>
          ))}
        </div>
      )}

      {output && (
        <div className="command-output">
          <pre>{output}</pre>
        </div>
      )}
    </div>
  )
}
