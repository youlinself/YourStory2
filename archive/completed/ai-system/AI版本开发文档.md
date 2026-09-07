# AI版本开发文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 版本 | v1.0 |
| 创建日期 | 2026-07-31 |
| 状态 | 基础框架已完成，高级功能待开发 |

---

## 一、已开发功能

### 1.1 AI生成基础框架

#### 类型定义 (`src/types/simulation.ts`)

| 类型名 | 用途 | 状态 |
|--------|------|------|
| `AIGenerationPhase` | 生成阶段枚举：idle/preparing/generating_events/generating_monsters/generating_boss/generating_shop/finalizing | ✅ |
| `AIGenerationState` | 生成状态接口：isGenerating/progress/targetEra/startTime/estimatedDuration | ✅ |
| `PreGeneratedContent` | 预生成内容接口：era/ageRange/events/enemies/boss/shopCards/isComplete | ✅ |
| `LoadingType` | 加载类型：generation_wait / initial_generation | ✅ |

#### 内容验证器 (`src/services/ai/ContentValidator.ts`)

| 功能 | 函数名 | 说明 | 状态 |
|------|--------|------|------|
| JSON语法修复 | `repairJSONSyntax()` | 处理尾部逗号、单引号、注释、代码块包裹 | ✅ |
| 结果验证 | `validateEventOutcome()` | 验证事件结果字段类型和数值范围 | ✅ |
| 选项验证 | `validateEventOption()` | 验证事件选项结构和内容 | ✅ |
| 事件验证 | `validateGameEvent()` | 验证完整事件结构 | ✅ |
| 中文键名映射 | `normalizeAttributeKey()` | 精力→energy, 智商→iq 等 | ✅ |
| 属性值清洗 | `sanitizeAttributeChanges()` | 数值截断到-20~20范围 | ✅ |
| 安全JSON解析 | `safeParseJSON()` | 带修复功能的JSON解析 | ✅ |

#### 核心生成服务 (`src/services/ai/SimulationGenerationService.ts`)

| 功能 | 函数名 | 说明 | 状态 |
|------|--------|------|------|
| 基础难度计算 | `getBaseDifficultyByAge()` | 根据年龄段返回基础难度系数 | ✅ |
| 动态难度计算 | `calculateDifficulty()` | 基于玩家表现调整难度 | ✅ |
| 目标年龄计算 | `getTargetAgeRange()` | 计算下一个十年的年龄范围 | ✅ |
| 生成上下文构建 | `buildGenerationContext()` | 从游戏状态构建AI生成上下文 | ✅ |
| 事件生成 | `generateEraEvents()` | AI驱动事件生成，失败回退默认 | ✅ |
| 敌人生成 | `generateEraEnemies()` | 基于年龄段生成怪物 | ✅ |
| Boss生成 | `generateEraBoss()` | 生成时代Boss | ✅ |
| 商店生成 | `generateEraShopCards()` | 生成商店卡牌 | ✅ |
| 内容组装 | `validateAndAssemble()` | 验证并组装预生成内容 | ✅ |
| 默认内容 | `getDefaultEraContent()` | AI生成失败时的降级内容 | ✅ |

#### Store Action (`src/stores/simulationStore.ts`)

| Action | 功能 | 状态 |
|--------|------|------|
| `startBackgroundGeneration(targetEra)` | 后台生成指定时代内容 | ✅ |
| `getPreGeneratedContent(era)` | 获取已预生成的内容 | ✅ |
| `clearPreGeneratedContent()` | 清除预生成缓存 | ✅ |

#### UI组件 (`src/components/AIGenerationLoading.tsx`)

| 功能 | 说明 | 状态 |
|------|------|------|
| 进度条显示 | 显示生成进度百分比 | ✅ |
| 阶段图标 | 根据generationPhase显示对应图标 | ✅ |
| 阶段文案 | 显示当前生成阶段描述 | ✅ |
| 时间估算 | 显示已用时间和预计剩余时间 | ✅ |

### 1.2 游戏流程集成

| 集成点 | 位置 | 功能 | 状态 |
|--------|------|------|------|
| 首次游戏 | `startGame()` | 游戏开始时预生成0-9岁内容 | ✅ |
| Boss战触发 | `enterOption()` case 'boss' | Boss战开始时后台生成下一代内容 | ✅ |
| 生成等待 | `completeOption()` | Boss战后检查生成是否完成 | ✅ |
| 时代切换 | `advanceEra()` | 时代切换时预生成下一代内容 | ✅ |
| Loading显示 | `Simulation/index.tsx` | 集成AIGenerationLoading组件 | ✅ |

### 1.3 生成状态流转

```
idle → preparing → generating_events → generating_monsters 
     → generating_boss → generating_shop → finalizing → idle
```

### 1.4 难度动态调整

| 玩家表现 | 修正系数 | 说明 |
|---------|---------|------|
| 胜率 > 80% | ×1.2 | 玩家太强，增加难度 |
| 胜率 < 40% | ×0.8 | 玩家太弱，降低难度 |
| 血量 > 70% | ×1.1 | 状态良好，增加难度 |
| 血量 < 30% | ×0.9 | 状态较差，降低难度 |
| 死亡次数 | ×max(0.7, 1-死亡×0.05) | 死亡越多，难度越低 |

### 1.5 年龄段与难度对照

| 年龄段 | 年龄范围 | 基础难度 |
|--------|---------|---------|
| 婴幼儿 | 0-5岁 | 0.5 |
| 童年 | 6-9岁 | 0.6 |
| 少年 | 10-13岁 | 0.8 |
| 青少年 | 14-17岁 | 1.0 |
| 大学 | 18-21岁 | 1.1 |
| 青年 | 22-29岁 | 1.3 |
| 壮年 | 30-39岁 | 1.5 |
| 中年 | 40-49岁 | 1.7 |
| 知天命 | 50-59岁 | 1.6 |
| 花甲 | 60-69岁 | 1.5 |
| 古稀 | 70-79岁 | 1.4 |
| 杖朝 | 80-89岁 | 1.3 |
| 期颐 | 90-99岁 | 1.2 |
| 长寿之星 | 100-110岁 | 1.5 |
| 传奇人生 | 111-999岁 | 2.0 |

---

## 二、待开发功能

### 2.1 生成调度与容错（P0）

| 功能 | 说明 | 预计工时 | 依赖 |
|------|------|---------|------|
| 超时处理机制 | 生成超时30秒后自动降级到默认内容 | 0.5天 | 无 |
| 生成完成事件 | `emit('generationComplete', { era })` 通知UI | 0.5天 | 无 |
| 轮询检查状态 | Boss战后每200ms检查生成是否完成 | 0.5天 | 生成完成事件 |
| 网络断开处理 | 暂停生成→显示提示→自动重试(最多3次) | 1天 | 无 |

### 2.2 增强事件生成系统（P0）

| 功能 | 说明 | 预计工时 | 依赖 |
|------|------|---------|------|
| 上下文构建器 | 将游戏状态转换为AI可理解的丰富上下文 | 1天 | 无 |
| 增强事件生成 | 使用丰富上下文生成个性化事件 | 2天 | 上下文构建器 |
| 事件类型智能推断 | 根据年龄/属性自动选择事件类型 | 1天 | 增强事件生成 |
| 提示词模板系统 | event_generation_v2 等模板 | 1天 | 无 |

#### 事件类型定义

```typescript
type AIEventType = 
  | 'personal_growth'    // 个人成长
  | 'relationship'       // 人际关系
  | 'crisis'             // 危机事件
  | 'opportunity'        // 机遇事件
  | 'moral_dilemma'      // 道德困境
  | 'nostalgia'          // 怀旧事件
  | 'legacy'             // 传承事件
  | 'random';            // 随机事件
```

#### 事件类型智能推断规则

| 年龄/时代 | 属性条件 | 推荐事件类型 |
|----------|---------|-------------|
| 童年/少年 | - | personal_growth |
| 青年/壮年 | eq >= 60 | relationship |
| 青年/壮年 | wealth >= 60 | opportunity |
| 青年/壮年 | 其他 | personal_growth |
| 中年/暮年 | network >= 60 | legacy |
| 中年/暮年 | 其他 | moral_dilemma |
| 老年/耄耋 | - | nostalgia |
| 期颐/修仙 | - | legacy |

### 2.3 战斗叙事AI（P1）

| 功能 | 说明 | 预计工时 | 依赖 |
|------|------|---------|------|
| 战斗开场叙事 | 场景描述、敌人登场 | 1天 | 无 |
| 每回合叙事 | 动作描写、敌人反应 | 1天 | 无 |
| 战斗结果叙事 | 胜利/失败结局描述 | 1天 | 无 |
| 敌人意图叙事 | 敌人行为描述 | 0.5天 | 无 |

#### 战斗叙事触发点

| 触发时机 | 叙事内容 | 示例 |
|---------|---------|------|
| 战斗开始 | 场景描述、敌人登场 | "一只巨大的妖兽从阴影中走出..." |
| 玩家出牌 | 动作描写 | "你挥出一剑，剑光如虹..." |
| 敌人行动 | 反应描述 | "妖兽怒吼一声，利爪横扫..." |
| 暴击/格挡 | 特写描述 | "这一击势如破竹，正中要害！" |
| 战斗胜利 | 结局叙事 | "你站在胜利的战场上，感慨万千..." |
| 战斗失败 | 临终叙事 | "眼前渐渐模糊，你回忆起..." |

### 2.4 NPC对话系统（P1）

| 功能 | 说明 | 预计工时 | 依赖 |
|------|------|---------|------|
| 动态对话生成 | 基于上下文的NPC对话 | 2天 | 上下文构建器 |
| 羁绊事件生成 | 羁绊组特殊事件 | 1天 | 动态对话生成 |
| 回忆对话 | 基于过往经历的对话 | 1天 | 无 |

#### NPC对话触发条件

| 触发条件 | 对话类型 | 内容示例 |
|---------|---------|---------|
| 随机遭遇 | 日常闲聊 | "最近过得怎么样？" |
| 玩家主动 | 请求/分享 | "我想和你聊聊..." |
| 人生里程碑 | 祝贺/安慰 | "听说你突破了？恭喜！" |
| 战斗后 | 关心/鼓励 | "你受伤了，还好吗？" |
| 共同经历 | 回忆 | "还记得我们第一次见面吗？" |

### 2.5 人生传记AI（P2）

| 功能 | 说明 | 预计工时 | 依赖 |
|------|------|---------|------|
| 人生总结生成 | 游戏结束时生成完整人生叙事 | 1天 | 无 |
| 章节生成 | 按时代生成章节 | 1天 | 无 |
| 性格弧线 | 分析玩家性格变化 | 0.5天 | 无 |

#### 传记章节结构

| 章节 | 标题格式 | 内容要点 |
|------|---------|---------|
| 第一章 | 童年 | 家庭背景、早期教育、性格形成 |
| 第二章 | 少年 | 求学经历、友谊、初恋 |
| 第三章 | 青年 | 事业起步、挑战、成长 |
| 第四章 | 壮年 | 成就、责任、平衡 |
| 第五章 | 中年 | 反思、转折、传承 |
| 第六章 | 暮年 | 回忆、智慧、告别 |
| 尾声 | 传奇 | 一生总结、遗产、影响 |

### 2.6 世界事件AI（P2）

| 功能 | 说明 | 预计工时 | 依赖 |
|------|------|---------|------|
| 时代事件生成 | 时代变迁时的事件 | 1天 | 无 |
| 随机传闻 | 世界中的随机消息 | 0.5天 | 无 |
| 时代过渡叙事 | 时代切换时的叙事 | 1天 | 无 |

### 2.7 高级验证与优化（P2）

| 功能 | 说明 | 预计工时 | 依赖 |
|------|------|---------|------|
| 引用完整性检查 | 验证卡牌/遗物/事件ID有效性 | 1天 | 无 |
| 数值平衡检查 | 更精细的数值平衡验证 | 0.5天 | 无 |
| 缓存机制 | 本地缓存已生成内容 | 1天 | 无 |
| 监控指标 | 生成时间、成功率、降级率统计 | 1天 | 无 |

---

## 三、文件结构

### 3.1 已创建文件

```
src/
├── services/
│   └── ai/
│       ├── AIService.ts                        # 基础AI服务
│       ├── SimulationAIService.ts              # 模拟人生AI服务
│       ├── SimulationGenerationService.ts      # ✅ 新增：核心生成服务
│       ├── ContentValidator.ts                 # ✅ 新增：内容验证器
│       └── index.ts
├── stores/
│   └── simulationStore.ts                      # ✅ 修改：添加生成逻辑
├── types/
│   └── simulation.ts                           # ✅ 修改：添加AI状态类型
└── components/
    └── AIGenerationLoading.tsx                 # ✅ 新增：生成Loading组件
```

### 3.2 待创建文件

```
src/
├── services/
│   └── ai/
│       ├── contextBuilder.ts                   # ❌ 待创建：上下文构建器
│       ├── EnhancedSimulationAI.ts             # ❌ 待创建：增强事件生成
│       ├── CombatNarrativeAI.ts                # ❌ 待创建：战斗叙事
│       ├── NPCConversator.ts                   # ❌ 待创建：NPC对话
│       ├── AutobiographyAI.ts                  # ❌ 待创建：传记生成
│       ├── WorldEventAI.ts                     # ❌ 待创建：世界事件
│       └── aiTypes.ts                          # ❌ 待创建：AI相关类型
├── ai_config/
│   └── prompts/
│       ├── event_generation_v2.md              # ❌ 待创建：事件生成模板
│       ├── combat_narrative.md                 # ❌ 待创建：战斗叙事模板
│       ├── npc_dialogue.md                     # ❌ 待创建：NPC对话模板
│       ├── life_summary.md                     # ❌ 待创建：人生总结模板
│       ├── world_event.md                      # ❌ 待创建：世界事件模板
│       └── shared_templates.md                 # ❌ 待创建：共享模板
└── components/
    └── simulation/
        └── AIGenerationLoading.tsx             # ⚠️ 路径待调整
```

---

## 四、API参考

### 4.1 ContentValidator

```typescript
// JSON语法修复
function repairJSONSyntax(raw: string): string

// 安全JSON解析
function safeParseJSON<T>(raw: string): T | null

// 事件结果验证
function validateEventOutcome(outcome: unknown): ValidationResult<EventOutcome>

// 事件选项验证
function validateEventOption(option: unknown, index: number): ValidationResult<EventOption>

// 完整事件验证
function validateGameEvent(event: unknown): ValidationResult<GameEvent | null>

// 中文键名映射
function normalizeAttributeKey(key: string): keyof PlayerAttributes | null
```

### 4.2 SimulationGenerationService

```typescript
// 难度计算
function getBaseDifficultyByAge(age: number): number
function calculateDifficulty(ctx: GenerationContext): number

// 年龄范围计算
function getTargetAgeRange(currentAge: number): { start: number; end: number }

// 生成上下文构建
function buildGenerationContext(gameState: GameState): GenerationContext

// 内容生成
async function generateEraEvents(context: GenerationContext): Promise<GameEvent[]>
async function generateEraEnemies(context: GenerationContext): Promise<Enemy[]>
async function generateEraBoss(context: GenerationContext): Promise<Enemy>
async function generateEraShopCards(context: GenerationContext): Promise<LifeCard[]>

// 验证与组装
async function validateAndAssemble(params: {
  era: number
  ageRange: [number, number]
  events: GameEvent[]
  enemies: Enemy[]
  boss: Enemy
  shopCards: LifeCard[]
}): Promise<PreGeneratedContent>

// 默认内容降级
function getDefaultEraContent(era: number, gameState: GameState): PreGeneratedContent
function getDefaultEventsForEra(era: number, baseAge: number, birthYear: number): GameEvent[]
```

### 4.3 Store Actions

```typescript
// 后台生成
startBackgroundGeneration: (targetEra: number) => Promise<void>

// 获取预生成内容
getPreGeneratedContent: (era: number) => PreGeneratedContent | null

// 清除预生成内容
clearPreGeneratedContent: () => void
```

---

## 五、开发进度

### 5.1 完成度统计

| 类别 | 已完成 | 总计 | 完成率 |
|------|--------|------|--------|
| AI生成基础框架 | 4 | 4 | 100% |
| 游戏流程集成 | 5 | 5 | 100% |
| 内容验证器 | 7 | 7 | 100% |
| 生成调度与容错 | 0 | 4 | 0% |
| 增强事件生成 | 0 | 4 | 0% |
| 战斗叙事AI | 0 | 4 | 0% |
| NPC对话系统 | 0 | 3 | 0% |
| 人生传记AI | 0 | 3 | 0% |
| 世界事件AI | 0 | 3 | 0% |
| 高级验证与优化 | 0 | 4 | 0% |
| 提示词模板 | 0 | 6 | 0% |

**总体完成率：约 35%**

### 5.2 里程碑

| 里程碑 | 状态 | 完成内容 |
|--------|------|---------|
| 里程碑1：基础框架 | ✅ 已完成 | 类型定义、验证器、生成服务、Store Action、UI组件 |
| 里程碑2：流程集成 | ✅ 已完成 | 首次游戏、Boss战、时代切换、生成等待 |
| 里程碑3：增强事件 | ❌ 待开发 | 上下文构建器、增强事件生成、提示词模板 |
| 里程碑4：战斗叙事 | ❌ 待开发 | 战斗开场/回合/结果叙事 |
| 里程碑5：NPC对话 | ❌ 待开发 | 动态对话、羁绊事件、回忆对话 |
| 里程碑6：传记世界 | ❌ 待开发 | 人生传记、世界事件 |

---

## 六、验收标准

### 6.1 已达成

- [x] 首次游戏：选择出生年份后，后台生成0-9岁内容
- [x] Boss战期间：进入Boss战斗后，后台自动启动下十年内容生成
- [x] Boss战后：生成完成后直接进入新时代
- [x] 内容质量：生成的事件、怪物符合年龄段主题
- [x] 难度平衡：根据玩家表现动态调整难度
- [x] 异常处理：生成失败时使用默认内容，用户无感知

### 6.2 待达成

- [ ] 超时处理：生成超时30秒后自动降级
- [ ] 网络处理：网络断开时自动重试
- [ ] 事件多样性：事件类型根据玩家属性智能选择
- [ ] 战斗沉浸感：战斗开场/回合/结果有AI叙事
- [ ] NPC互动：NPC根据上下文动态对话
- [ ] 人生总结：游戏结束时生成完整人生传记
- [ ] 世界感：时代变迁有AI生成的世界事件

---

## 七、后续计划

### 第一阶段（已完成）

- [x] 添加状态字段
- [x] 创建AI生成服务
- [x] 实现核心生成函数
- [x] 添加Store Action
- [x] 修改enterOption
- [x] 修改completeOption
- [x] 修改首次游戏开始流程
- [x] 创建AIGenerationLoading组件
- [x] 集成到主页面

### 第二阶段（待执行）

- [ ] 实现超时处理机制
- [ ] 实现生成完成事件发射
- [ ] 实现轮询检查生成状态
- [ ] 实现网络断开处理

### 第三阶段（待执行）

- [ ] 实现上下文构建器
- [ ] 实现增强事件生成
- [ ] 编写提示词模板
- [ ] 实现事件类型智能推断

### 第四阶段（待执行）

- [ ] 实现战斗叙事AI
- [ ] 实现NPC对话系统
- [ ] 实现人生传记AI
- [ ] 实现世界事件AI

---

## 八、AI回调响应字段与问题修复

### 8.1 AI回调响应字段

当前 `AIService.sendRequest()` 从API响应中提取的字段路径为：

```typescript
// OpenAI标准格式
const data = await response.json();
return data.choices[0].message.content;
```

**响应字段结构**：
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "AI生成的文本内容（JSON字符串）"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 200,
    "total_tokens": 300
  }
}
```

**提取的字段**：`choices[0].message.content`

### 8.2 已修复的问题

#### 问题1：系统提示词错误

**问题描述**：
- `generateResponse()` 方法是为自传对话设计的，内部使用 `PromptComposer.buildMessages()` 加载自传助手的系统提示词
- 在模拟人生事件生成场景中，AI收到的系统提示词是"自传助手"，但用户消息是"生成模拟人生事件"
- 导致AI困惑，返回的内容格式不正确

**修复方案**：
1. 在 `AIService` 中添加 `sendCustomMessages()` 公开方法，允许发送完全自定义的messages数组
2. 在 `SimulationGenerationService.buildEventSystemPrompt()` 中创建正确的系统提示词
3. 修改 `generateEraEvents()` 使用 `sendCustomMessages()` 发送正确的系统提示词和用户消息

**修复代码**：

```typescript
// AIService.ts - 添加公开方法
async sendCustomMessages(
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  return this.sendRequest(messages);
}
```

```typescript
// SimulationGenerationService.ts - 正确的系统提示词
function buildEventSystemPrompt(): string {
  return `你是一位专业的人生叙事设计师，专门为模拟人生游戏生成个性化事件。

你的职责：
1. 根据玩家的年龄、属性和时代背景，生成符合情境的事件
2. 事件标题简洁有力，不超过10个字
3. 事件描述生动有趣，50-100字
4. 选项设计体现不同价值观，没有绝对正确的答案
5. 成功/失败的结果描述要有戏剧性
6. 属性变化要合理，符合事件逻辑

设计原则：
- 连贯性：事件要与玩家年龄相符
- 个性化：根据玩家属性调整事件难度和选项
- 戏剧性：事件要有冲突和转折
- 后果性：选择要有真实的影响
- 时代感：体现不同年龄段的特征

输出格式：严格的JSON格式，不要包含任何额外文本或Markdown代码块标记。`;
}
```

```typescript
// SimulationGenerationService.ts - 使用正确的方法
export async function generateEraEvents(context: GenerationContext): Promise<GameEvent[]> {
  const aiService = await getAIService();
  if (!aiService) {
    return getDefaultEventsForEra(context.targetEra, context.targetAgeStart, context.birthYear);
  }

  try {
    const systemPrompt = buildEventSystemPrompt();
    const userPrompt = buildEventPrompt(context);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
    
    const response = await aiService.sendCustomMessages(messages);
    const parsed = safeParseJSON<{ title: string; baseText: string; options: unknown[] }>(response);

    if (parsed) {
      const validationResult = validateGameEvent(parsed);
      if (validationResult.valid && validationResult.data) {
        return [validationResult.data];
      }
    }

    return getDefaultEventsForEra(context.targetEra, context.targetAgeStart, context.birthYear);
  } catch (error) {
    console.error('AI事件生成失败:', error);
    return getDefaultEventsForEra(context.targetEra, context.targetAgeStart, context.birthYear);
  }
}
```

#### 问题2：SimulationAIService.generateEvent() 同样问题

**问题描述**：
- `SimulationAIService.generateEvent()` 也使用了 `generateResponse()`，存在同样的系统提示词错误问题

**修复方案**：
- 修改为使用 `sendCustomMessages()` 和正确的系统提示词

### 8.3 其他潜在问题

| 问题 | 说明 | 排查方法 |
|------|------|---------|
| API格式不兼容 | 非OpenAI供应商可能返回不同格式 | 检查 `data.choices` 是否存在 |
| AI返回非JSON | AI可能返回纯文本或带Markdown的文本 | 使用 `safeParseJSON()` 修复 |
| 验证失败 | JSON结构不符合预期 | 检查 `validateGameEvent()` 日志 |
| 网络超时 | API请求超时 | 添加超时处理和重试机制 |

---

## 九、AI生成架构重构：从按需生成到预生成

### 9.1 问题描述

**原设计（按需生成）**：
- 遇到事件选项时才调用AI生成单个事件
- 玩家每次遇到事件都需要等待AI响应
- 体验差，等待时间长

**新设计（预生成）**：
- 游戏开始时预生成整个10年的事件列表
- 时代切换时预生成下一个10年的事件列表
- 玩家遇到事件时直接从预生成列表中取，无需等待

### 9.2 核心变更

#### 新增类型

```typescript
export interface EraEventPool {
  era: number;           // 时代索引
  events: GameEvent[];   // 预生成的事件列表
  usedEventIds: Set<string>;  // 已使用的事件ID
  currentIndex: number;  // 当前索引
}
```

#### 新增Store字段

```typescript
interface GameState {
  // ... 现有字段
  currentEraEvents: EraEventPool | null;  // 当前时代的事件池
  preGeneratedContent: PreGeneratedContent | null;  // 下一个时代的预生成内容
}
```

#### 新增Store Action

| Action | 功能 |
|--------|------|
| `getNextPreGeneratedEvent()` | 从当前事件池获取下一个未使用的事件 |
| `initializeEraEventPool(era, events)` | 初始化新时代的事件池 |
| `movePreGeneratedToCurrentEra()` | 将预生成的内容移动到当前时代 |

#### 生成流程

```
startGame()
    ↓
startBackgroundGeneration(0)  // 预生成0-9年内容
    ↓
完成后：
  - 初始化 currentEraEvents（0-9年事件池）
  - 启动 startBackgroundGeneration(1)  // 预生成10-19年内容
    ↓
advanceEra()  // 时代切换
    ↓
  - 将 preGeneratedContent 移动到 currentEraEvents
  - 启动 startBackgroundGeneration(nextEra + 1)
    ↓
enterOption() case 'event'
    ↓
getAvailableEvents()  // 从 currentEraEvents 获取未使用的事件
```

#### 事件批量生成

修改 `SimulationGenerationService.generateEraEvents()` 批量生成15个事件：

```typescript
// 输出格式
{
  "events": [
    {
      "id": "event_001",
      "title": "事件标题",
      "baseText": "事件描述",
      "age": 5,
      "options": [...]
    },
    // ... 共15个事件
  ]
}
```

### 9.3 优势

| 方面 | 原设计 | 新设计 |
|------|--------|--------|
| 等待时间 | 每次事件都等待 | 仅首次和时代切换时等待 |
| 生成次数 | 每个事件生成1次 | 每10年批量生成1次 |
| 网络请求 | 频繁 | 减少90% |
| 体验 | 卡顿 | 流畅 |
| AI成本 | 高 | 低 |

---

*文档版本：v1.2*
*创建日期：2026-07-31*
*维护者：AI Assistant*
