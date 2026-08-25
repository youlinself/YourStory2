import type { Skill, SkillContext, SkillCommand } from '../SkillTypes'
import { getLogger } from '../../logging'

const logger = getLogger()

const styleCheckCommand: SkillCommand = {
  name: '/style',
  description: '检查写作风格一致性',
  execute: async (args, context) => {
    const checkType = args?.trim() || 'all'

    const result = await context.agent.executeTool(
      context.sessionId,
      'check_consistency',
      {
        currentChapter: '',
        checkItems: checkType === 'all' ? undefined : [checkType]
      }
    )

    if (!result.success) {
      return { success: false, output: `风格检查失败: ${result.error}` }
    }

    let output = `## 风格检查结果\n\n`
    output += `整体一致性：${(result.data.overall * 100).toFixed(1)}%\n\n`

    const details = result.data.details || {}
    for (const [key, value] of Object.entries(details)) {
      const detail = value as any
      output += `### ${key}\n`
      output += `得分：${(detail.score * 100).toFixed(1)}%\n`
      if (detail.issues?.length > 0) {
        output += `问题：\n`
        detail.issues.forEach((i: string) => output += `- ${i}\n`)
      }
      output += '\n'
    }

    if (result.data.suggestions?.length > 0) {
      output += `### 改进建议\n`
      result.data.suggestions.forEach((s: string) => output += `- ${s}\n`)
    }

    return { success: true, output, data: result.data }
  }
}

export const styleCheckSkill: Skill = {
  name: 'style_check',
  description: '检查写作风格、时态、人称的一致性',

  tools: ['check_consistency'],

  promptSections: [
    {
      name: 'style_consistency',
      order: 30,
      content: () => `
保持写作风格的一致性：
- 全文使用第一人称叙事
- 主要使用过去时态
- 保持统一的语气和用词风格
- 段落长度和句子结构保持一致
      `.trim()
    }
  ],

  commands: [styleCheckCommand],

  on: {
    'content/approved': async (_payload, _context) => {
      logger.debug('StyleCheck', 'Content approved, checking style')
    }
  }
}
