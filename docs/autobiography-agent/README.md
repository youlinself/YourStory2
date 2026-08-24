# 自传功能 Agent 化改造开发文档

## 项目概述

本文档记录了 YourStory2 自传功能从传统对话模式向 Agent 架构改造的完整开发过程。

### 改造目标

将现有的扁平化 AI 对话系统升级为具有会话管理、工具系统、技能系统和事件驱动架构的 Agent 化系统。

### 架构对比

#### 改造前

```
UI → AIService (单次调用) → Prompt 模板 → 响应
```

#### 改造后

```
UI → Agent Orchestrator → Session 管理
                           → Tool Registry (工具系统)
                           → Skill System (技能系统)
                           → Event Bus (事件驱动)
                           → Pipeline (执行管道)
```

---

## 开发阶段

| 阶段 | 名称 | 文档链接 | 预估工时 | 状态 |
|------|------|----------|----------|------|
| Phase 1 | 基础 Agent 框架 | [phase1-agent-framework.md](./phase1-agent-framework.md) | 1-2 周 | ⏳ 待开始 |
| Phase 2 | 工具系统 | [phase2-tool-system.md](./phase2-tool-system.md) | 1 周 | ⏳ 待开始 |
| Phase 3 | 技能系统 | [phase3-skill-system.md](./phase3-skill-system.md) | 1-2 周 | ⏳ 待开始 |
| Phase 4 | 管道与优化 | [phase4-pipeline-optimization.md](./phase4-pipeline-optimization.md) | 1 周 | ⏳ 待开始 |
| Phase 5 | UI 集成 | [phase5-ui-integration.md](./phase5-ui-integration.md) | 1 周 | ⏳ 待开始 |

---

## 核心设计原则

### 1. 单一职责原则
每个模块只负责一个明确的职责：
- Session：会话状态管理
- Tool：具体功能实现
- Skill：可组合的能力单元
- Event：模块间通信

### 2. 开闭原则
- 对扩展开放：通过注册新工具/技能扩展功能
- 对修改修改：不修改现有代码即可添加新能力

### 3. 依赖倒置
- 高层模块不依赖低层模块的具体实现
- 所有模块依赖抽象接口

---

## 技术栈

| 类别 | 技术选型 | 说明 |
|------|----------|------|
| 语言 | TypeScript | 项目已有 |
| 状态管理 | Zustand | 项目已有，用于 UI 层 |
| Agent 框架 | 自研 | 参考 deepseek-harness 架构 |
| 测试 | Vitest | 与 Vite 生态集成 |
| 构建 | Vite | 项目已有 |

---

## 目录结构规划

```
src/
├── agent/                    # Agent 核心层
│   ├── session/              # 会话管理
│   │   ├── AutobiographySession.ts
│   │   ├── SessionManager.ts
│   │   └── types.ts
│   ├── tools/                # 工具系统
│   │   ├── ToolRegistry.ts
│   │   ├── ToolTypes.ts
│   │   └── autobiography/    # 自传专用工具
│   │       ├── extractContent.ts
│   │       ├── mergeDraft.ts
│   │       └── generateQuestions.ts
│   ├── skills/               # 技能系统
│   │   ├── SkillRegistry.ts
│   │   ├── SkillTypes.ts
│   │   └── autobiography/    # 自传专用技能
│   │       ├── DeepInterview.ts
│   │       ├── TimelineOrganize.ts
│   │       └── StyleCheck.ts
│   ├── events/               # 事件系统
│   │   ├── EventEmitter.ts
│   │   └── types.ts
│   ├── pipeline/             # 执行管道
│   │   ├── ExtractionPipeline.ts
│   │   └── types.ts
│   ├── llm/                  # LLM 适配层
│   │   ├── LLMAdapter.ts
│   │   └── types.ts
│   └── AutobiographyAgent.ts # 主 Agent 类
├── components/               # UI 层 (已有)
├── stores/                   # 状态管理 (已有)
└── services/                 # 服务层 (已有)
```

---

## 开发规范

### 文档规范
- 每个阶段独立文档记录
- 包含：目标、设计、实现、测试、总结
- 代码变更需同步更新文档

### 代码规范
- 遵循项目现有 ESLint 配置
- 所有公共 API 必须有 JSDoc 注释
- 关键逻辑需有单元测试覆盖

### Git 规范
- 每个阶段一个独立分支：`feature/agent-phase-N`
- 提交信息遵循 Conventional Commits
- 阶段完成后合并到主分支并打标签

---

## 验收标准

### Phase 1 验收
- [ ] Session 可创建、恢复、暂停
- [ ] 事件系统可发布和订阅
- [ ] 基础工具可注册和调用

### Phase 2 验收
- [ ] 内容提取工具正常工作
- [ ] 草稿合并工具正常工作
- [ ] 问题生成工具正常工作

### Phase 3 验收
- [ ] 技能可注册和激活
- [ ] 技能工具隔离正常
- [ ] 命令系统正常工作

### Phase 4 验收
- [ ] 执行管道 pre/execute/post 正常
- [ ] Token 预算管理有效
- [ ] 上下文压缩正常

### Phase 5 验收
- [ ] UI 与 Agent 层正确集成
- [ ] 实时事件更新正常
- [ ] 用户体验流畅

---

## 参考资料

- [deepseek-harness 项目](F:\self_work\officalSorts\deepseek-harness)
- [Cordis 框架文档](https://github.com/cordiverse/cordis)
