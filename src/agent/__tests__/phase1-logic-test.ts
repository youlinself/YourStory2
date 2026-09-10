/**
 * Phase 1 Agent 框架 - 逻辑验证脚本
 * 运行方式: npx tsx src/agent/__tests__/phase1-logic-test.ts
 */

declare const process: { exit(code?: number): never }

import { SessionManager, MemoryStorageAdapter } from '../session'
import { ToolRegistry } from '../tools'
import { EventEmitter, SessionLog, MemoryEventStore } from '../events'
import { Agent } from '../Agent'
import type { SessionContext } from '../session/types'
import type { ToolDefinition } from '../tools/ToolTypes'

function createEventEmitter(): EventEmitter {
  return new EventEmitter(new SessionLog(), new MemoryEventStore())
}

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

// ============================================================
// 测试数据
// ============================================================
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

const mockTool: ToolDefinition = {
  name: 'test_tool',
  description: '测试工具',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', description: '输入' }
    }
  },
  async execute(args: any) {
    return { success: true, data: { output: args.input } }
  }
}

const slowTool: ToolDefinition = {
  name: 'slow_tool',
  description: '慢工具',
  parameters: { type: 'object', properties: {} },
  timeoutMs: 100,
  async execute() {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { success: true }
  }
}

// ============================================================
// SessionManager 测试
// ============================================================
async function testSessionManager(): Promise<void> {
  await runAsync('SessionManager - 创建会话', async () => {
    const storage = new MemoryStorageAdapter()
    const manager = new SessionManager(storage)
    const session = await manager.create('ch-001', mockContext)

    assert(session.id.length > 0, '会话 ID 已生成')
    assertEqual(session.chapterId, 'ch-001', '章节 ID 正确')
    assertEqual(session.state.status, 'active', '初始状态为 active')
    assertEqual(session.history.length, 0, '历史记录为空')
    assertEqual(session.state.tokenBudget.limit, 100000, 'Token 限额正确')
  })

  await runAsync('SessionManager - 恢复会话', async () => {
    const storage = new MemoryStorageAdapter()
    const manager = new SessionManager(storage)
    const created = await manager.create('ch-001', mockContext)

    const resumed = await manager.resume(created.id)
    assert(resumed !== null, '会话可恢复')
    assertEqual(resumed?.id, created.id, '恢复的会话 ID 一致')
  })

  await runAsync('SessionManager - 暂停/关闭会话', async () => {
    const storage = new MemoryStorageAdapter()
    const manager = new SessionManager(storage)
    const session = await manager.create('ch-001', mockContext)

    await manager.pause(session.id)
    assertEqual(manager.get(session.id)?.state.status, 'paused', '状态变为 paused')

    await manager.close(session.id)
    assertEqual(manager.get(session.id)?.state.status, 'closed', '状态变为 closed')
  })

  await runAsync('SessionManager - 添加对话轮次', async () => {
    const storage = new MemoryStorageAdapter()
    const manager = new SessionManager(storage)
    const session = await manager.create('ch-001', mockContext)

    await manager.addTurn(session.id, {
      role: 'user',
      content: '你好',
      timestamp: Date.now()
    })

    assertEqual(manager.get(session.id)?.history.length, 1, '历史记录增加')
    assertEqual(manager.get(session.id)?.history[0].content, '你好', '内容正确')
  })

  await runAsync('SessionManager - Token 用量更新与警告', async () => {
    const storage = new MemoryStorageAdapter()
    const manager = new SessionManager(storage)
    const session = await manager.create('ch-001', mockContext)

    const isWarning1 = await manager.updateTokenUsage(session.id, 50000)
    assertEqual(isWarning1, false, '50000 未触发警告')

    const isWarning2 = await manager.updateTokenUsage(session.id, 40000)
    assertEqual(isWarning2, true, '90000 触发警告（阈值 80000）')

    assertEqual(manager.get(session.id)?.state.tokenBudget.used, 90000, 'Token 累计正确')
  })

  await runAsync('SessionManager - 获取活跃会话', async () => {
    const storage = new MemoryStorageAdapter()
    const manager = new SessionManager(storage)
    const s1 = await manager.create('ch-001', mockContext)
    const s2 = await manager.create('ch-002', mockContext)
    await manager.pause(s2.id)

    const active = manager.getActiveSessions()
    assertEqual(active.length, 1, '只有 1 个活跃会话')
    assertEqual(active[0].id, s1.id, '活跃会话正确')
  })

  await runAsync('SessionManager - 清理过期会话', async () => {
    const storage = new MemoryStorageAdapter()
    const manager = new SessionManager(storage)
    const session = await manager.create('ch-001', mockContext)

    const fakeNow = Date.now() + 25 * 60 * 60 * 1000
    const originalDateNow = Date.now
    Date.now = () => fakeNow

    const cleaned = await manager.cleanup(24 * 60 * 60 * 1000)
    assertEqual(cleaned, 1, '清理了 1 个过期会话')
    assertEqual(manager.get(session.id), undefined, '过期会话已从内存移除')

    Date.now = originalDateNow
  })

  await runAsync('SessionManager - 持久化验证', async () => {
    const storage = new MemoryStorageAdapter()
    const manager = new SessionManager(storage)
    const session = await manager.create('ch-001', mockContext)

    const persisted = await storage.get<{ id: string }>(`session:${session.id}`)
    assert(persisted !== null, '会话已持久化到存储')
    assertEqual(persisted?.id, session.id, '持久化数据 ID 一致')
  })
}

// ============================================================
// ToolRegistry 测试
// ============================================================
async function testToolRegistry(): Promise<void> {
  await runAsync('ToolRegistry - 注册工具', async () => {
    const registry = new ToolRegistry()
    const unregister = registry.register(mockTool)

    assertEqual(registry.getAllToolNames().length, 1, '工具已注册')
    assert(registry.get('test_tool') !== undefined, '可获取工具定义')

    unregister()
    assertEqual(registry.getAllToolNames().length, 0, '注销后工具移除')
  })

  await runAsync('ToolRegistry - 重复注册报错', async () => {
    const registry = new ToolRegistry()
    registry.register(mockTool)

    let threw = false
    try {
      registry.register(mockTool)
    } catch {
      threw = true
    }
    assert(threw, '重复注册抛出异常')
  })

  await runAsync('ToolRegistry - 作用域隔离', async () => {
    const registry = new ToolRegistry()
    registry.register(mockTool)

    const sessionId1 = 'session-001'
    const sessionId2 = 'session-002'

    registry.activateForSession(sessionId1, ['test_tool'])
    registry.activateForSession(sessionId2, ['test_tool'])

    assert(registry.isAvailable(sessionId1, 'test_tool'), '会话1 可用工具')
    assert(registry.isAvailable(sessionId2, 'test_tool'), '会话2 可用工具')

    registry.deactivateForSession(sessionId1, ['test_tool'])
    assert(!registry.isAvailable(sessionId1, 'test_tool'), '会话1 工具已停用')
    assert(registry.isAvailable(sessionId2, 'test_tool'), '会话2 工具仍可用')
  })

  await runAsync('ToolRegistry - 获取可用工具列表', async () => {
    const registry = new ToolRegistry()
    registry.register(mockTool)
    registry.register(slowTool)

    registry.activateForSession('session-001', ['test_tool', 'slow_tool'])
    const tools = registry.getAvailableTools('session-001')

    assertEqual(tools.length, 2, '获取到 2 个工具')
    assert(tools.some(t => t.name === 'test_tool'), '包含 test_tool')
    assert(tools.some(t => t.name === 'slow_tool'), '包含 slow_tool')
  })

  await runAsync('ToolRegistry - 未激活会话无工具', async () => {
    const registry = new ToolRegistry()
    registry.register(mockTool)

    const tools = registry.getAvailableTools('session-no-tools')
    assertEqual(tools.length, 0, '未激活会话返回空数组')
  })

  await runAsync('ToolRegistry - 清理会话绑定', async () => {
    const registry = new ToolRegistry()
    registry.register(mockTool)
    registry.activateForSession('session-001', ['test_tool'])

    registry.cleanupSession('session-001')
    assert(!registry.isAvailable('session-001', 'test_tool'), '清理后工具不可用')
  })

  await runAsync('ToolRegistry - 执行工具', async () => {
    const registry = new ToolRegistry()
    registry.register(mockTool)
    registry.activateForSession('session-001', ['test_tool'])

    const result = await registry.execute('session-001', 'test_tool', { input: 'hello' })
    assertEqual(result.success, true, '执行成功')
    assertEqual(result.data.output, 'hello', '返回数据正确')
  })

  await runAsync('ToolRegistry - 执行未注册工具报错', async () => {
    const registry = new ToolRegistry()

    let threw = false
    try {
      await registry.execute('session-001', 'non_existent', {})
    } catch {
      threw = true
    }
    assert(threw, '执行未注册工具抛出异常')
  })

  await runAsync('ToolRegistry - 执行未激活工具报错', async () => {
    const registry = new ToolRegistry()
    registry.register(mockTool)

    let threw = false
    try {
      await registry.execute('session-001', 'test_tool', {})
    } catch {
      threw = true
    }
    assert(threw, '执行未激活工具抛出异常')
  })

  await runAsync('ToolRegistry - 超时处理', async () => {
    const registry = new ToolRegistry()
    registry.register(slowTool)
    registry.activateForSession('session-001', ['slow_tool'])

    let threw = false
    try {
      await registry.execute('session-001', 'slow_tool', {}, { timeoutMs: 50 })
    } catch (error: any) {
      threw = true
      assert(error.message.includes('timeout'), '超时错误信息正确')
    }
    assert(threw, '超时抛出异常')
  })
}

// ============================================================
// EventEmitter 测试
// ============================================================
async function testEventEmitter(): Promise<void> {
  await runAsync('EventEmitter - 基本发布订阅', async () => {
    const emitter = createEventEmitter()
    let received: any = null

    emitter.on('session/created', (payload) => {
      received = payload
    })

    emitter.emit('session/created', { sessionId: 's1', chapterId: 'c1' })
    assertEqual(received?.sessionId, 's1', '同步事件接收成功')
  })

  await runAsync('EventEmitter - 取消订阅', async () => {
    const emitter = createEventEmitter()
    let count = 0

    const unsubscribe = emitter.on('session/created', () => {
      count++
    })

    emitter.emit('session/created', { sessionId: 's1', chapterId: 'c1' })
    unsubscribe()
    emitter.emit('session/created', { sessionId: 's2', chapterId: 'c2' })

    assertEqual(count, 1, '取消订阅后不再接收')
  })

  await runAsync('EventEmitter - 异步事件', async () => {
    const emitter = createEventEmitter()
    let received = false

    emitter.onAsync('turn/complete', async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      received = true
    })

    await emitter.emitAsync('turn/complete', {
      sessionId: 's1',
      assistantResponse: 'ok',
      tokensUsed: 100
    })
    assert(received, '异步事件处理完成')
  })

  await runAsync('EventEmitter - 一次性订阅', async () => {
    const emitter = createEventEmitter()
    let count = 0

    emitter.once('session/created', () => {
      count++
    })

    emitter.emit('session/created', { sessionId: 's1', chapterId: 'c1' })
    emitter.emit('session/created', { sessionId: 's2', chapterId: 'c2' })

    assertEqual(count, 1, 'once 只执行一次')
  })

  await runAsync('EventEmitter - 事件过滤', async () => {
    const emitter = createEventEmitter()
    let received: any = null

    emitter.on('session/created', (payload) => {
      received = payload
    }, { sessionId: 's1' })

    emitter.emit('session/created', { sessionId: 's2', chapterId: 'c2' })
    assert(received === null, '不匹配过滤条件，不触发')

    emitter.emit('session/created', { sessionId: 's1', chapterId: 'c1' })
    assertEqual(received?.chapterId, 'c1', '匹配过滤条件，触发')
  })

  await runAsync('EventEmitter - 监听器数量统计', async () => {
    const emitter = createEventEmitter()
    emitter.on('session/created', () => {})
    emitter.on('session/created', () => {})
    emitter.onAsync('session/created', async () => {})

    assertEqual(emitter.listenerCount('session/created'), 3, '监听器数量正确')
  })

  await runAsync('EventEmitter - 移除所有监听器', async () => {
    const emitter = createEventEmitter()
    emitter.on('session/created', () => {})
    emitter.on('turn/start', () => {})

    emitter.removeAllListeners('session/created')
    assertEqual(emitter.listenerCount('session/created'), 0, '指定事件监听器已移除')
    assertEqual(emitter.listenerCount('turn/start'), 1, '其他事件不受影响')

    emitter.removeAllListeners()
    assertEqual(emitter.listenerCount('turn/start'), 0, '所有监听器已移除')
  })

  await runAsync('EventEmitter - 错误隔离', async () => {
    const emitter = createEventEmitter()
    let secondCalled = false

    emitter.on('session/created', () => {
      throw new Error('监听器错误')
    })
    emitter.on('session/created', () => {
      secondCalled = true
    })

    emitter.emit('session/created', { sessionId: 's1', chapterId: 'c1' })
    assert(secondCalled, '第一个监听器错误不影响第二个')
  })
}

// ============================================================
// AutobiographyAgent 集成测试
// ============================================================
async function testAutobiographyAgent(): Promise<void> {
  await runAsync('AutobiographyAgent - 创建和恢复会话', async () => {
    const agent = new Agent({ storage: new MemoryStorageAdapter() })
    const session = await agent.createSession('ch-001', mockContext)

    assert(session.id.length > 0, '会话创建成功')

    const resumed = await agent.resumeSession(session.id)
    assert(resumed !== null, '会话恢复成功')
    assertEqual(resumed?.id, session.id, 'ID 一致')
  })

  await runAsync('AutobiographyAgent - 工具注册与执行', async () => {
    const agent = new Agent({ storage: new MemoryStorageAdapter() })
    const session = await agent.createSession('ch-001', mockContext)

    agent.registerTool(mockTool)
    agent.activateTools(session.id, ['test_tool'])

    const result = await agent.executeTool(session.id, 'test_tool', { input: 'test' })
    assertEqual(result.success, true, '工具执行成功')
    assertEqual(result.data.output, 'test', '返回数据正确')
  })

  await runAsync('AutobiographyAgent - 工具调用记录到历史', async () => {
    const agent = new Agent({ storage: new MemoryStorageAdapter() })
    const session = await agent.createSession('ch-001', mockContext)

    agent.registerTool(mockTool)
    agent.activateTools(session.id, ['test_tool'])
    await agent.executeTool(session.id, 'test_tool', { input: 'test' })

    const updatedSession = agent.getSession(session.id)
    assertEqual(updatedSession?.history.length, 1, '历史记录增加')
    assertEqual(updatedSession?.history[0].toolCalls?.length, 1, '工具调用记录存在')
  })

  await runAsync('AutobiographyAgent - 事件触发', async () => {
    const agent = new Agent({ storage: new MemoryStorageAdapter() })
    let createdEvent = false
    let toolCalledEvent = false

    agent.events.on('session/created', () => { createdEvent = true })
    agent.events.on('tool/called', () => { toolCalledEvent = true })

    const session = await agent.createSession('ch-001', mockContext)
    agent.registerTool(mockTool)
    agent.activateTools(session.id, ['test_tool'])
    await agent.executeTool(session.id, 'test_tool', {})

    assert(createdEvent, 'session/created 事件触发')
    assert(toolCalledEvent, 'tool/called 事件触发')
  })

  await runAsync('AutobiographyAgent - 暂停和关闭会话', async () => {
    const agent = new Agent({ storage: new MemoryStorageAdapter() })
    const session = await agent.createSession('ch-001', mockContext)

    await agent.pauseSession(session.id)
    assertEqual(agent.getSession(session.id)?.state.status, 'paused', '会话已暂停')

    await agent.closeSession(session.id)
    assertEqual(agent.getSession(session.id)?.state.status, 'closed', '会话已关闭')
  })

  await runAsync('AutobiographyAgent - 获取活跃会话', async () => {
    const agent = new Agent({ storage: new MemoryStorageAdapter() })
    const s1 = await agent.createSession('ch-001', mockContext)
    await agent.createSession('ch-002', mockContext)
    await agent.pauseSession(s1.id)

    const active = agent.getActiveSessions()
    assertEqual(active.length, 1, '活跃会话数量正确')
  })

  await runAsync('AutobiographyAgent - 销毁清理', async () => {
    const agent = new Agent({ storage: new MemoryStorageAdapter() })
    await agent.createSession('ch-001', mockContext)

    agent.dispose()
    assertEqual(agent.events.listenerCount('session/created'), 0, '事件监听器已清理')
  })

  await runAsync('AutobiographyAgent - 执行未激活工具报错', async () => {
    const agent = new Agent({ storage: new MemoryStorageAdapter() })
    const session = await agent.createSession('ch-001', mockContext)

    agent.registerTool(mockTool)
    // 不激活工具

    let threw = false
    try {
      await agent.executeTool(session.id, 'test_tool', {})
    } catch {
      threw = true
    }
    assert(threw, '执行未激活工具抛出异常')
  })
}

// ============================================================
// 运行所有测试
// ============================================================
async function main(): Promise<void> {
  console.log('='.repeat(60))
  console.log('Phase 1 Agent 框架 - 逻辑验证')
  console.log('='.repeat(60))

  await testSessionManager()
  await testToolRegistry()
  await testEventEmitter()
  await testAutobiographyAgent()

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
