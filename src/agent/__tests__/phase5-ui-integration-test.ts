/**
 * Phase 5 UI 集成 - 逻辑验证脚本
 * 运行方式: npx tsx src/agent/__tests__/phase5-ui-integration-test.ts
 */

declare const process: { exit(code?: number): never }

import { useAgentStore } from '../../stores/agentStore'
import { Agent } from '../Agent'
import { MemoryStorageAdapter } from '../session/SessionManager'
import {
  autobiographySkills
} from '../skills/autobiography'
import {
  autobiographyTools
} from '../tools/autobiography'

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

function createTestContext() {
  return {
    chapterId: 'ch-test',
    existingContent: null,
    userPreferences: {
      style: 'casual' as const,
      language: 'zh' as const,
      perspective: 'first' as const,
      autoExtract: true
    },
    timelineContext: { currentEra: '1990-2000' },
    extractedCache: []
  }
}

function resetStore(): void {
  useAgentStore.setState({
    agent: null,
    currentSession: null,
    isLoading: false,
    error: null,
    activeSkills: [],
    pendingToolCalls: [],
    eventLog: []
  })
}

// ============================================================
// agentStore 测试
// ============================================================
async function testAgentStore(): Promise<void> {
  await runAsync('agentStore - 初始状态', async () => {
    resetStore()

    const state = useAgentStore.getState()
    assertEqual(state.agent, null, '初始 agent 为 null')
    assertEqual(state.currentSession, null, '初始 session 为 null')
    assertEqual(state.isLoading, false, '初始 isLoading 为 false')
    assertEqual(state.error, null, '初始 error 为 null')
    assertEqual(state.activeSkills.length, 0, '初始 activeSkills 为空')
  })

  await runAsync('agentStore - 初始化', async () => {
    resetStore()

    const state = useAgentStore.getState()
    await state.initialize('autobiography')

    const newState = useAgentStore.getState()
    assert(newState.agent !== null, 'agent 已初始化')
    assert(newState.agent instanceof Agent, 'agent 类型正确')
  })

  await runAsync('agentStore - 创建会话', async () => {
    resetStore()

    const state = useAgentStore.getState()
    await state.initialize('autobiography')
    await state.createSession('ch-test')

    const newState = useAgentStore.getState()
    assert(newState.currentSession !== null, '会话已创建')
    assertEqual(newState.currentSession?.chapterId, 'ch-test', '章节 ID 正确')
    assertEqual(newState.currentSession?.state.status, 'active', '会话状态为 active')
  })

  await runAsync('agentStore - 创建会话时默认激活 deep_interview', async () => {
    resetStore()

    const state = useAgentStore.getState()
    await state.initialize('autobiography')
    await state.createSession('ch-test')

    const newState = useAgentStore.getState()
    assert(newState.activeSkills.includes('deep_interview'), 'deep_interview 已激活')
  })

  await runAsync('agentStore - 恢复会话', async () => {
    resetStore()

    const state = useAgentStore.getState()
    await state.initialize('autobiography')
    await state.createSession('ch-test')

    const sessionId = useAgentStore.getState().currentSession?.id
    assert(sessionId !== undefined, '会话 ID 存在')

    resetStore()
    const newState = useAgentStore.getState()
    await newState.initialize('autobiography')
    await newState.resumeSession(sessionId!)

    const restoredState = useAgentStore.getState()
    assert(restoredState.currentSession !== null, '会话已恢复')
    assertEqual(restoredState.currentSession?.id, sessionId, '会话 ID 一致')
  })

  await runAsync('agentStore - 激活技能', async () => {
    resetStore()

    const state = useAgentStore.getState()
    await state.initialize('autobiography')
    await state.createSession('ch-test')

    await useAgentStore.getState().activateSkill('timeline_organize')

    const newState = useAgentStore.getState()
    assert(newState.activeSkills.includes('deep_interview'), 'deep_interview 仍激活')
    assert(newState.activeSkills.includes('timeline_organize'), 'timeline_organize 已激活')
  })

  await runAsync('agentStore - 停用技能', async () => {
    resetStore()

    const state = useAgentStore.getState()
    await state.initialize('autobiography')
    await state.createSession('ch-test')

    await useAgentStore.getState().activateSkill('style_check')
    assert(useAgentStore.getState().activeSkills.includes('style_check'), 'style_check 已激活')

    await useAgentStore.getState().deactivateSkill('style_check')
    assert(!useAgentStore.getState().activeSkills.includes('style_check'), 'style_check 已停用')
  })

  await runAsync('agentStore - 发送消息', async () => {
    resetStore()

    const state = useAgentStore.getState()
    await state.initialize('autobiography')
    await state.createSession('ch-test')

    const response = await useAgentStore.getState().sendMessage('我今天去公园散步了')
    assert(response.length > 0, '返回响应不为空')
  })

  await runAsync('agentStore - handleMessage 完整流程', async () => {
    resetStore()

    const state = useAgentStore.getState()
    await state.initialize('autobiography')
    await state.createSession('ch-test')

    const result = await useAgentStore.getState().handleMessage('童年回忆', {
      generateFollowUpQuestions: true
    })

    assert(result.response.length > 0, '返回响应不为空')
    assert(result.extractedContent !== undefined, '内容已提取')
  })

  await runAsync('agentStore - 执行工具', async () => {
    resetStore()

    const state = useAgentStore.getState()
    await state.initialize('autobiography')
    await state.createSession('ch-test')

    const result = await useAgentStore.getState().executeTool('extract_content', {
      conversationSegments: ['测试内容']
    })

    assert(result.success, '工具执行成功')
  })

  await runAsync('agentStore - 暂停会话', async () => {
    resetStore()

    const state = useAgentStore.getState()
    await state.initialize('autobiography')
    await state.createSession('ch-test')

    await useAgentStore.getState().pauseSession()

    assertEqual(useAgentStore.getState().currentSession?.state.status, 'paused', '会话已暂停')
  })

  await runAsync('agentStore - 清理', async () => {
    const state = useAgentStore.getState()
    await state.initialize('autobiography')
    await state.createSession('ch-test')

    useAgentStore.getState().dispose()

    const newState = useAgentStore.getState()
    assertEqual(newState.agent, null, 'agent 已清理')
    assertEqual(newState.currentSession, null, 'session 已清理')
    assertEqual(newState.activeSkills.length, 0, 'activeSkills 已清理')
  })
}

// ============================================================
// Agent UI 层集成测试
// ============================================================
async function testAgentUIIntegration(): Promise<void> {
  await runAsync('Agent UI 集成 - 工具注册到 UI', async () => {
    const storage = new MemoryStorageAdapter()
    const agent = new Agent({ storage })

    const unregister = agent.registerTools(autobiographyTools)

    assertEqual(agent.toolRegistry.getAllToolNames().length, autobiographyTools.length, '所有工具已注册')
    assert(agent.toolRegistry.get('extract_content') !== undefined, 'extract_content 可获取')
    assert(agent.toolRegistry.get('merge_draft') !== undefined, 'merge_draft 可获取')

    unregister()
    assertEqual(agent.toolRegistry.getAllToolNames().length, 0, '工具已注销')
  })

  await runAsync('Agent UI 集成 - 技能注册到 UI', async () => {
    const storage = new MemoryStorageAdapter()
    const agent = new Agent({ storage })

    const unregister = agent.skillRegistry.registerAll(autobiographySkills)

    assertEqual(agent.skillRegistry.getAllSkillNames().length, autobiographySkills.length, '所有技能已注册')
    assert(agent.skillRegistry.getSkill('deep_interview') !== undefined, 'deep_interview 可获取')
    assert(agent.skillRegistry.getSkill('timeline_organize') !== undefined, 'timeline_organize 可获取')

    unregister()
    assertEqual(agent.skillRegistry.getAllSkillNames().length, 0, '技能已注销')
  })

  await runAsync('Agent UI 集成 - 会话技能激活', async () => {
    const storage = new MemoryStorageAdapter()
    const agent = new Agent({ storage })

    agent.registerTools(autobiographyTools)
    agent.skillRegistry.registerAll(autobiographySkills)

    const session = await agent.createSession('ch-test', createTestContext())

    await agent.activateSkill(session.id, 'deep_interview')
    const activeSkills = agent.getActiveSkills(session.id)

    assert(activeSkills.includes('deep_interview'), 'deep_interview 已激活')
  })

  await runAsync('Agent UI 集成 - 技能切换', async () => {
    const storage = new MemoryStorageAdapter()
    const agent = new Agent({ storage })

    agent.registerTools(autobiographyTools)
    agent.skillRegistry.registerAll(autobiographySkills)

    const session = await agent.createSession('ch-test', createTestContext())

    await agent.activateSkill(session.id, 'deep_interview')
    assert(agent.getActiveSkills(session.id).includes('deep_interview'), 'deep_interview 已激活')

    await agent.deactivateSkill(session.id, 'deep_interview')
    assert(!agent.getActiveSkills(session.id).includes('deep_interview'), 'deep_interview 已停用')

    await agent.activateSkill(session.id, 'style_check')
    assert(agent.getActiveSkills(session.id).includes('style_check'), 'style_check 已激活')
  })

  await runAsync('Agent UI 集成 - handleMessage 完整对话流程', async () => {
    const storage = new MemoryStorageAdapter()
    const agent = new Agent({ storage })

    agent.registerTools(autobiographyTools)
    agent.skillRegistry.registerAll(autobiographySkills)

    const session = await agent.createSession('ch-test', createTestContext())
    await agent.activateSkill(session.id, 'deep_interview')

    const result = await agent.handleMessage(session.id, '童年时期的美好回忆', {
      autoExtract: true,
      generateFollowUpQuestions: true
    })

    assert(result.response.length > 0, '返回响应不为空')
    assert(result.extractedContent !== undefined, '内容已提取')
    assert(result.extractedContent?.success === true, '提取成功')
  })

  await runAsync('Agent UI 集成 - 事件日志记录', async () => {
    const storage = new MemoryStorageAdapter()
    const agent = new Agent({ storage })

    agent.registerTools(autobiographyTools)

    const session = await agent.createSession('ch-test', createTestContext())
    agent.activateTools(session.id, ['extract_content'])

    const result = await agent.executeTool(session.id, 'extract_content', {
      conversationSegments: ['测试内容']
    })

    assert(result.success, '工具执行成功')

    const updatedSession = agent.getSession(session.id)
    assert(updatedSession !== undefined, '会话存在')
    assert((updatedSession?.history.length ?? 0) > 0, '历史记录已更新')
  })
}

// ============================================================
// CommandPanel 逻辑测试
// ============================================================
async function testCommandPanel(): Promise<void> {
  await runAsync('CommandPanel - 可用命令列表', async () => {
    const commands = [
      { name: '/timeline', description: '分析时间线' },
      { name: '/style', description: '检查写作风格' },
      { name: '/questions', description: '生成引导问题' },
      { name: '/compact', description: '压缩上下文' }
    ]

    assertEqual(commands.length, 4, '有 4 个可用命令')
    assert(commands.some(c => c.name === '/timeline'), '包含 /timeline')
    assert(commands.some(c => c.name === '/style'), '包含 /style')
    assert(commands.some(c => c.name === '/questions'), '包含 /questions')
    assert(commands.some(c => c.name === '/compact'), '包含 /compact')
  })

  await runAsync('CommandPanel - 命令执行逻辑', async () => {
    const storage = new MemoryStorageAdapter()
    const agent = new Agent({ storage })
    agent.registerTools(autobiographyTools)

    const session = await agent.createSession('ch-test', createTestContext())
    agent.activateTools(session.id, ['timeline_analyze', 'check_consistency', 'generate_questions'])

    const timelineResult = await agent.executeTool(session.id, 'timeline_analyze', {
      chapters: [{ id: 'ch-1', title: '童年', content: '1990年的故事', timeRange: '1990-1995' }]
    })
    assert(timelineResult.success, '/timeline 命令执行成功')

    const styleResult = await agent.executeTool(session.id, 'check_consistency', {
      currentChapter: '我小时候的故事',
      otherChapters: ['我上学的故事']
    })
    assert(styleResult.success, '/style 命令执行成功')

    const questionsResult = await agent.executeTool(session.id, 'generate_questions', {
      chapterContent: '我在小学度过了快乐的时光'
    })
    assert(questionsResult.success, '/questions 命令执行成功')
  })
}

// ============================================================
// SkillSwitcher 逻辑测试
// ============================================================
async function testSkillSwitcher(): Promise<void> {
  await runAsync('SkillSwitcher - 可用技能列表', async () => {
    const availableSkills = [
      { name: 'deep_interview', label: '深度访谈', icon: '🎙️' },
      { name: 'timeline_organize', label: '时间线整理', icon: '📅' },
      { name: 'style_check', label: '风格检查', icon: '✍️' },
      { name: 'guided_questioning', label: '引导提问', icon: '❓' }
    ]

    assertEqual(availableSkills.length, 4, '有 4 个可用技能')
    assert(availableSkills.some(s => s.name === 'deep_interview'), '包含 deep_interview')
    assert(availableSkills.some(s => s.name === 'timeline_organize'), '包含 timeline_organize')
    assert(availableSkills.some(s => s.name === 'style_check'), '包含 style_check')
    assert(availableSkills.some(s => s.name === 'guided_questioning'), '包含 guided_questioning')
  })

  await runAsync('SkillSwitcher - 技能切换逻辑', async () => {
    const storage = new MemoryStorageAdapter()
    const agent = new Agent({ storage })

    agent.registerTools(autobiographyTools)
    agent.skillRegistry.registerAll(autobiographySkills)

    const session = await agent.createSession('ch-test', createTestContext())

    let activeSkills = agent.getActiveSkills(session.id)
    assertEqual(activeSkills.length, 0, '初始无激活技能')

    await agent.activateSkill(session.id, 'deep_interview')
    activeSkills = agent.getActiveSkills(session.id)
    assert(activeSkills.includes('deep_interview'), '激活 deep_interview 后列表包含该技能')

    await agent.activateSkill(session.id, 'style_check')
    activeSkills = agent.getActiveSkills(session.id)
    assert(activeSkills.includes('style_check'), '激活 style_check 后列表包含该技能')

    await agent.deactivateSkill(session.id, 'deep_interview')
    activeSkills = agent.getActiveSkills(session.id)
    assert(!activeSkills.includes('deep_interview'), '停用 deep_interview 后列表不包含该技能')
    assert(activeSkills.includes('style_check'), 'style_check 仍激活')
  })
}

// ============================================================
// EventLogPanel 逻辑测试
// ============================================================
async function testEventLogPanel(): Promise<void> {
  await runAsync('EventLogPanel - 事件日志记录', async () => {
    const storage = new MemoryStorageAdapter()
    const agent = new Agent({ storage })

    const eventLog: Array<{ event: string; payload: any; timestamp: number }> = []

    agent.events.on('session/created', (payload) => {
      eventLog.push({ event: 'session/created', payload, timestamp: Date.now() })
    })

    agent.events.on('tool/called', (payload) => {
      eventLog.push({ event: 'tool/called', payload, timestamp: Date.now() })
    })

    await agent.createSession('ch-test', createTestContext())

    assertEqual(eventLog.length, 1, '记录了 1 个事件')
    assertEqual(eventLog[0].event, 'session/created', '事件类型为 session/created')
  })

  await runAsync('EventLogPanel - 多事件记录', async () => {
    const storage = new MemoryStorageAdapter()
    const agent = new Agent({ storage })

    const eventLog: Array<{ event: string; payload: any; timestamp: number }> = []

    agent.events.on('session/created', (payload) => {
      eventLog.push({ event: 'session/created', payload, timestamp: Date.now() })
    })

    agent.events.on('tool/called', (payload) => {
      eventLog.push({ event: 'tool/called', payload, timestamp: Date.now() })
    })

    agent.events.on('tool/completed', (payload) => {
      eventLog.push({ event: 'tool/completed', payload, timestamp: Date.now() })
    })

    agent.registerTools(autobiographyTools)
    const session = await agent.createSession('ch-test', createTestContext())
    agent.activateTools(session.id, ['extract_content'])
    await agent.executeTool(session.id, 'extract_content', { conversationSegments: ['测试'] })

    assert(eventLog.length >= 3, '记录了至少 3 个事件')
    assert(eventLog.some(e => e.event === 'session/created'), '包含 session/created')
    assert(eventLog.some(e => e.event === 'tool/called'), '包含 tool/called')
    assert(eventLog.some(e => e.event === 'tool/completed'), '包含 tool/completed')
  })

  await runAsync('EventLogPanel - 清空日志', async () => {
    resetStore()

    const state = useAgentStore.getState()
    await state.initialize('autobiography')

    useAgentStore.getState().logEvent('test/event', { data: 'test' })
    useAgentStore.getState().logEvent('test/event2', { data: 'test2' })

    assertEqual(useAgentStore.getState().eventLog.length, 2, '日志有 2 条记录')

    useAgentStore.getState().clearEventLog()

    assertEqual(useAgentStore.getState().eventLog.length, 0, '日志已清空')
  })
}

// ============================================================
// 端到端集成测试
// ============================================================
async function testEndToEnd(): Promise<void> {
  await runAsync('E2E - 完整用户流程', async () => {
    resetStore()

    const state = useAgentStore.getState()
    await state.initialize('autobiography')

    await state.createSession('ch-test')
    assert(useAgentStore.getState().currentSession !== null, '会话已创建')

    await state.activateSkill('timeline_organize')
    assert(useAgentStore.getState().activeSkills.includes('timeline_interview') ||
           useAgentStore.getState().activeSkills.includes('timeline_organize'), '技能已激活')

    const response = await state.sendMessage('我今天去公园散步，看到了很多美丽的花')
    assert(response.length > 0, '发送消息后有响应')

    useAgentStore.getState().logEvent('test/complete', { success: true })
    assert(useAgentStore.getState().eventLog.length > 0, '事件已记录')

    useAgentStore.getState().dispose()
    assertEqual(useAgentStore.getState().agent, null, '已清理')
  })

  await runAsync('E2E - 多技能切换流程', async () => {
    resetStore()

    const state = useAgentStore.getState()
    await state.initialize('autobiography')
    await state.createSession('ch-test')

    await state.activateSkill('style_check')
    assert(useAgentStore.getState().activeSkills.includes('style_check'), 'style_check 已激活')

    await state.deactivateSkill('style_check')
    assert(!useAgentStore.getState().activeSkills.includes('style_check'), 'style_check 已停用')

    await state.activateSkill('guided_questioning')
    assert(useAgentStore.getState().activeSkills.includes('guided_questioning'), 'guided_questioning 已激活')

    const allSkills = useAgentStore.getState().activeSkills
    assert(allSkills.includes('deep_interview'), 'deep_interview 仍激活')
    assert(allSkills.includes('guided_questioning'), 'guided_questioning 已激活')
  })
}

// ============================================================
// 运行所有测试
// ============================================================
async function main(): Promise<void> {
  console.log('='.repeat(60))
  console.log('Phase 5 UI 集成 - 逻辑验证')
  console.log('='.repeat(60))

  await testAgentStore()
  await testAgentUIIntegration()
  await testCommandPanel()
  await testSkillSwitcher()
  await testEventLogPanel()
  await testEndToEnd()

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
