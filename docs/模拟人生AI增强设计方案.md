# 模拟人生 AI大模型增强设计方案

## 一、现状分析

### 1.1 现有系统评估

| 维度 | 现有能力 | 可增强空间 | 优先级 |
|------|---------|-----------|--------|
| **事件系统** | 静态事件池 + 简单AI事件生成 | 动态叙事、个性化剧情、多线分支 | P0 |
| **战斗系统** | 固定怪物池、回合制卡牌 | AI对手、动态难度、战斗叙事 | P1 |
| **NPC/羁绊** | 静态羁绊系统 | AI驱动对话、动态关系演化 | P1 |
| **人生总结** | 简单统计面板 | AI生成传记、回顾性叙事 | P2 |
| **世界状态** | 简单状态记录 | AI驱动的世界事件、时代变迁 | P2 |

### 1.2 现有AI集成现状

当前 `SimulationAIService` 存在以下限制：

- **上下文信息薄弱**：仅传递年龄、出生年份、基础属性、近期选择（3条）
- **事件类型单一**：所有事件使用相同模板，缺乏差异化
- **叙事深度不足**：生成的文本缺乏情感张力和时代感
- **选项设计简单**：未考虑属性权重差异和玩家个性化

---

## 二、AI增强架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI Simulation Engine                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Narrative   │  │   Combat     │  │    NPC       │          │
│  │  Generator   │  │   AI         │  │  Conversator │          │
│  │  (叙事生成器) │  │  (战斗AI)    │  │  (NPC对话)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│  ┌──────┴──────────────────┴──────────────────┴───────┐         │
│  │              Context Builder (上下文构建器)          │         │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │         │
│  │  │ Player  │ │ History │ │ World   │ │ Bond    │  │         │
│  │  │ State   │ │ Context │ │ State   │ │ System  │  │         │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │         │
│  └─────────────────────────────────────────────────────┘         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────┐         │
│  │           Prompt Template System (提示词模板)        │         │
│  │  event_generation / combat_narrative / npc_dialog   │         │
│  │  life_summary / world_event / tribulation_story    │         │
│  └─────────────────────────────────────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 模块清单

| 模块名称 | 文件路径 | 功能描述 |
|---------|---------|---------|
| 上下文构建器 | `services/ai/contextBuilder.ts` | 将游戏状态转换为AI可理解的丰富上下文 |
| 增强事件生成 | `services/ai/EnhancedSimulationAI.ts` | 使用丰富上下文生成个性化事件 |
| 战斗叙事AI | `services/ai/CombatNarrativeAI.ts` | 生成战斗开场、动作描述、结果叙事 |
| NPC对话系统 | `services/ai/NPCConversator.ts` | 基于上下文的动态对话生成 |
| 人生传记AI | `services/ai/AutobiographyAI.ts` | 游戏结束时生成完整人生叙事 |
| 世界事件AI | `services/ai/WorldEventAI.ts` | 生成时代变迁和世界事件 |

---

## 三、模块详细设计

### 3.1 增强型事件生成系统（P0）

#### 3.1.1 增强事件上下文接口

```typescript
interface EnhancedEventContext {
  // 基础信息
  age: number;
  birthYear: number;
  era: number;
  eraName: string;
  eraDescription: string;
  mode: GameMode;
  cultivationRealm?: CultivationRealm;
  
  // 玩家状态
  attributes: PlayerAttributes;
  attributeSummary: string;
  hiddenTags: string[];
  activeBonds: BondGroupSummary[];
  
  // 历史上下文
  recentChoices: ChoiceRecord[];      // 最近5次选择
  lifeRecords: LifeRecord[];          // 重要人生记录
  significantEvents: string[];        // 关键事件摘要
  
  // 世界状态
  worldState: WorldState;
  eraDefinition: EraDefinition;
  
  // 叙事连贯性
  ongoingStorylines: Storyline[];     // 进行中的故事线
  resolvedStorylines: string[];       // 已解决的故事线
  
  // 动态难度
  playerPerformance: {
    combatWinRate: number;
    avgHealthPercent: number;
    successRate: number;
    goldEfficiency: number;
  };
  
  // 衍生特征
  personalityTraits: string[];
  lifeStage: string;
}
```

#### 3.1.2 事件类型定义

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

#### 3.1.3 事件类型智能推断规则

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

#### 3.1.4 提示词模板结构

```
## 角色设定
你是一位资深的人生叙事设计师...

## 玩家档案
- 基本信息（年龄、时代、境界）
- 属性特征（优势/劣势分析）
- 性格特质（从属性推导）
- 隐藏标签
- 当前羁绊
- 近期经历

## 事件生成要求
- 类型偏好
- 设计原则（连贯性、个性化、戏剧性、后果性、时代感）
- 选项设计指南

## 输出格式
JSON结构定义...
```

---

### 3.2 AI战斗叙事系统（P1）

#### 3.2.1 战斗叙事接口

```typescript
interface CombatNarrativeAI {
  // 战斗开场
  generateBattleIntro(
    enemies: Enemy[], 
    context: CombatContext
  ): Promise<{
    opening: string;           // 开场白
    atmosphere: string;        // 氛围描述
    stakes: string;            // 赌注说明
  }>;

  // 每回合叙事
  generateTurnNarrative(
    combatState: CombatState,
    playerAction: CardAction,
    result: ActionResult
  ): Promise<{
    actionDescription: string;  // 动作描述
    enemyReaction: string;      // 敌人反应
    consequence: string;        // 结果描述
  }>;

  // 战斗结果叙事
  generateBattleOutcome(
    victory: boolean,
    combatState: CombatState,
    playerState: PlayerState
  ): Promise<{
    summary: string;           // 战斗总结
    reflection: string;        // 人生感悟
    attributeImpact: Partial<PlayerAttributes>;
  }>;

  // AI对手行为增强
  generateEnemyIntentNarrative(
    enemy: Enemy,
    intent: EnemyIntent,
    turn: number
  ): string;
}
```

#### 3.2.2 战斗叙事触发点

| 触发时机 | 叙事内容 | 示例 |
|---------|---------|------|
| 战斗开始 | 场景描述、敌人登场 | "一只巨大的妖兽从阴影中走出..." |
| 玩家出牌 | 动作描写 | "你挥出一剑，剑光如虹..." |
| 敌人行动 | 反应描述 | "妖兽怒吼一声，利爪横扫..." |
| 暴击/格挡 | 特写描述 | "这一击势如破竹，正中要害！" |
| 战斗胜利 | 结局叙事 | "你站在胜利的战场上，感慨万千..." |
| 战斗失败 | 临终叙事 | "眼前渐渐模糊，你回忆起..." |

---

### 3.3 AI驱动的NPC对话系统（P1）

#### 3.3.1 NPC对话接口

```typescript
interface AINPCConversator {
  context: {
    npc: NPC;
    relationship: number;
    playerAttributes: PlayerAttributes;
    recentEvents: LifeRecord[];
    bondGroup: BondGroup | null;
  };

  // 生成对话
  generateDialogue(
    trigger: 'random_event' | 'player_init' | 'milestone' | 'combat_aftermath'
  ): Promise<{
    dialogue: string;              // NPC对话内容
    emotion: NPCEmotion;           // 情感状态
    options: PlayerResponse[];     // 玩家回应选项
    relationshipDelta: number;     // 关系变化
  }>;

  // 羁绊事件生成
  generateBondEvent(bondGroup: BondGroup): Promise<BondEvent>;

  // 回忆对话
  generateMemoryDialogue(
    memory: LifeRecord,
    npcId: string
  ): Promise<string>;
}
```

#### 3.3.2 NPC对话触发条件

| 触发条件 | 对话类型 | 内容示例 |
|---------|---------|---------|
| 随机遭遇 | 日常闲聊 | "最近过得怎么样？" |
| 玩家主动 | 请求/分享 | "我想和你聊聊..." |
| 人生里程碑 | 祝贺/安慰 | "听说你突破了？恭喜！" |
| 战斗后 | 关心/鼓励 | "你受伤了，还好吗？" |
| 共同经历 | 回忆 | "还记得我们第一次见面吗？" |

---

### 3.4 人生传记AI生成（P2）

#### 3.4.1 传记生成接口

```typescript
interface AutobiographyGenerator {
  generateLifeSummary(gameState: GameState): Promise<{
    title: string;                    // 人生标题
    subtitle: string;                 // 副标题
    chapters: LifeChapter[];          // 章节
    personalityArc: string;           // 性格弧线
    legacy: string;                   // 遗产/传承
    alternateWhatIfs: string[];       // "如果..."的想象
  }>;

  generateChapter(
    era: number,
    events: LifeRecord[],
    choices: ChoiceRecord[]
  ): Promise<{
    title: string;
    narrative: string;               // 叙事文本
    keyMoments: string[];            // 关键时刻
    characterGrowth: string;         // 成长描述
  }>;
}
```

#### 3.4.2 传记章节结构

| 章节 | 标题格式 | 内容要点 |
|------|---------|---------|
| 第一章 | 童年 | 家庭背景、早期教育、性格形成 |
| 第二章 | 少年 | 求学经历、友谊、初恋 |
| 第三章 | 青年 | 事业起步、挑战、成长 |
| 第四章 | 壮年 | 成就、责任、平衡 |
| 第五章 | 中年 | 反思、转折、传承 |
| 第六章 | 暮年 | 回忆、智慧、告别 |
| 尾声 | 传奇 | 一生总结、遗产、影响 |

---

### 3.5 世界事件AI系统（P2）

#### 3.5.1 世界事件接口

```typescript
interface WorldEventAI {
  // 时代事件
  generateEraEvent(
    era: number,
    worldState: WorldState,
    playerState: GameState
  ): Promise<{
    title: string;
    description: string;
    globalEffect: Partial<WorldState>;
    personalImpact: string;
  }>;

  // 随机传闻
  generateRumor(worldState: WorldState): string;

  // 历史变迁叙事
  generateEraTransitionNarrative(
    fromEra: number,
    toEra: number,
    worldState: WorldState
  ): string;
}
```

---

## 四、建议的文件结构

```
src/
├── services/
│   └── ai/
│       ├── SimulationAIService.ts      # 重构原有服务
│       ├── EnhancedSimulationAI.ts     # 增强事件生成
│       ├── CombatNarrativeAI.ts        # 战斗叙事
│       ├── NPCConversator.ts           # NPC对话
│       ├── AutobiographyAI.ts          # 传记生成
│       ├── WorldEventAI.ts             # 世界事件
│       ├── contextBuilder.ts           # 上下文构建器
│       └── aiTypes.ts                  # 类型定义
├── ai_config/
│   └── prompts/
│       ├── event_generation_v2.md      # 增强事件生成
│       ├── combat_narrative.md         # 战斗叙事
│       ├── npc_dialogue.md             # NPC对话
│       ├── life_summary.md             # 人生总结
│       ├── world_event.md              # 世界事件
│       └── shared_templates.md         # 共享模板
└── stores/
    └── simulationStore.ts              # 扩展store
```

---

## 五、实现优先级与里程碑

### 5.1 优先级矩阵

| 优先级 | 模块 | 预期效果 | 复杂度 | 预计工时 |
|--------|------|---------|--------|---------|
| P0 | 增强事件生成 | 立即提升事件多样性 | 中 | 2-3天 |
| P1 | 战斗叙事 | 增加战斗沉浸感 | 中 | 2-3天 |
| P1 | NPC对话 | 深化羁绊系统 | 高 | 4-5天 |
| P2 | 人生传记 | 提升结束体验 | 低 | 1-2天 |
| P2 | 世界事件 | 增强时代感 | 中 | 2-3天 |
| P3 | 完整叙事弧 | 全方位叙事体验 | 高 | 5-7天 |

### 5.2 里程碑计划

**里程碑1：事件系统增强（第1周）**
- [ ] 实现 ContextBuilder 上下文构建器
- [ ] 实现 EnhancedSimulationAI 增强事件生成
- [ ] 编写 event_generation_v2.md 提示词模板
- [ ] 集成到 simulationStore

**里程碑2：战斗与NPC（第2-3周）**
- [ ] 实现 CombatNarrativeAI 战斗叙事
- [ ] 实现 NPCConversator NPC对话系统
- [ ] 编写对应提示词模板
- [ ] 测试与调优

**里程碑3：总结与世界（第4周）**
- [ ] 实现 AutobiographyAI 人生传记
- [ ] 实现 WorldEventAI 世界事件
- [ ] 整体测试与优化

---

## 六、集成方案

### 6.1 在 simulationStore 中的集成

```typescript
import { enhancedSimulationAI, ContextBuilder } from '../services/ai';

// 替换原有的 generateAIEvent 方法
generateAIEvent: async () => {
  const s = get();
  if (!s.birthYear || !s.aiEnabled) return;

  set({ aiLoading: true });

  try {
    const contextBuilder = new ContextBuilder();
    const context = contextBuilder.buildEventContext(s);
    
    const eventType = enhancedSimulationAI.determineEventType(
      s.age, s.currentEra, s.attributes
    );

    const event = await enhancedSimulationAI.generateEnhancedEvent(
      context, eventType
    );

    if (event) {
      set({ aiGeneratedEvent: event, aiLoading: false });
    } else {
      set({ aiLoading: false, aiGeneratedEvent: null });
    }
  } catch (error) {
    console.error('AI事件生成错误:', error);
    set({ aiLoading: false, aiGeneratedEvent: null });
  }
},
```

### 6.2 新增Store状态

```typescript
// 在 GameState 中新增以下字段
interface GameState {
  // ... 现有字段
  
  // AI增强相关
  aiEventHistory: string[];        // AI事件历史ID
  ongoingStorylines: Storyline[];  // 进行中的故事线
  combatNarratives: string[];      // 战斗叙事记录
  npcDialogues: NPCDialogue[];     // NPC对话记录
}
```

---

## 七、设计亮点

### 7.1 上下文丰富度提升

| 维度 | 原有 | 增强后 |
|------|------|--------|
| 字段数量 | 4个 | 15+个 |
| 属性分析 | 简单列表 | 优势/劣势摘要 |
| 性格推导 | 无 | 从属性自动推导 |
| 时代背景 | 无 | 动态生成 |
| 表现追踪 | 无 | 成功率/战斗率/财富效率 |
| 故事线 | 无 | 追踪进行中和已解决的故事线 |

### 7.2 事件类型智能推断

根据玩家年龄、时代、属性自动选择最合适的事件类型，确保：
- 童年/少年：个人成长事件
- 青年/壮年：人际关系、机遇事件
- 中年/暮年：道德困境、传承事件
- 老年/耄耋：怀旧事件

### 7.3 叙事连贯性

- 追踪进行中的故事线
- 引用玩家过去的经历
- 事件结果影响后续事件生成
- 保持前后一致的叙事风格

### 7.4 个性化选项设计

- 选项权重与玩家属性挂钩
- 高属性选项有更高成功率
- 避免"明显正确"的选项
- 每个选项体现不同价值观

---

## 八、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| AI响应延迟 | 用户体验下降 | 显示加载动画，设置超时回退 |
| AI生成内容质量不稳定 | 体验不一致 | 内容验证，失败时回退到静态事件 |
| API成本 | 运营成本增加 | 缓存常见事件，限制调用频率 |
| 内容审核 | 可能生成不当内容 | 添加内容过滤，设置安全词 |

---

## 九、后续扩展方向

1. **多语言支持**：根据用户语言生成对应语言的事件
2. **语音输出**：为事件和对话添加语音朗读
3. **图像生成**：为重要事件生成配图
4. **情感分析**：根据玩家选择调整叙事风格
5. **社交分享**：生成可分享的人生故事卡片

---

*文档版本：v1.0*
*创建日期：2026-07-30*
*作者：AI Assistant*
