# 开发指南

## 快速开始

### 前置条件

- Node.js >= 18
- Yarn >= 4
- TypeScript >= 5

### 安装依赖

```bash
yarn install
```

### 启动开发服务器

```bash
yarn dev
```

---

## 开发流程

### 1. 阶段开发顺序

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
   ↓         ↓         ↓         ↓         ↓
 基础框架   工具系统   技能系统   管道优化   UI 集成
```

**重要：** 每个阶段必须完成后才能开始下一阶段。

### 2. 分支策略

```bash
# 创建阶段分支
git checkout -b feature/agent-phase-1

# 完成后合并
git checkout main
git merge feature/agent-phase-1
git tag phase-1-complete
```

### 3. 每个阶段的开发流程

```
1. 阅读阶段文档（phaseN-xxx.md）
2. 实现核心代码
3. 编写单元测试
4. 运行测试确保通过
5. 更新开发日志
6. 填写阶段总结
7. 提交代码
8. 标记阶段完成
```

---

## 代码规范

### TypeScript 规范

```typescript
// ✅ 推荐：使用接口定义对象结构
interface UserConfig {
  name: string
  age: number
  email?: string  // 可选属性
}

// ✅ 推荐：使用类型别名定义联合类型
type Status = 'active' | 'paused' | 'closed'

// ✅ 推荐：为函数添加返回类型
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ❌ 避免：使用 any
function processData(data: any): any { ... }

// ✅ 推荐：使用泛型
function processData<T>(data: T): ProcessedResult<T> { ... }
```

### 文件命名规范

```
# 类型定义文件
types.ts
ToolTypes.ts

# 核心实现文件
ToolRegistry.ts
SessionManager.ts

# 组件文件
ToolPanel.tsx
SkillSwitcher.tsx

# 测试文件
ToolRegistry.spec.ts
ToolPanel.test.tsx
```

### 注释规范

```typescript
/**
 * 计算两个日期之间的天数
 * @param startDate - 开始日期
 * @param endDate - 结束日期
 * @returns 天数差
 * @example
 * const days = calculateDaysBetween('2024-01-01', '2024-01-31') // 30
 */
function calculateDaysBetween(startDate: string, endDate: string): number {
  // 实现
}
```

---

## 测试规范

### 单元测试

```typescript
import { describe, it, expect } from 'vitest'
import { ToolRegistry } from './ToolRegistry'

describe('ToolRegistry', () => {
  it('should register a tool', () => {
    const registry = new ToolRegistry()
    const tool = { name: 'test', description: 'Test tool' }
    
    registry.register(tool)
    
    expect(registry.get('test')).toBe(tool)
  })

  it('should throw when registering duplicate tool', () => {
    const registry = new ToolRegistry()
    const tool = { name: 'test', description: 'Test tool' }
    
    registry.register(tool)
    
    expect(() => registry.register(tool)).toThrow()
  })
})
```

### 运行测试

```bash
# 运行所有测试
yarn test

# 运行特定测试文件
yarn test src/agent/tools/ToolRegistry.spec.ts

# 带覆盖率
yarn test:coverage
```

---

## Git 提交规范

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复 bug |
| docs | 文档变更 |
| style | 代码格式（不影响功能）|
| refactor | 重构 |
| test | 添加测试 |
| chore | 构建过程或辅助工具变动 |

### 示例

```bash
git commit -m "feat(agent): add session management

- Add SessionManager class
- Add session persistence
- Add unit tests

Closes #123"
```

---

## 调试技巧

### 启用调试面板

在开发模式下，按 `Ctrl+Shift+D` 打开事件日志面板。

### 查看事件日志

事件日志会显示所有 Agent 事件，帮助调试问题。

### 常见调试场景

1. **工具未注册**
   - 检查是否在 `registerAutobiographyTools` 中注册
   - 检查工具名称拼写

2. **事件未触发**
   - 检查事件名称是否匹配
   - 检查监听器是否正确注册

3. **会话状态异常**
   - 检查 SessionManager 的持久化
   - 检查会话 ID 是否正确

---

## 常见问题

### Q: 如何添加新工具？

1. 在 `src/agent/tools/autobiography/` 创建工具文件
2. 定义 `ToolDefinition` 对象
3. 在 `src/agent/tools/autobiography/index.ts` 中导出
4. 运行测试验证

### Q: 如何添加新技能？

1. 在 `src/agent/skills/autobiography/` 创建技能文件
2. 定义 `Skill` 对象
3. 在 `src/agent/skills/autobiography/index.ts` 中导出
4. 在 Agent Store 中注册技能激活逻辑

### Q: 如何调试事件？

1. 打开调试面板（Ctrl+Shift+D）
2. 查看事件日志
3. 检查事件处理器是否正确注册

### Q: Token 超限怎么办？

1. 检查 Token 预算设置
2. 触发上下文压缩
3. 增加 Token 限制

---

## 相关文档

- [Phase 1: 基础 Agent 框架](./phase1-agent-framework.md)
- [Phase 2: 工具系统](./phase2-tool-system.md)
- [Phase 3: 技能系统](./phase3-skill-system.md)
- [Phase 4: 管道与优化](./phase4-pipeline-optimization.md)
- [Phase 5: UI 集成](./phase5-ui-integration.md)

---

## 参考资料

- [deepseek-harness 项目](F:\self_work\officalSorts\deepseek-harness)
- [Cordis 框架](https://github.com/cordiverse/cordis)
- [Zustand 状态管理](https://docs.pmnd.rs/zustand)
