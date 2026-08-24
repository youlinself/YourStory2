import type { ToolDefinition, ToolParameters, ToolResult, ToolExecutionContext } from '../ToolTypes'

type QuestionType = 'memory' | 'emotion' | 'detail' | 'relationship' | 'reflection'
type Difficulty = 'easy' | 'medium' | 'deep'

interface GenerateQuestionsArgs {
  chapterContent: string
  questionTypes?: QuestionType[]
  count?: number
  difficulty?: Difficulty
}

interface GeneratedQuestion {
  type: QuestionType
  question: string
  hint?: string
}

interface GenerateQuestionsResult {
  questions: GeneratedQuestion[]
  metadata: {
    generatedAt: number
    types: QuestionType[]
    difficulty: Difficulty
  }
}

const parameters: ToolParameters = {
  type: 'object',
  properties: {
    chapterContent: { type: 'string', description: '当前章节内容' },
    questionTypes: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['memory', 'emotion', 'detail', 'relationship', 'reflection']
      },
      description: '问题类型'
    },
    count: { type: 'number', description: '生成问题数量' },
    difficulty: {
      type: 'string',
      enum: ['easy', 'medium', 'deep'],
      description: '问题深度'
    }
  },
  required: ['chapterContent']
}

const questionTemplates: Record<QuestionType, Record<Difficulty, string[]>> = {
  memory: {
    easy: [
      '您还记得当时发生了什么吗？',
      '那件事发生在什么时候？',
      '当时您在做什么？'
    ],
    medium: [
      '能描述一下当时的具体场景吗？',
      '那天有什么特别的事情发生吗？',
      '您还记得当时的环境是怎样的吗？'
    ],
    deep: [
      '如果让您回到那个时刻，您最想记住的是什么？',
      '那段经历对您后来的人生产生了什么影响？',
      '现在回想起来，您觉得当时有什么不同的选择吗？'
    ]
  },
  emotion: {
    easy: [
      '当时您的心情是怎样的？',
      '那件事让您感到开心还是难过？',
      '您现在回想起来有什么感觉？'
    ],
    medium: [
      '当时的情绪是如何影响您的决定的？',
      '那种感受持续了多久？',
      '有没有什么特别的情绪转折点？'
    ],
    deep: [
      '这段经历如何改变了您对生活的看法？',
      '当时的情感体验对您后来有什么深远影响？',
      '如果能与当时的自己对话，您想说什么？'
    ]
  },
  detail: {
    easy: [
      '能描述一下当时的环境吗？',
      '当时有什么特别的细节让您印象深刻？',
      '周围有什么人？'
    ],
    medium: [
      '能描述一下当时的天气、光线或声音吗？',
      '当时有什么物品或场景让您特别难忘？',
      '能描述一下当时人物的表情或动作吗？'
    ],
    deep: [
      '那些细节如何构成了您记忆中的画面？',
      '如果要用一个比喻来描述那个场景，您会怎么说？',
      '那些细节中，哪些对您最有意义？'
    ]
  },
  relationship: {
    easy: [
      '当时有哪些人在场？',
      '您和他们的关系是怎样的？',
      '他们对您说了什么？'
    ],
    medium: [
      '那段关系对您来说意味着什么？',
      '他们是如何影响您的？',
      '您们之间有什么特别的互动吗？'
    ],
    deep: [
      '这段关系如何塑造了今天的您？',
      '如果那段关系有变化，您的人生会有什么不同？',
      '您从这段关系中学到了什么？'
    ]
  },
  reflection: {
    easy: [
      '您觉得那件事对您有什么影响？',
      '您从中学到了什么？',
      '现在回头看，您有什么想法？'
    ],
    medium: [
      '这段经历如何改变了您的想法？',
      '它对您后来的人生选择有什么影响？',
      '您觉得这段经历有什么特别的意义？'
    ],
    deep: [
      '这段经历如何定义了您是谁？',
      '如果人生可以重来，您会如何选择？',
      '这段经历对您的人生哲学有什么影响？'
    ]
  }
}

const typeDescriptions: Record<QuestionType, string> = {
  memory: '记忆唤醒：帮助回忆具体事件',
  emotion: '情感探索：引导表达情感体验',
  detail: '细节挖掘：丰富感官细节',
  relationship: '人际关系：探讨与他人的互动',
  reflection: '反思总结：引导思考和感悟'
}

export const generateQuestionsTool: ToolDefinition = {
  name: 'generate_questions',
  description: '根据当前章节内容生成引导性问题，帮助用户深入回忆',
  parameters,
  isConcurrencySafe: () => true,
  timeoutMs: 15000,

  execute: async (args: GenerateQuestionsArgs, _context: ToolExecutionContext): Promise<ToolResult> => {
    const { chapterContent, questionTypes, count = 3, difficulty = 'medium' } = args

    if (!questionTypes || questionTypes.length === 0) {
      const allTypes: QuestionType[] = ['memory', 'emotion', 'detail', 'relationship', 'reflection']
      const questions = generateQuestionsFromTypes(allTypes, count, difficulty, chapterContent)
      return buildResult(questions, allTypes, difficulty)
    }

    const questions = generateQuestionsFromTypes(questionTypes, count, difficulty, chapterContent)
    return buildResult(questions, questionTypes, difficulty)
  }
}

function generateQuestionsFromTypes(
  types: QuestionType[],
  count: number,
  difficulty: Difficulty,
  content: string
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = []
  const usedQuestions = new Set<string>()

  const typesCycle = [...types]
  let typeIndex = 0

  while (questions.length < count) {
    const currentType = typesCycle[typeIndex % typesCycle.length]
    const templates = questionTemplates[currentType][difficulty]

    for (const template of templates) {
      if (questions.length >= count) break
      if (usedQuestions.has(template)) continue

      if (isRelevantToContent(template, content)) {
        questions.push({
          type: currentType,
          question: template,
          hint: generateHint(currentType, difficulty)
        })
        usedQuestions.add(template)
      }
    }

    typeIndex++

    if (typeIndex > types.length * 3 && questions.length < count) {
      for (const currentType of typesCycle) {
        const templates = questionTemplates[currentType][difficulty]
        for (const template of templates) {
          if (questions.length >= count) break
          if (!usedQuestions.has(template)) {
            questions.push({
              type: currentType,
              question: template,
              hint: generateHint(currentType, difficulty)
            })
            usedQuestions.add(template)
          }
        }
      }
      break
    }
  }

  return questions.slice(0, count)
}

function isRelevantToContent(question: string, content: string): boolean {
  if (!content || content.trim().length === 0) {
    return true
  }

  const contentKeywords = extractKeywords(content)
  const questionKeywords = extractKeywords(question)

  for (const keyword of questionKeywords) {
    if (contentKeywords.has(keyword)) {
      return true
    }
  }

  return true
}

function extractKeywords(text: string): Set<string> {
  const keywords = new Set<string>()
  const commonWords = ['的', '了', '是', '在', '我', '你', '他', '她', '它', '们', '有', '和', '与', '或', '但', '而', '就', '也', '都', '要', '能', '会', '可以', '吗', '呢', '啊', '哦', '嗯']

  for (const char of text) {
    if (!commonWords.includes(char) && char.trim().length > 0) {
      keywords.add(char)
    }
  }

  return keywords
}

function generateHint(type: QuestionType, difficulty: Difficulty): string {
  const hints: Record<QuestionType, Record<Difficulty, string>> = {
    memory: {
      easy: '试着回忆当时的情景',
      medium: '细节会让记忆更加生动',
      deep: '深入思考这段记忆的意义'
    },
    emotion: {
      easy: '任何感受都是真实的',
      medium: '情绪是了解自己的窗口',
      deep: '接纳所有的情感体验'
    },
    detail: {
      easy: '五感可以帮助您回忆',
      medium: '细节让故事更加真实',
      deep: '细节中蕴含着深刻的意义'
    },
    relationship: {
      easy: '想想当时的人',
      medium: '关系塑造了我们',
      deep: '每段关系都有其意义'
    },
    reflection: {
      easy: '没有标准答案',
      medium: '反思让我们成长',
      deep: '思考人生是一段旅程'
    }
  }

  return hints[type][difficulty]
}

function buildResult(
  questions: GeneratedQuestion[],
  types: QuestionType[],
  difficulty: Difficulty
): ToolResult {
  const result: GenerateQuestionsResult = {
    questions,
    metadata: {
      generatedAt: Date.now(),
      types,
      difficulty
    }
  }

  return {
    success: true,
    data: result
  }
}
