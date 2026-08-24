/**
 * Phase 2 工具系统 - 逻辑验证脚本
 * 运行方式: npx tsx src/agent/__tests__/phase2-tool-system-test.ts
 */

import { ToolRegistry } from '../tools'
import { AutobiographyAgent } from '../AutobiographyAgent'
import { MemoryStorageAdapter } from '../session'
import {
  extractContentTool,
  mergeDraftTool,
  generateQuestionsTool,
  checkConsistencyTool,
  timelineAnalyzeTool,
  registerAutobiographyTools,
  autobiographyTools
} from '../tools/autobiography'
import type { SessionContext } from '../session/types'

let passed = 0
let failed = 0

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++
    console.log(`  ✅ ${message}`)
  } else {
    failed++
    console.error(`  ❌ ${message}`)
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  const isEqual = JSON.stringify(actual) === JSON.stringify(expected)
  if (isEqual) {
    passed++
    console.log(`  ✅ ${message}`)
  } else {
    failed++
    console.error(`  ❌ ${message}`)
    console.error(`     期望: ${JSON.stringify(expected)}`)
    console.error(`     实际: ${JSON.stringify(actual)}`)
  }
}

async function runAsync(name: string, fn: () => Promise<void>): Promise<void> {
  console.log(`\n📦 ${name}`)
  try {
    await fn()
  } catch (error) {
    failed++
    console.error(`  ❌ 测试抛出异常: ${error}`)
  }
}

const mockContext: SessionContext = {
  chapterId: 'ch-001',
  existingContent: null,
  userPreferences: {
    style: 'casual',
    language: 'zh',
    perspective: 'first',
    autoExtract: true
  },
  timelineContext: { currentEra: '1990-2000' },
  extractedCache: []
}

// ============================================================
// extract_content 测试
// ============================================================
async function testExtractContent(): Promise<void> {
  await runAsync('extract_content - 正常提取', async () => {
    const result = await extractContentTool.execute({
      conversationSegments: ['1990年夏天，我和妈妈一起去海边玩', '那时候我们都很开心']
    }, createMockContext())

    assert(result.success, '提取成功')
    assert(result.data.paragraphs.length > 0, '返回段落不为空')
    assert(result.data.confidence > 0, '置信度大于0')
    assert(result.data.originalLength > 0, '原始长度大于0')
  })

  await runAsync('extract_content - 空输入', async () => {
    const result = await extractContentTool.execute({
      conversationSegments: []
    }, createMockContext())

    assert(!result.success, '空输入应失败')
    assert(result.error?.includes('empty'), '错误信息包含empty')
  })

  await runAsync('extract_content - 第一人称转换', async () => {
    const result = await extractContentTool.execute({
      conversationSegments: ['你去海边玩', '你的心情很好'],
      extractOptions: { narrativeStyle: 'first_person' }
    }, createMockContext())

    assert(result.success, '转换成功')
    assert(
      result.data.paragraphs[0].includes('我'),
      '转换为第一人称'
    )
  })

  await runAsync('extract_content - 提取时间标签', async () => {
    const result = await extractContentTool.execute({
      conversationSegments: ['1990年发生了很多事', '那年夏天特别热'],
      extractOptions: { includeTimeTag: true }
    }, createMockContext())

    assert(result.success, '提取成功')
    assert(result.data.timeTag !== undefined, '时间标签存在')
  })

  await runAsync('extract_content - 提取情感标签', async () => {
    const result = await extractContentTool.execute({
      conversationSegments: ['那天我们都很开心', '感到非常幸福'],
      extractOptions: { includeEmotions: true }
    }, createMockContext())

    assert(result.success, '提取成功')
    assert(result.data.emotionTags.length > 0, '情感标签不为空')
  })

  await runAsync('extract_content - 提取人物', async () => {
    const result = await extractContentTool.execute({
      conversationSegments: ['妈妈带我去玩', '爸爸也在家里'],
      extractOptions: { includePeople: true }
    }, createMockContext())

    assert(result.success, '提取成功')
    assert(result.data.people.length > 0, '人物列表不为空')
    assert(result.data.people.includes('妈妈'), '包含妈妈')
    assert(result.data.people.includes('爸爸'), '包含爸爸')
  })
}

// ============================================================
// merge_draft 测试
// ============================================================
async function testMergeDraft(): Promise<void> {
  await runAsync('merge_draft - 头部插入', async () => {
    const result = await mergeDraftTool.execute({
      chapterId: 'ch-001',
      existingDraft: '这是原有内容',
      newContent: ['这是新内容1', '这是新内容2'],
      mergeOptions: { insertPosition: 'beginning' }
    }, createMockContext())

    assert(result.success, '合并成功')
    assert(result.data.mergedContent.startsWith('这是新内容1'), '新内容在头部')
    assert(result.data.stats.originalLength > 0, '原始长度正确')
  })

  await runAsync('merge_draft - 尾部插入', async () => {
    const result = await mergeDraftTool.execute({
      chapterId: 'ch-001',
      existingDraft: '这是原有内容',
      newContent: ['这是新内容'],
      mergeOptions: { insertPosition: 'end' }
    }, createMockContext())

    assert(result.success, '合并成功')
    assert(result.data.mergedContent.endsWith('这是新内容'), '新内容在尾部')
  })

  await runAsync('merge_draft - 去重', async () => {
    const result = await mergeDraftTool.execute({
      chapterId: 'ch-001',
      existingDraft: '今天天气很好，我去公园散步。',
      newContent: ['今天天气很好，我去公园散步。', '明天我打算去图书馆看书。'],
      mergeOptions: { deduplicate: true, insertPosition: 'end' }
    }, createMockContext())

    assert(result.success, '合并成功')
    assert(result.data.mergedContent.includes('明天'), '去重后保留新内容')
    assert(result.data.stats.addedLength > 0, '添加长度正确')
  })

  await runAsync('merge_draft - 智能合并', async () => {
    const result = await mergeDraftTool.execute({
      chapterId: 'ch-001',
      existingDraft: '童年时光很美好',
      newContent: ['童年的回忆'],
      mergeOptions: { insertPosition: 'smart' }
    }, createMockContext())

    assert(result.success, '合并成功')
    assert(result.data.mergedContent.includes('童年'), '包含主题内容')
  })

  await runAsync('merge_draft - 空章节ID报错', async () => {
    const result = await mergeDraftTool.execute({
      chapterId: '',
      existingDraft: '内容',
      newContent: ['新内容']
    }, createMockContext())

    assert(!result.success, '空章节ID应失败')
  })
}

// ============================================================
// generate_questions 测试
// ============================================================
async function testGenerateQuestions(): Promise<void> {
  await runAsync('generate_questions - 默认参数', async () => {
    const result = await generateQuestionsTool.execute({
      chapterContent: '我在小学度过了快乐的时光'
    }, createMockContext())

    assert(result.success, '生成成功')
    assert(result.data.questions.length > 0, '问题列表不为空')
    assert(result.data.questions[0].question.length > 0, '问题内容不为空')
  })

  await runAsync('generate_questions - 指定数量', async () => {
    const result = await generateQuestionsTool.execute({
      chapterContent: '章节内容',
      count: 5
    }, createMockContext())

    assert(result.success, '生成成功')
    assertEqual(result.data.questions.length, 5, '生成5个问题')
  })

  await runAsync('generate_questions - 指定类型', async () => {
    const result = await generateQuestionsTool.execute({
      chapterContent: '章节内容',
      questionTypes: ['memory', 'emotion'],
      count: 4
    }, createMockContext())

    assert(result.success, '生成成功')
    const types = result.data.questions.map(q => q.type)
    assert(
      types.includes('memory') || types.includes('emotion'),
      '问题类型正确'
    )
  })

  await runAsync('generate_questions - 不同难度', async () => {
    const easyResult = await generateQuestionsTool.execute({
      chapterContent: '内容',
      difficulty: 'easy',
      count: 2
    }, createMockContext())

    const deepResult = await generateQuestionsTool.execute({
      chapterContent: '内容',
      difficulty: 'deep',
      count: 2
    }, createMockContext())

    assert(easyResult.success, '简单问题生成成功')
    assert(deepResult.success, '深度问题生成成功')
  })

  await runAsync('generate_questions - 包含提示', async () => {
    const result = await generateQuestionsTool.execute({
      chapterContent: '内容',
      count: 3
    }, createMockContext())

    assert(result.success, '生成成功')
    assert(result.data.questions[0].hint !== undefined, '提示信息存在')
  })
}

// ============================================================
// check_consistency 测试
// ============================================================
async function testCheckConsistency(): Promise<void> {
  await runAsync('check_consistency - 单一章节', async () => {
    const result = await checkConsistencyTool.execute({
      currentChapter: '我今天去公园散步，看到了很多美丽的花。我的心情非常好。'
    }, createMockContext())

    assert(result.success, '检查成功')
    assert(result.data.overall > 0, '整体评分大于0')
    assert(result.data.suggestions.length > 0, '有建议')
  })

  await runAsync('check_consistency - 一致的内容', async () => {
    const result = await checkConsistencyTool.execute({
      currentChapter: '我小时候住在农村，我和朋友经常在田野里玩耍。',
      otherChapters: ['我上小学时，我和同学一起学习。']
    }, createMockContext())

    assert(result.success, '检查成功')
    assert(result.data.overall > 0.5, '一致性较高')
  })

  await runAsync('check_consistency - 人称不一致', async () => {
    const result = await checkConsistencyTool.execute({
      currentChapter: '我小时候的故事',
      otherChapters: ['他小时候的故事'],
      checkItems: ['person']
    }, createMockContext())

    assert(result.success, '检查成功')
    assert(result.data.details.person.issues.length > 0, '检测到人称不一致')
  })

  await runAsync('check_consistency - 时态不一致', async () => {
    const result = await checkConsistencyTool.execute({
      currentChapter: '我现在的生活很美好',
      otherChapters: ['我曾经的生活很美好'],
      checkItems: ['tense']
    }, createMockContext())

    assert(result.success, '检查成功')
    assert(result.data.details.tense.issues.length > 0, '检测到时态不一致')
  })

  await runAsync('check_consistency - 空内容报错', async () => {
    const result = await checkConsistencyTool.execute({
      currentChapter: ''
    }, createMockContext())

    assert(!result.success, '空内容应失败')
  })
}

// ============================================================
// timeline_analyze 测试
// ============================================================
async function testTimelineAnalyze(): Promise<void> {
  await runAsync('timeline_analyze - 完整时间线', async () => {
    const result = await timelineAnalyzeTool.execute({
      chapters: [
        { id: 'ch-001', title: '童年', content: '1990年的故事', timeRange: '1990-1995' },
        { id: 'ch-002', title: '小学', content: '1996年的故事', timeRange: '1996-2001' },
        { id: 'ch-003', title: '中学', content: '2002年的故事', timeRange: '2002-2008' }
      ],
      birthYear: 1990,
      currentYear: 2024
    }, createMockContext())

    assert(result.success, '分析成功')
    assert(result.data.timeline.length === 3, '时间点正确')
    assert(result.data.coverage > 0, '覆盖率大于0')
  })

  await runAsync('timeline_analyze - 有缺失时段', async () => {
    const result = await timelineAnalyzeTool.execute({
      chapters: [
        { id: 'ch-001', title: '童年', content: '内容', timeRange: '1990-1995' },
        { id: 'ch-002', title: '中学', content: '内容', timeRange: '2005-2010' }
      ],
      birthYear: 1990,
      currentYear: 2024
    }, createMockContext())

    assert(result.success, '分析成功')
    assert(result.data.gaps.length > 0, '检测到缺失时段')
  })

  await runAsync('timeline_analyze - 时间冲突', async () => {
    const result = await timelineAnalyzeTool.execute({
      chapters: [
        { id: 'ch-001', title: '章节1', content: '内容', timeRange: '1990-2000' },
        { id: 'ch-002', title: '章节2', content: '内容', timeRange: '1995-2005' }
      ],
      birthYear: 1990,
      currentYear: 2024
    }, createMockContext())

    assert(result.success, '分析成功')
    assert(result.data.conflicts.length > 0, '检测到时间冲突')
  })

  await runAsync('timeline_analyze - 从内容提取年份', async () => {
    const result = await timelineAnalyzeTool.execute({
      chapters: [
        { id: 'ch-001', title: '章节', content: '1995年发生了很多事，1996年也很重要' }
      ],
      birthYear: 1990,
      currentYear: 2024
    }, createMockContext())

    assert(result.success, '分析成功')
    assert(result.data.timeline[0].startYear === 1995, '起始年份正确')
    assert(result.data.timeline[0].endYear === 1996, '结束年份正确')
  })

  await runAsync('timeline_analyze - 空章节报错', async () => {
    const result = await timelineAnalyzeTool.execute({
      chapters: []
    }, createMockContext())

    assert(!result.success, '空章节应失败')
  })
}

// ============================================================
// 工具注册测试
// ============================================================
async function testToolRegistration(): Promise<void> {
  await runAsync('工具注册 - 注册所有自传工具', async () => {
    const registry = new ToolRegistry()
    const unregister = registerAutobiographyTools(registry)

    assertEqual(registry.getAllToolNames().length, autobiographyTools.length, '所有工具已注册')
    assert(registry.get('extract_content') !== undefined, 'extract_content 已注册')
    assert(registry.get('merge_draft') !== undefined, 'merge_draft 已注册')
    assert(registry.get('generate_questions') !== undefined, 'generate_questions 已注册')
    assert(registry.get('check_consistency') !== undefined, 'check_consistency 已注册')
    assert(registry.get('timeline_analyze') !== undefined, 'timeline_analyze 已注册')

    unregister()
    assertEqual(registry.getAllToolNames().length, 0, '注销后工具移除')
  })

  await runAsync('工具注册 - Agent集成测试', async () => {
    const agent = new AutobiographyAgent({ storage: new MemoryStorageAdapter() })
    agent.registerTools(autobiographyTools)

    const session = await agent.createSession('ch-001', mockContext)
    agent.activateTools(session.id, autobiographyTools.map(t => t.name))

    for (const tool of autobiographyTools) {
      assert(
        agent.toolRegistry.isAvailable(session.id, tool.name),
        `${tool.name} 对会话可用`
      )
    }
  })
}

// ============================================================
// 辅助函数
// ============================================================
function createMockContext() {
  return {
    sessionId: 'test-session',
    chapterId: 'test-chapter',
    sessionContext: mockContext,
    signal: new AbortController().signal
  }
}

// ============================================================
// 运行所有测试
// ============================================================
async function main(): Promise<void> {
  console.log('='.repeat(60))
  console.log('Phase 2 工具系统 - 逻辑验证')
  console.log('='.repeat(60))

  await testExtractContent()
  await testMergeDraft()
  await testGenerateQuestions()
  await testCheckConsistency()
  await testTimelineAnalyze()
  await testToolRegistration()

  console.log('\n' + '='.repeat(60))
  console.log(`测试结果: ${passed} 通过, ${failed} 失败`)
  console.log('='.repeat(60))

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch(console.error)
