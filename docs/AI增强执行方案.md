# 模拟人生AI增强执行方案

## 一、项目概述

### 1.1 目标
为模拟人生游戏添加AI大模型增强功能，实现：
- 动态生成个性化事件、怪物、Boss、商店内容
- 基于玩家年龄和表现动态调整难度
- 后台预生成，减少玩家等待时间

### 1.2 现有技术栈
- 前端：React + TypeScript + Zustand
- AI服务：`src/services/ai/AIService.ts`（支持OpenAI/Ollama）
- 状态管理：`src/stores/simulationStore.ts`
- 数据定义：`src/types/simulation.ts`
- 提示词系统：`src_ai_config/promptComposer.ts`

---

## 二、核心设计要点

### 2.1 生成时机（4个触发点）

| 时机 | 触发条件 | 用户等待策略 |
|------|---------|-------------|
| **首次游戏开始** | 玩家选择出生年份后 | 显示AI生成loading页 |
| **Boss战期间** | 玩家进入Boss战斗（每十年第10年） | 后台异步生成下十年内容 |
| **Boss战后等待** | 玩家击败Boss但生成未完成 | 显示loading页等待 |
| **Boss战后完成** | 玩家击败Boss且生成已完成 | 直接进入新时代 |

### 2.2 年龄计算
- 实际年龄 = 当前年份 - 出生年份
- 时代索引 = Math.floor(实际年龄 / 10)
- 时代内年份 = 实际年龄 % 10（0-9）

### 2.3 各阶段生成内容

#### 阶段A：首次游戏开始（0-9岁）
- 普通怪物：8-10个（婴幼儿、童年主题）
- 精英怪物：2-3个（6-9岁，难度较低）
- Boss：1个（9岁，"童年终结"主题）
- 事件：15-20个（覆盖0-9岁）
- 商店卡牌：5-8张（低龄卡牌）

#### 阶段B：Boss战后台生成（下一个十年）
- 根据玩家当前年龄N，生成N+1~N+10岁内容
- 参考`monsterMapping.ts`的年龄段变体

### 2.4 年龄段与难度对照表

| 年龄段 | 年龄范围 | 难度系数 | 怪物主题示例 |
|--------|---------|---------|-------------|
| 婴幼儿 | 0-5岁 | 0.5 | 黏液泡泡、小幽灵 |
| 童年 | 6-9岁 | 0.6 | 鼻涕虫、恶作剧幽灵 |
| 少年 | 10-13岁 | 0.8 | 史莱姆、暗影人 |
| 青少年 | 14-17岁 | 1.0 | 酸液怪、叛逆暗影 |
| 大学 | 18-21岁 | 1.1 | 实验凝胶、迷茫幽灵 |
| 青年 | 22-29岁 | 1.3 | 职场泥怪、社畜幽魂 |
| 壮年 | 30-39岁 | 1.5 | 油腻怪、KPI恶鬼 |
| 中年 | 40-49岁 | 1.7 | 脂肪肝怪、房贷幽灵 |
| 知天命 | 50-59岁 | 1.6 | 养生果冻、看透幽魂 |
| 花甲 | 60-69岁 | 1.5 | 枸杞史莱姆、广场舞幽灵 |
| 古稀 | 70-79岁 | 1.4 | 太极凝胶、长寿幽魂 |
| 杖朝 | 80-89岁 | 1.3 | 仙丹软糖、仙风幽灵 |
| 期颐 | 90-99岁 | 1.2 | 长生果冻、长生鬼仙 |
| 长寿之星 | 100-110岁 | 1.5 | 寿星凝胶、万年鬼王 |
| 传奇人生 | 111-999岁 | 2.0 | 混沌原液、混沌魔神 |

### 2.5 难度动态调整
难度 = 基础难度 × 胜率修正 × 生命百分比修正 × 死亡次数修正

- 胜率>80%：难度×1.2
- 胜率<40%：难度×0.8
- 战斗后血量>70%：难度×1.1
- 战斗后血量<30%：难度×0.9
- 死亡次数：难度×max(0.7, 1 - 死亡次数×0.05)

---

## 三、实施步骤

### 第一阶段：基础框架（预计2天）

#### 步骤1：添加状态字段
在 `src/types/simulation.ts` 的 `GameState` 中添加：
```typescript
// AI生成相关状态
aiGenerationState: {
  isGenerating: boolean;
  generationPhase: 'idle' | 'preparing' | 'generating_events' | 
                   'generating_monsters' | 'generating_boss' | 
                   'generating_shop' | 'finalizing';
  progress: number;
  targetEra: number;
  startTime: number;
  estimatedDuration: number;
};

// 预生成的内容缓存
preGeneratedContent: {
  era: number;
  ageRange: [number, number];
  events: GameEvent[];
  enemies: Enemy[];
  boss: Enemy | null;
  shopCards: LifeCard[];
  isComplete: boolean;
} | null;

// Loading类型
loadingType?: 'generation_wait' | 'initial_generation';
```

#### 步骤2：创建AI生成服务
创建 `src/services/ai/SimulationGenerationService.ts`：
- 封装AI调用逻辑
- 构建生成上下文
- 调用AIService获取生成内容
- 实现内容验证和修复

#### 步骤3：实现核心生成函数
```typescript
// 难度计算
function getBaseDifficultyByAge(age: number): number
function calculateDifficulty(ctx: DifficultyContext): number
function getTargetAgeRange(currentAge: number): { start: number; end: number }
function buildGenerationContext(gameState: GameState): GenerationContext

// 内容生成
async function generateEraEvents(context: GenerationContext): Promise<GameEvent[]>
async function generateEraEnemies(context: GenerationContext): Promise<Enemy[]>
async function generateEraBoss(context: GenerationContext): Promise<Enemy>
async function generateEraShopCards(context: GenerationContext): Promise<LifeCard[]>

// 验证与组装
async function validateAndAssemble(params: {
  era: number;
  ageRange: [number, number];
  events: GameEvent[];
  enemies: Enemy[];
  boss: Enemy;
  shopCards: LifeCard[];
}): Promise<PreGeneratedContent>
```

#### 步骤4：添加Store Action
在 `src/stores/simulationStore.ts` 中添加：
```typescript
startBackgroundGeneration: async (targetEra: number) => { ... }
```

### 第二阶段：集成到游戏流程（预计1.5天）

#### 步骤5：修改enterOption
修改 `src/stores/simulationStore.ts` 中的 `enterOption`：
```typescript
case 'boss': {
  // ... 现有代码 ...
  // 后台启动下十年内容生成
  const nextEra = s.currentEra + 1;
  if (nextEra < ERAS.length) {
    setTimeout(() => {
      get().startBackgroundGeneration(nextEra);
    }, 100);
  }
  break;
}
```

#### 步骤6：修改completeOption
修改 `src/stores/simulationStore.ts` 中的 `completeOption`：
- 检查是否是Boss年
- 检查预生成内容是否完成
- 完成：直接执行advanceEra()
- 未完成：显示loading页等待，设置轮询检查

#### 步骤7：修改首次游戏开始流程
修改 `startGame` 或相关初始化逻辑：
- 设置phase为'loading'
- 调用startBackgroundGeneration(0)
- 生成完成后进入year_view

### 第三阶段：UI组件（预计1天）

#### 步骤8：创建AIGenerationLoading组件
创建 `src/components/simulation/AIGenerationLoading.tsx`：
- 显示生成进度条
- 显示当前年龄段和目标年龄段
- 显示预估剩余时间
- 支持等待生成完成的状态

#### 步骤9：集成到主页面
修改 `src/pages/Simulation/index.tsx`：
- 监听phase === 'loading'状态
- 显示AIGenerationLoading组件

### 第四阶段：验证与降级（预计1天）

#### 步骤10：实现内容验证层
创建 `src/services/ai/ContentValidator.ts`：
- JSON语法修复
- 字段类型验证
- 枚举值白名单过滤
- 引用完整性检查
- 数值范围截断
- 中文键名映射

#### 步骤11：实现降级策略
```typescript
function getDefaultEraContent(era: number): PreGeneratedContent {
  // 当AI生成失败时，使用预设的默认内容
  const baseAge = era * 10;
  const ageStage = getAgeStage(baseAge);
  return {
    era,
    events: getDefaultEventsForEra(era),
    enemies: getDefaultEnemiesForEra(ageStage),
    boss: createAnnualBoss(baseAge, 2024, 1.0),
    shopCards: getDefaultShopCards(era),
    isComplete: true,
    isDefault: true,
  };
}
```

#### 步骤12：超时处理
- 生成超时时间：30秒
- 超时后使用默认内容
- 静默降级，用户无感知

---

## 四、文件结构

```
src/
├── services/ai/
│   ├── AIService.ts                    # 现有：基础AI服务
│   ├── SimulationGenerationService.ts  # 新增：模拟人生生成服务
│   ├── ContentValidator.ts             # 新增：内容验证器
│   └── prompts/                        # 新增：提示词模板
│       ├── event_generation.md
│       ├── enemy_generation.md
│       ├── boss_generation.md
│       └── shop_generation.md
├── stores/
│   └── simulationStore.ts              # 修改：添加生成逻辑
├── components/simulation/
│   └── AIGenerationLoading.tsx         # 新增：生成Loading组件
├── types/
│   └── simulation.ts                   # 修改：添加状态类型
└── pages/Simulation/
    └── index.tsx                       # 修改：集成Loading组件
```

---

## 五、关键代码要点

### 5.1 中文键名映射
AI可能使用中文属性名，需要映射到英文：
```typescript
const ATTRIBUTE_NAME_MAPPING: Record<string, keyof PlayerAttributes> = {
  '精力': 'energy', '体力': 'energy',
  '体魄': 'physique', '体质': 'physique',
  '健康': 'health',
  '智商': 'iq', '智力': 'iq', '智慧': 'iq',
  '情商': 'eq',
  '财富': 'wealth', '金钱': 'wealth',
  '人脉': 'network', '关系': 'network',
  '名望': 'fame', '声望': 'fame', '名誉': 'fame',
};
```

### 5.2 生成状态流转
```
idle → preparing → generating_events → generating_monsters 
     → generating_boss → generating_shop → finalizing → idle
```

### 5.3 异常处理策略
| 场景 | 处理方式 | 用户体验 |
|------|---------|---------|
| 生成 < 10秒 | 正常等待 | 显示进度 |
| 生成 10-30秒 | 继续等待 | 显示"即将完成" |
| 生成 > 30秒 | 使用默认内容 | 静默降级，无感知 |
| 生成失败 | 使用默认内容 | 静默降级，无感知 |

### 5.4 验证点矩阵
| 验证层级 | 验证内容 | 失败处理策略 |
|---------|---------|-------------|
| 语法层 | JSON格式合法性 | 尝试修复或丢弃 |
| 结构层 | 必填字段存在性 | 补充默认值 |
| 类型层 | 字段类型正确性 | 类型转换或默认值 |
| 枚举层 | 值属于预设白名单 | 忽略无效值或默认值 |
| 引用层 | ID引用有效性 | 移除无效引用 |
| 范围层 | 数值在合理区间 | 截断到边界值 |

---

## 六、Prompt设计要点

### 6.1 结构化输出Prompt模板
```markdown
# 任务：生成模拟人生事件内容

## 输出格式
请输出以下JSON格式：
```json
{
  "title": "事件标题（10字以内）",
  "baseText": "事件描述（50-100字）",
  "options": [
    {
      "text": "选项文本（20字以内）",
      "successOutcome": {
        "description": "成功结果描述",
        "attributeChanges": {"iq": 5, "eq": 3}
      },
      "failureOutcome": {
        "description": "失败结果描述",
        "attributeChanges": {"energy": -2}
      }
    }
  ]
}
```

## 约束条件
1. attributeChanges 的键名必须是：energy, physique, health, iq, eq, wealth, network, fame
2. attributeChanges 的数值范围：-20 到 20
3. options 数组长度：2-3个
4. 所有描述文本使用中文
```

### 6.2 Few-Shot示例选择
- 覆盖性：覆盖不同类型的属性变化
- 典型性：展示最常见的成功/失败模式
- 边界性：展示数值范围的边界情况

---

## 七、注意事项

### 7.1 性能优化
- 后台生成不阻塞UI
- 使用setTimeout确保战斗UI先渲染
- 轮询间隔200ms检查生成完成
- 超时时间30秒

### 7.2 用户体验
- 首次游戏等待时间 < 15秒
- 后续时代90%情况下无需等待
- 最坏情况等待时间 < 30秒
- 显示当前年龄和目标年龄段

### 7.3 容错处理
- AI生成失败时使用默认内容
- 静默降级，用户无感知
- 记录错误日志供后续分析

### 7.4 测试策略
- 单元测试：每个验证器
- 集成测试：端到端生成流程
- 模糊测试：输入各种异常格式
- 回归测试：确保修复不引入新问题

---

## 八、验收标准

1. **首次游戏**：选择出生年份后，显示AI生成Loading，15秒内完成并进入游戏
2. **Boss战期间**：进入Boss战斗后，后台自动启动下十年内容生成
3. **Boss战后**：
   - 如果生成已完成，直接进入新时代
   - 如果生成未完成，显示Loading页等待，30秒内完成
4. **内容质量**：生成的事件、怪物符合年龄段主题
5. **难度平衡**：根据玩家表现动态调整难度
6. **异常处理**：生成失败时使用默认内容，用户无感知

---

## 九、后续优化（可选）

1. **缓存机制**：本地缓存已生成的内容，重复游玩时加速
2. **监控指标**：生成时间、成功率、降级率
3. **A/B测试**：对比AI生成内容 vs 固定内容的用户留存
4. **个性化**：根据玩家历史选择调整生成风格
