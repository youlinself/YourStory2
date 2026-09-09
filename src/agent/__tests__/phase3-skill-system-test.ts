/**
 * Phase 3 技能系统 - 逻辑验证脚本
 * 运行方式: npx tsx src/agent/__tests__/phase3-skill-system-test.ts
 */

declare const process: { exit(code?: number): never }

import { SkillRegistry } from '../skills/SkillRegistry'
import { ToolRegistry } from '../tools/ToolRegistry'
import { EventEmitter, SessionLog, MemoryEventStore } from '../events'
import { AutobiographyAgent } from '../AutobiographyAgent'
import { MemoryStorageAdapter } from '../session'
import {
  deepInterviewSkill,
  timelineOrganizeSkill,
  styleCheckSkill,
  guidedQuestioningSkill,
  registerAutobiographySkills,
  autobiographySkills
} from '../skills/autobiography'

function createEventEmitter(): EventEmitter {
  return new EventEmitter(new SessionLog(), new MemoryEventStore())
}

import type { SkillContext } from '../skills/SkillTypes'
import type { SessionContext } from '../session/types'
import { extractContentTool, generateQuestionsTool, checkConsistencyTool, timelineAnalyzeTool } from '../tools/autobiography'

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

function createMockSkillContext(sessionId: string): SkillContext {
  const agent = new AutobiographyAgent({ storage: new MemoryStorageAdapter() })
  return {
    sessionId,
    chapterId: 'ch-001',
    sessionContext: mockContext,
    agent
  }
}

// ============================================================
// SkillRegistry 测试
// ============================================================
async function testSkillRegistry(): Promise<void> {
  await runAsync('SkillRegistry - 注册技能', async () => {
    const toolRegistry = new ToolRegistry()
    const events = createEventEmitter()
    const registry = new SkillRegistry(toolRegistry, events)

    const unregister = registry.register(deepInterviewSkill)

    assertEqual(registry.getAllSkillNames().length, 1, '技能已注册')
    assert(registry.getSkill('deep_interview') !== undefined, '技能可获取')

    unregister()
    assertEqual(registry.getAllSkillNames().length, 0, '技能已注销')
  })

  await runAsync('SkillRegistry - 重复注册报错', async () => {
    const toolRegistry = new ToolRegistry()
    const events = createEventEmitter()
    const registry = new SkillRegistry(toolRegistry, events)

    registry.register(deepInterviewSkill)

    let threw = false
    try {
      registry.register(deepInterviewSkill)
    } catch (e) {
      threw = true
    }

    assert(threw, '重复注册应抛出异常')
  })

  await runAsync('SkillRegistry - 批量注册', async () => {
    const toolRegistry = new ToolRegistry()
    const events = createEventEmitter()
    const registry = new SkillRegistry(toolRegistry, events)

    const unregister = registry.registerAll(autobiographySkills)

    assertEqual(registry.getAllSkillNames().length, autobiographySkills.length, '所有技能已注册')

    unregister()
    assertEqual(registry.getAllSkillNames().length, 0, '所有技能已注销')
  })

  await runAsync('SkillRegistry - 激活技能', async () => {
    const toolRegistry = new ToolRegistry()
    toolRegistry.register(extractContentTool)
    toolRegistry.register(generateQuestionsTool)

    const events = createEventEmitter()
    const registry = new SkillRegistry(toolRegistry, events)
    registry.register(deepInterviewSkill)

    const sessionId = 'test-session'
    const context = createMockSkillContext(sessionId)

    await registry.activate(sessionId, 'deep_interview', context)

    const activeSkills = registry.getActiveSkills(sessionId)
    assertEqual(activeSkills.length, 1, '技能已激活')
    assertEqual(activeSkills[0].skill.name, 'deep_interview', '激活的技能名称正确')
  })

  await runAsync('SkillRegistry - 激活不存在的技能报错', async () => {
    const toolRegistry = new ToolRegistry()
    const events = createEventEmitter()
    const registry = new SkillRegistry(toolRegistry, events)

    const context = createMockSkillContext('test-session')

    let threw = false
    try {
      await registry.activate('test-session', 'non_existent_skill', context)
    } catch (e) {
      threw = true
    }

    assert(threw, '激活不存在的技能应抛出异常')
  })

  await runAsync('SkillRegistry - 停用技能', async () => {
    const toolRegistry = new ToolRegistry()
    toolRegistry.register(extractContentTool)
    toolRegistry.register(generateQuestionsTool)

    const events = createEventEmitter()
    const registry = new SkillRegistry(toolRegistry, events)
    registry.register(deepInterviewSkill)

    const sessionId = 'test-session'
    const context = createMockSkillContext(sessionId)

    await registry.activate(sessionId, 'deep_interview', context)
    await registry.deactivate(sessionId, 'deep_interview')

    const activeSkills = registry.getActiveSkills(sessionId)
    assertEqual(activeSkills.length, 0, '技能已停用')
  })

  await runAsync('SkillRegistry - 获取 Prompt 片段', async () => {
    const toolRegistry = new ToolRegistry()
    toolRegistry.register(extractContentTool)
    toolRegistry.register(generateQuestionsTool)

    const events = createEventEmitter()
    const registry = new SkillRegistry(toolRegistry, events)
    registry.register(deepInterviewSkill)

    const sessionId = 'test-session'
    const context = createMockSkillContext(sessionId)

    await registry.activate(sessionId, 'deep_interview', context)

    const sections = registry.getPromptSections(sessionId)
    assertEqual(sections.length, deepInterviewSkill.promptSections.length, 'Prompt 片段数量正确')
  })

  await runAsync('SkillRegistry - 清理会话', async () => {
    const toolRegistry = new ToolRegistry()
    toolRegistry.register(extractContentTool)
    toolRegistry.register(generateQuestionsTool)
    toolRegistry.register(checkConsistencyTool)
    toolRegistry.register(timelineAnalyzeTool)

    const events = createEventEmitter()
    const registry = new SkillRegistry(toolRegistry, events)
    registry.registerAll(autobiographySkills)

    const sessionId = 'test-session'
    const context = createMockSkillContext(sessionId)

    await registry.activate(sessionId, 'deep_interview', context)
    await registry.activate(sessionId, 'style_check', context)
    await registry.activate(sessionId, 'timeline_organize', context)

    assertEqual(registry.getActiveSkills(sessionId).length, 3, '3个技能已激活')

    await registry.cleanupSession(sessionId)

    assertEqual(registry.getActiveSkills(sessionId).length, 0, '所有技能已清理')
    assertEqual(registry.getPromptSections(sessionId).length, 0, 'Prompt 片段已清理')
  })

  await runAsync('SkillRegistry - 重复激活不重复注册', async () => {
    const toolRegistry = new ToolRegistry()
    toolRegistry.register(extractContentTool)
    toolRegistry.register(generateQuestionsTool)

    const events = createEventEmitter()
    const registry = new SkillRegistry(toolRegistry, events)
    registry.register(deepInterviewSkill)

    const sessionId = 'test-session'
    const context = createMockSkillContext(sessionId)

    await registry.activate(sessionId, 'deep_interview', context)
    await registry.activate(sessionId, 'deep_interview', context)

    assertEqual(registry.getActiveSkills(sessionId).length, 1, '技能不重复激活')
  })
}

// ============================================================
// DeepInterview 技能测试
// ============================================================
async function testDeepInterview(): Promise<void> {
  await runAsync('DeepInterview - 技能定义完整', async () => {
    assert(deepInterviewSkill.name === 'deep_interview', '技能名称正确')
    assert(deepInterviewSkill.description.length > 0, '技能描述存在')
    assert(deepInterviewSkill.tools.length > 0, '技能工具列表存在')
    assert(deepInterviewSkill.promptSections.length > 0, 'Prompt 片段存在')
    assert(deepInterviewSkill.commands !== undefined, '命令列表存在')
    assert(deepInterviewSkill.on !== undefined, '事件处理器存在')
  })

  await runAsync('DeepInterview - /interview 命令', async () => {
    const command = deepInterviewSkill.commands![0]
    assert(command.name === '/interview', '命令名称正确')

    const context = createMockSkillContext('test-session')
    const result = await command.execute('童年时光', context)

    assert(result.success, '命令执行成功')
    assert(result.output.includes('童年时光'), '输出包含主题')
    assert(result.data.mode === 'deep_interview', '数据包含模式')
  })

  await runAsync('DeepInterview - 默认主题', async () => {
    const command = deepInterviewSkill.commands![0]
    const context = createMockSkillContext('test-session')
    const result = await command.execute('', context)

    assert(result.success, '命令执行成功')
    assert(result.data.topic === 'general', '默认主题为 general')
  })
}

// ============================================================
// TimelineOrganize 技能测试
// ============================================================
async function testTimelineOrganize(): Promise<void> {
  await runAsync('TimelineOrganize - 技能定义完整', async () => {
    assert(timelineOrganizeSkill.name === 'timeline_organize', '技能名称正确')
    assert(timelineOrganizeSkill.tools.includes('timeline_analyze'), '包含 timeline_analyze 工具')
    assert(timelineOrganizeSkill.promptSections.length > 0, 'Prompt 片段存在')
  })

  await runAsync('TimelineOrganize - prompt 片段排序', async () => {
    const section = timelineOrganizeSkill.promptSections[0]
    assert(section.order === 20, 'order 为 20')
    assert(section.content(undefined as any).includes('时间'), '内容包含时间相关描述')
  })
}

// ============================================================
// StyleCheck 技能测试
// ============================================================
async function testStyleCheck(): Promise<void> {
  await runAsync('StyleCheck - 技能定义完整', async () => {
    assert(styleCheckSkill.name === 'style_check', '技能名称正确')
    assert(styleCheckSkill.tools.includes('check_consistency'), '包含 check_consistency 工具')
    assert(styleCheckSkill.promptSections.length > 0, 'Prompt 片段存在')
  })

  await runAsync('StyleCheck - prompt 片段排序', async () => {
    const section = styleCheckSkill.promptSections[0]
    assert(section.order === 30, 'order 为 30')
    assert(section.content(undefined as any).includes('风格'), '内容包含风格相关描述')
  })
}

// ============================================================
// GuidedQuestioning 技能测试
// ============================================================
async function testGuidedQuestioning(): Promise<void> {
  await runAsync('GuidedQuestioning - 技能定义完整', async () => {
    assert(guidedQuestioningSkill.name === 'guided_questioning', '技能名称正确')
    assert(guidedQuestioningSkill.tools.includes('generate_questions'), '包含 generate_questions 工具')
    assert(guidedQuestioningSkill.promptSections.length > 0, 'Prompt 片段存在')
  })

  await runAsync('GuidedQuestioning - prompt 片段排序', async () => {
    const section = guidedQuestioningSkill.promptSections[0]
    assert(section.order === 40, 'order 为 40')
    assert(section.content(undefined as any).includes('提问'), '内容包含提问相关描述')
  })
}

// ============================================================
// 技能注册测试
// ============================================================
async function testSkillRegistration(): Promise<void> {
  await runAsync('技能注册 - 注册所有自传技能', async () => {
    const toolRegistry = new ToolRegistry()
    toolRegistry.register(extractContentTool)
    toolRegistry.register(generateQuestionsTool)
    toolRegistry.register(checkConsistencyTool)
    toolRegistry.register(timelineAnalyzeTool)

    const events = createEventEmitter()
    const registry = new SkillRegistry(toolRegistry, events)

    const unregister = registerAutobiographySkills(registry)

    assertEqual(registry.getAllSkillNames().length, autobiographySkills.length, '所有技能已注册')

    unregister()
    assertEqual(registry.getAllSkillNames().length, 0, '注销后技能移除')
  })
}

// ============================================================
// 集成测试
// ============================================================
async function testIntegration(): Promise<void> {
  await runAsync('集成测试 - Agent 技能激活', async () => {
    const agent = new AutobiographyAgent({ storage: new MemoryStorageAdapter() })

    const toolRegistry = new ToolRegistry()
    toolRegistry.register(extractContentTool)
    toolRegistry.register(generateQuestionsTool)
    toolRegistry.register(checkConsistencyTool)
    toolRegistry.register(timelineAnalyzeTool)

    const events = createEventEmitter()
    const skillRegistry = new SkillRegistry(toolRegistry, events)
    registerAutobiographySkills(skillRegistry)

    const session = await agent.createSession('ch-001', mockContext)

    const context: SkillContext = {
      sessionId: session.id,
      chapterId: 'ch-001',
      sessionContext: mockContext,
      agent
    }

    await skillRegistry.activate(session.id, 'deep_interview', context)

    const activeSkills = skillRegistry.getActiveSkills(session.id)
    assertEqual(activeSkills.length, 1, '技能已激活')
    assertEqual(activeSkills[0].skill.name, 'deep_interview', '激活的技能名称正确')
  })

  await runAsync('集成测试 - 技能工具隔离', async () => {
    const toolRegistry = new ToolRegistry()
    toolRegistry.register(extractContentTool)
    toolRegistry.register(generateQuestionsTool)
    toolRegistry.register(checkConsistencyTool)
    toolRegistry.register(timelineAnalyzeTool)

    const events = createEventEmitter()
    const skillRegistry = new SkillRegistry(toolRegistry, events)
    registerAutobiographySkills(skillRegistry)

    const sessionId1 = 'session-1'
    const sessionId2 = 'session-2'
    const context1 = createMockSkillContext(sessionId1)
    const context2 = createMockSkillContext(sessionId2)

    await skillRegistry.activate(sessionId1, 'deep_interview', context1)
    await skillRegistry.activate(sessionId2, 'style_check', context2)

    const session1Skills = skillRegistry.getActiveSkills(sessionId1)
    const session2Skills = skillRegistry.getActiveSkills(sessionId2)

    assertEqual(session1Skills.length, 1, 'Session 1 有 1 个技能')
    assertEqual(session2Skills.length, 1, 'Session 2 有 1 个技能')
    assertEqual(session1Skills[0].skill.name, 'deep_interview', 'Session 1 激活 deep_interview')
    assertEqual(session2Skills[0].skill.name, 'style_check', 'Session 2 激活 style_check')
  })

  await runAsync('集成测试 - Prompt 片段合并', async () => {
    const toolRegistry = new ToolRegistry()
    toolRegistry.register(extractContentTool)
    toolRegistry.register(generateQuestionsTool)
    toolRegistry.register(checkConsistencyTool)
    toolRegistry.register(timelineAnalyzeTool)

    const events = createEventEmitter()
    const skillRegistry = new SkillRegistry(toolRegistry, events)
    registerAutobiographySkills(skillRegistry)

    const sessionId = 'test-session'
    const context = createMockSkillContext(sessionId)

    await skillRegistry.activate(sessionId, 'deep_interview', context)
    await skillRegistry.activate(sessionId, 'style_check', context)

    const sections = skillRegistry.getPromptSections(sessionId)
    assert(sections.length >= 2, '多个技能 Prompt 片段已合并')
  })

  await runAsync('集成测试 - 技能切换', async () => {
    const toolRegistry = new ToolRegistry()
    toolRegistry.register(extractContentTool)
    toolRegistry.register(generateQuestionsTool)
    toolRegistry.register(checkConsistencyTool)
    toolRegistry.register(timelineAnalyzeTool)

    const events = createEventEmitter()
    const skillRegistry = new SkillRegistry(toolRegistry, events)
    registerAutobiographySkills(skillRegistry)

    const sessionId = 'test-session'
    const context = createMockSkillContext(sessionId)

    await skillRegistry.activate(sessionId, 'deep_interview', context)
    assertEqual(skillRegistry.getActiveSkills(sessionId).length, 1, 'deep_interview 已激活')

    await skillRegistry.deactivate(sessionId, 'deep_interview')
    assertEqual(skillRegistry.getActiveSkills(sessionId).length, 0, 'deep_interview 已停用')

    await skillRegistry.activate(sessionId, 'timeline_organize', context)
    assertEqual(skillRegistry.getActiveSkills(sessionId).length, 1, 'timeline_organize 已激活')
  })
}

// ============================================================
// 运行所有测试
// ============================================================
async function main(): Promise<void> {
  console.log('='.repeat(60))
  console.log('Phase 3 技能系统 - 逻辑验证')
  console.log('='.repeat(60))

  await testSkillRegistry()
  await testDeepInterview()
  await testTimelineOrganize()
  await testStyleCheck()
  await testGuidedQuestioning()
  await testSkillRegistration()
  await testIntegration()

  console.log('\n' + '='.repeat(60))
  console.log(`测试结果: ${passed} 通过, ${failed} 失败`)
  console.log('='.repeat(60))

  if (failed > 0) {
    throw new Error(`${failed} tests failed`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
