import type { Skill, SkillContext, SkillCommand } from '../SkillTypes'

const timelineCommand: SkillCommand = {
  name: '/timeline',
  description: '分析并整理时间线',
  execute: async (_args, context) => {
    const analysis = await context.agent.executeTool(
      context.sessionId,
      'timeline_analyze',
      { chapters: [] }
    )

    if (!analysis.success) {
      return { success: false, output: `时间线分析失败: ${analysis.error}` }
    }

    const gaps = analysis.data.gaps || []
    const suggestions = analysis.data.suggestions || []

    let output = `## 时间线分析结果\n\n`
    output += `覆盖率：${(analysis.data.coverage * 100).toFixed(1)}%\n\n`

    if (gaps.length > 0) {
      output += `### 发现 ${gaps.length} 个缺失时段\n`
      gaps.forEach((gap: any) => {
        output += `- ${gap.start}-${gap.end}: ${gap.suggestion}\n`
      })
      output += '\n'
    }

    if (suggestions.length > 0) {
      output += `### 建议\n`
      suggestions.forEach((s: string) => output += `- ${s}\n`)
    }

    return { success: true, output, data: analysis.data }
  }
}

export const timelineOrganizeSkill: Skill = {
  name: 'timeline_organize',
  description: '分析时间线完整性，检测缺失时段和时间冲突',

  tools: ['timeline_analyze'],

  promptSections: [
    {
      name: 'timeline_awareness',
      order: 20,
      content: () => `
在整理自传时，注意时间的连贯性和完整性：
- 关注时间线的自然流动
- 识别可能缺失的重要时段
- 保持时间叙述的一致性
      `.trim()
    }
  ],

  commands: [timelineCommand],

  on: {
    'content/merged': async (_payload, context) => {
      console.log('[TimelineOrganize] Content merged, timeline may need update')
    }
  }
}
