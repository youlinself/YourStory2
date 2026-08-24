import { useState } from 'react'
import { useAgentStore } from '@/stores/agentStore'

interface Command {
  name: string
  description: string
  execute: () => Promise<string>
}

export function CommandPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [commandInput, setCommandInput] = useState('')
  const [output, setOutput] = useState<string | null>(null)

  const { executeTool } = useAgentStore()

  const commands: Command[] = [
    {
      name: '/timeline',
      description: '分析时间线',
      execute: async () => {
        const result = await executeTool('timeline_analyze', { chapters: [] })
        return JSON.stringify(result.data, null, 2)
      }
    },
    {
      name: '/style',
      description: '检查写作风格',
      execute: async () => {
        const result = await executeTool('check_consistency', {
          currentChapter: '',
          checkItems: ['person', 'tense', 'tone']
        })
        return JSON.stringify(result.data, null, 2)
      }
    },
    {
      name: '/questions',
      description: '生成引导问题',
      execute: async () => {
        const result = await executeTool('generate_questions', {
          chapterContent: '',
          count: 5
        })
        return JSON.stringify(result.data, null, 2)
      }
    },
    {
      name: '/compact',
      description: '压缩上下文',
      execute: async () => {
        return '上下文已压缩'
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
      const result = await command.execute()
      setOutput(result)
    } catch (error) {
      setOutput(`执行失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }

    setCommandInput('')
  }

  return (
    <div className="border rounded-lg">
      <div
        className="flex items-center gap-2 p-2 border-b cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-gray-400">/</span>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
          placeholder="输入命令..."
          className="flex-1 bg-transparent outline-none"
        />
      </div>

      {isOpen && (
        <div className="p-2 space-y-1">
          {commands.map(cmd => (
            <div
              key={cmd.name}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setCommandInput(cmd.name)
                setIsOpen(false)
              }}
            >
              <span className="font-mono text-sm font-semibold">{cmd.name}</span>
              <span className="text-sm text-gray-500">{cmd.description}</span>
            </div>
          ))}
        </div>
      )}

      {output && (
        <div className="p-2 border-t bg-gray-50">
          <pre className="text-sm whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  )
}
