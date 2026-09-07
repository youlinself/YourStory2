# TypeScript 代码规范

本规范用于防止常见的 TypeScript 编译错误，确保代码质量和一致性。

## 1. 类型定义规范

### 1.1 接口属性必须完整

```typescript
// ❌ 错误：缺少必需属性
const parameters: ToolParameters = {
  type: 'object',
  properties: {
    items: { type: 'string' }, // 缺少 description
  }
}

// ✅ 正确：所有属性完整
const parameters: ToolParameters = {
  type: 'object',
  properties: {
    items: { type: 'string', description: '项目描述' }
  }
}
```

### 1.2 可选属性使用 `?`

```typescript
// ✅ 正确：可选属性
export interface LLMOptions {
  model?: string      // 可选
  temperature?: number
  maxTokens?: number
}

// ✅ 正确：带默认值的参数
async function generate(
  prompt: string,
  options: LLMOptions = {}
): Promise<string> { }
```

### 1.3 Error 类必须声明所有属性

```typescript
// ✅ 正确
export class AgentError extends Error {
  public readonly code: ErrorCode
  public readonly sessionId?: string
  public readonly cause?: Error  // 必须显式声明
  
  constructor(code: ErrorCode, message: string, options: { cause?: Error } = {}) {
    super(message)
    this.code = code
    this.cause = options.cause
  }
}
```

## 2. 未使用变量处理

### 2.1 未使用参数前缀下划线

```typescript
// ❌ 错误：未使用参数
async function execute(args: string, context: SkillContext) { }

// ✅ 正确：前缀下划线
async function execute(args: string, _context: SkillContext) { }

// ✅ 正确：在类型定义中
return async (_context: PipelineContext, next: () => Promise<void>) => { }
```

### 2.2 未使用导入必须删除

```typescript
// ❌ 错误：未使用导入
import type { Skill, SkillContext } from '../SkillTypes'
import { EventEmitter } from '../events'

// ✅ 正确：只导入使用的
import type { Skill } from '../SkillTypes'
```

### 2.3 未使用变量必须删除或前缀下划线

```typescript
// ❌ 错误
const { apiKey, model, baseUrl, loadSettings } = useAIStore()

// ✅ 正确
const { loadSettings } = useAIStore()

// ✅ 正确：解构但未使用
constructor(_events: EventEmitter) {
  // events reserved for future use
}
```

## 3. 类型断言规范

### 3.1 避免隐式 any

```typescript
// ❌ 错误：隐式any
const types = result.data.questions.map(q => q.type)

// ✅ 正确：显式类型
const types = (result.data.questions as Array<{ type: string }>).map((q: { type: string }) => q.type)
```

### 3.2 安全的类型断言

```typescript
// ✅ 正确：unknown 类型断言
const wrappedHandler = (payload: unknown) => {
  handler(payload as AutobiographyEventMap[typeof event], context)
}

// ✅ 正确：双重断言
const disposer = this.events.on(event, wrappedHandler as unknown as EventHandler)
```

### 3.3 存储获取类型断言

```typescript
// ❌ 错误：返回类型不明确
const persisted = await storage.get(`session:${session.id}`)

// ✅ 正确：显式类型参数
const persisted = await storage.get<{ id: string }>(`session:${session.id}`)
```

## 4. Node.js 全局变量

### 4.1 测试文件中声明 process

```typescript
// ✅ 正确：在测试文件顶部声明
declare const process: { exit(code?: number): never }

import { SessionManager } from '../session'
// ... 其他导入
```

## 5. 布尔类型处理

### 5.1 可选布尔值必须检查

```typescript
// ❌ 错误：boolean | undefined 不能赋值给 boolean
assert(result.error?.includes('empty'), '错误信息包含empty')

// ✅ 正确：显式检查
assert(result.error?.includes('empty') === true, '错误信息包含empty')
```

## 6. 接口属性命名

### 6.1 避免使用下划线前缀的属性名

```typescript
// ❌ 错误：下划线前缀属性名
interface MergeOptions {
  _analysis: DraftAnalysis
}

// ✅ 正确：正常属性名
interface MergeOptions {
  analysis: DraftAnalysis
}
```

## 7. 导入规范

### 7.1 类型导入使用 type

```typescript
// ✅ 正确：类型导入
import type { Skill, SkillCommand } from '../SkillTypes'
import type { AutobiographyEventMap } from '../events/types'
```

### 7.2 移除未使用的导入

```typescript
// ❌ 错误
import { SkillRegistry } from '../skills/SkillRegistry'
import { ToolRegistry } from '../tools'
import { EventEmitter } from '../events'

// ✅ 正确：只导入使用的
import { AutobiographyAgent } from '../AutobiographyAgent'
```

## 8. 事件处理器类型安全

### 8.1 泛型事件处理器

```typescript
// ✅ 正确：使用类型断言处理泛型事件
const wrappedHandler = (payload: unknown) => {
  (handler as any)(payload, context)
}
const disposer = (this.events.on as any)(event, wrappedHandler)
```

## 9. 检查清单

在提交代码前，请检查：

- [ ] 所有接口属性都有 `description`（如 ToolParameterSchema）
- [ ] 未使用的参数前缀下划线 `_`
- [ ] 未使用的导入已删除
- [ ] Error 子类已声明所有属性
- [ ] 没有隐式 `any` 类型
- [ ] 测试文件已声明 `process`
- [ ] 布尔值检查使用 `=== true`
- [ ] 类型断言使用 `as` 而非 `any`

## 10. 常见错误速查

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| Property 'x' does not exist on type '{}' | 缺少类型声明 | 添加类型参数或类型断言 |
| Cannot find name 'process' | 缺少 Node.js 类型 | 添加 `declare const process` |
| 'x' is declared but never read | 未使用变量 | 删除或前缀下划线 |
| Property 'x' is missing | 缺少必需属性 | 添加属性或改为可选 |
| Argument of type 'x' is not assignable | 类型不匹配 | 使用类型断言 |
| Parameter 'x' implicitly has an 'any' type | 隐式 any | 添加显式类型注解 |
