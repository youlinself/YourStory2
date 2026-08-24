import type { Skill, SkillContext, SkillCommand } from '../SkillTypes'

const questionCommand: SkillCommand = {
  name: '/questions',
  description: '生成引导性问题',
  execute: async (args, context) => {
    const types = args?.trim().split(',') || []

    const result = await context.agent.executeTool(
      context.sessionId,
      'generate_questions',
      {
        chapterContent: '',
        questionTypes: types.length > 0 ? types : undefined,
        count: 5,
        difficulty: 'medium'
      }
    )

    if (!result.success) {
      return { success: false, output: `生成问题失败: ${result.error}` }
    }

    let output = `## 引导性问题\n\n`
    result.data.questions.forEach((q: any, i: number) => {
      output += `### ${i + 1}. ${q.question}\n`
      if (q.hint) {
        output += `*提示：${q.hint}*\n`
      }
      output += `\n`
    })

    return { success: true, output, data: result.data }
  }
}

export const guidedQuestioningSkill: Skill = {
  name: 'guided_questioning',
  description: '智能生成引导性问题，帮助用户深入回忆',

  tools: ['generate_questions'],

  promptSections: [
    {
      name: 'questioning_style',
      order: 40,
      content: () => `
善于通过提问引导用户回忆：
- 根据对话内容动态生成相关问题
- 问题要有层次感，从浅入深
- 结合用户已提供的信息，避免重复
- 鼓励具体的细节和情感表达
      `.trim()
    }
  ],

  commands: [questionCommand],

  on: {
    'turn/complete': async (_payload, context) => {
      console.log('[GuidedQuestioning] Turn complete, preparing suggestions')
    }
  }
}
