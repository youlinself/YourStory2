# AI生成内容结构化分析与容错设计

## 一、现有逻辑可AI生成内容分析

### 1.1 内容分类总览

根据对 `simulationData.ts`、`eraEvents.ts`、`simulation.ts` 的分析，将现有数据字段分为三类：

| 分类 | 特征 | 典型字段 | AI生成适用性 |
|------|------|---------|-------------|
| **纯文本描述类** | 无数值约束、无逻辑依赖、仅用于展示 | `description`、`baseText`、`text`、`label` | ✅ 高优先级 |
| **结构化数据类** | 有严格类型约束、参与逻辑计算 | `effects`、`attributeChanges`、`successRate` | ⚠️ 需验证 |
| **系统标识类** | 代码引用、唯一性约束 | `id`、`type`、`icon`、`rarity` | ❌ 不可生成 |

### 1.2 可AI生成的文本字段清单

#### A. 事件系统 (`GameEvent`)

| 字段 | 类型 | 当前示例 | AI生成建议 |
|------|------|---------|-----------|
| `title` | `string` | "蹒跚学步" | ✅ 可生成，需符合时代背景 |
| `baseText` | `string` | "一岁的你开始尝试着迈出人生的第一步。" | ✅ 核心生成目标 |
| `skinRule` 返回值 | `string` | "你身体壮实，没几天就能摇摇晃晃地走了。" | ✅ 可生成，需基于属性条件 |

#### B. 选项系统 (`EventOption`)

| 字段 | 类型 | 当前示例 | AI生成建议 |
|------|------|---------|-----------|
| `text` | `string` | "在家里探索" | ✅ 可生成，需简洁有力 |
| `successOutcome.description` | `string` | "你摸遍了家里的每个角落..." | ✅ 核心生成目标 |
| `failureOutcome.description` | `string` | "你摔了一跤，哇哇大哭..." | ✅ 核心生成目标 |

#### C. 卡牌系统 (`LifeCard`)

| 字段 | 类型 | 当前示例 | AI生成建议 |
|------|------|---------|-----------|
| `name` | `string` | "日常努力" | ⚠️ 可生成但需去重 |
| `description` | `string` | "普通的一击，持之以恒亦有力量" | ✅ 可生成，需符合稀有度 |

#### D. 敌人系统 (`Enemy`)

| 字段 | 类型 | 当前示例 | AI生成建议 |
|------|------|---------|-----------|
| `name` | `string` | "拖延史莱姆" | ⚠️ 可生成但需去重 |
| `description` | `string` | "拖延是时间最大的小偷" | ✅ 可生成 |

#### E. 遗物系统 (`LifeRelic`)

| 字段 | 类型 | 当前示例 | AI生成建议 |
|------|------|---------|-----------|
| `name` | `string` | "灵石" | ⚠️ 可生成但需去重 |
| `description` | `string` | "蕴含着天地灵气" | ✅ 可生成 |

---

## 二、JSON结构约束与验证点

### 2.1 核心接口约束分析

#### `EventOutcome` 接口约束

```typescript
interface EventOutcome {
  description: string;                          // ✅ 自由文本
  attributeChanges: Partial<PlayerAttributes>;  // ⚠️ 键名必须属于固定枚举
  npcRelationshipChanges?: { npcId: string; delta: number }[];
  unlockEvents?: string[];                      // ⚠️ 必须引用有效事件ID
  lockEvents?: string[];                        // ⚠️ 必须引用有效事件ID
  nextEraModifier?: number;                     // ⚠️ 数值范围约束
  lifeCost?: number;                            // ⚠️ 非负整数
  cardRewards?: LifeCard[];                     // ⚠️ 必须引用有效卡牌ID
  relicRewards?: LifeRelic[];                   // ⚠️ 必须引用有效遗物ID
  goldReward?: number;                          // ⚠️ 非负整数
  triggerCombat?: boolean;                      // ✅ 布尔值
  relicRewardPool?: LifeRelic[];                // ⚠️ 必须引用有效遗物ID
}
```

#### `PlayerAttributes` 有效键名白名单

```typescript
type PlayerAttributeKey = 
  | 'energy'    // 精力
  | 'physique'  // 体魄
  | 'health'    // 健康
  | 'iq'        // 智商
  | 'eq'        // 情商
  | 'wealth'    // 财富
  | 'network'   // 人脉
  | 'fame';     // 名望
```

#### `EventOption` 接口约束

```typescript
interface EventOption {
  id: string;                                    // ❌ 系统生成
  text: string;                                  // ✅ AI可生成
  successRate: Partial<Record<keyof PlayerAttributes, number>>; // ⚠️ 键名必须属于白名单
  successOutcome: EventOutcome;                  // ⚠️ 嵌套验证
  failureOutcome: EventOutcome;                  // ⚠️ 嵌套验证
  tagModifier?: { tag: string; rateBonus: number };
}
```

### 2.2 验证点矩阵

| 验证层级 | 验证内容 | 验证方式 | 失败处理策略 |
|---------|---------|---------|-------------|
| **语法层** | JSON格式合法性 | `JSON.parse()` | 尝试修复或丢弃 |
| **结构层** | 必填字段存在性 | Schema校验 | 补充默认值 |
| **类型层** | 字段类型正确性 | TypeScript类型守卫 | 类型转换或默认值 |
| **枚举层** | 值属于预设白名单 | 白名单过滤 | 忽略无效值或默认值 |
| **引用层** | ID引用有效性 | 注册表查找 | 移除无效引用 |
| **范围层** | 数值在合理区间 | 范围校验 | 截断到边界值 |
| **逻辑层** | 前后一致性 | 自定义规则 | 重新生成或人工干预 |

### 2.3 高风险字段识别

以下字段在AI生成时最容易出现问题：

| 字段 | 风险类型 | 示例错误 | 影响 |
|------|---------|---------|------|
| `attributeChanges` 的键名 | 枚举越界 | `{"智力": 5}` 而非 `{"iq": 5}` | 属性不生效 |
| `successRate` 的键名 | 枚举越界 | `{"体力": 0.5}` 而非 `{"physique": 0.5}` | 成功率计算失败 |
| `cardRewards` 的ID | 引用不存在 | `"card_not_exist"` | 奖励发放失败 |
| `relicRewards` 的ID | 引用不存在 | `"relic_not_exist"` | 奖励发放失败 |
| `unlockEvents` 的ID | 引用不存在 | `"event_not_exist"` | 事件无法解锁 |
| `attributeChanges` 的值 | 类型错误 | `{"iq": "很高"}` | 数值计算异常 |
| `goldReward` | 数值溢出 | `999999999` | 经济系统失衡 |
| `lifeCost` | 负值 | `-100` | 逻辑错误 |

---

## 三、AI输出容错与修复机制设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Output Validation Pipeline                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  Raw AI  │───▶│  Syntax  │───▶│ Structure│───▶│ Business │  │
│  │  Output  │    │  Repair  │    │ Validate │    │  Logic   │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │               │               │         │
│       ▼               ▼               ▼               ▼         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Original │    │ Repaired │    │ Validated│    │  Final   │  │
│  │  Text    │    │   JSON   │    │  Output  │    │  Result  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Fallback Strategy (降级策略)                 │   │
│  │  - 使用默认值替换无效字段                                  │   │
│  │  - 移除无法修复的引用                                      │   │
│  │  - 记录错误日志供后续分析                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 语法层修复（Syntax Repair）

#### 3.2.1 常见问题与修复策略

| 问题类型 | 示例 | 修复方法 |
|---------|------|---------|
| Markdown代码块包裹 | `\`\`\`json\n{...}\n\`\`\`` | 正则剥离 |
| 尾部逗号 | `{"a": 1,}` | 正则移除 |
| 单引号 | `{'a': 1}` | 替换为双引号 |
| 未转义换行 | `"line1\nline2"` | 转义处理 |
| 注释 | `{"a": 1 // 注释}` | 移除注释 |
| 多余文本 | `这是结果：{"a": 1}` | 提取JSON部分 |

#### 3.2.2 语法修复流程

```
Raw Input
    │
    ▼
┌─────────────────┐
│ 1. 去除首尾空白  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. 提取JSON部分  │◀── 使用正则 /{[\s\S]*}/ 或 /\[[\s\S]*\]/
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. 去除代码块    │◀── 匹配 ```json ... ```
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. 修复常见语法  │◀── 尾部逗号、单引号等
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. 尝试解析      │◀── JSON.parse()
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
 成功       失败
    │         │
    ▼         ▼
  输出    记录错误
         返回null
```

### 3.3 结构层验证（Structure Validation）

#### 3.3.1 EventOutcome 验证器设计

```typescript
// 验证结果类型
interface ValidationResult<T> {
  valid: boolean;
  data: T;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'critical';
  autoFixed: boolean;
  fallbackValue?: unknown;
}

// 验证器配置
interface ValidatorConfig {
  strictMode: boolean;        // 严格模式下，任何错误都导致失败
  autoFix: boolean;           // 是否自动修复可修复的错误
  removeInvalidRefs: boolean; // 是否移除无效引用
  clampNumbers: boolean;      // 是否截断数值到合理范围
}
```

#### 3.3.2 字段级验证规则

```typescript
const EVENT_OUTCOME_SCHEMA = {
  description: {
    type: 'string',
    required: true,
    maxLength: 500,
    fallback: '结果未知'
  },
  attributeChanges: {
    type: 'object',
    required: true,
    keyWhitelist: ['energy', 'physique', 'health', 'iq', 'eq', 'wealth', 'network', 'fame'],
    valueRange: [-100, 100],
    valueType: 'number',
    fallback: {}
  },
  goldReward: {
    type: 'number',
    required: false,
    min: 0,
    max: 10000,
    fallback: 0
  },
  lifeCost: {
    type: 'number',
    required: false,
    min: 0,
    max: 100,
    fallback: 0
  },
  cardRewards: {
    type: 'array',
    required: false,
    itemType: 'cardReference',
    fallback: []
  },
  // ... 其他字段
};
```

### 3.4 业务逻辑层验证

#### 3.4.1 引用完整性检查

```typescript
// 引用注册表（运行时构建）
interface ReferenceRegistry {
  cardIds: Set<string>;
  relicIds: Set<string>;
  eventIds: Set<string>;
  npcIds: Set<string>;
}

// 引用验证函数
function validateReferences(
  outcome: EventOutcome,
  registry: ReferenceRegistry
): EventOutcome {
  const repaired = { ...outcome };
  
  // 验证卡牌引用
  if (repaired.cardRewards) {
    repaired.cardRewards = repaired.cardRewards.filter(
      card => registry.cardIds.has(card.id)
    );
  }
  
  // 验证遗物引用
  if (repaired.relicRewards) {
    repaired.relicRewards = repaired.relicRewards.filter(
      relic => registry.relicIds.has(relic.id)
    );
  }
  
  // 验证事件引用
  if (repaired.unlockEvents) {
    repaired.unlockEvents = repaired.unlockEvents.filter(
      id => registry.eventIds.has(id)
    );
  }
  
  return repaired;
}
```

#### 3.4.2 数值平衡检查

```typescript
// 数值范围配置
const VALUE_LIMITS = {
  attributeChanges: { min: -50, max: 50 },    // 单次事件属性变化范围
  goldReward: { min: 0, max: 1000 },          // 金币奖励范围
  lifeCost: { min: 0, max: 20 },              // 生命消耗范围
  successRate: { min: 0, max: 1 },            // 成功率范围
};

// 数值截断函数
function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
```

### 3.5 降级策略（Fallback Strategy）

#### 3.5.1 多级降级机制

```
Level 1: 完全成功
    │    AI输出完全符合预期，直接使用
    ▼
Level 2: 自动修复
    │    存在可修复错误，修复后使用（记录警告）
    ▼
Level 3: 部分降级
    │    部分字段无效，使用默认值替换（记录错误）
    ▼
Level 4: 完全降级
    │    无法修复，使用预设模板替代（记录严重错误）
    ▼
Level 5: 跳过该内容
    │    生成失败，跳过该事件/选项，使用备选内容
```

#### 3.5.2 默认值配置

```typescript
const FALLBACK_DEFAULTS = {
  eventOutcome: {
    description: '事情的发展超出了预期...',
    attributeChanges: {},
    goldReward: 0,
    triggerCombat: false,
  },
  eventOption: {
    text: '观望一下',
    successRate: { energy: 0.5 },
    successOutcome: {
      description: '你决定再等等看。',
      attributeChanges: {},
    },
    failureOutcome: {
      description: '犹豫不决让你错失了机会。',
      attributeChanges: { energy: -1 },
    },
  },
  enemyDescription: '一个神秘的对手',
  cardDescription: '一张神秘的卡牌',
  relicDescription: '一件神秘的遗物',
};
```

### 3.6 中文键名映射（特殊处理）

由于AI可能使用中文属性名而非英文键名，需要建立映射表：

```typescript
const ATTRIBUTE_NAME_MAPPING: Record<string, keyof PlayerAttributes> = {
  // 中文 -> 英文
  '精力': 'energy',
  '体力': 'energy',
  '体魄': 'physique',
  '体质': 'physique',
  '健康': 'health',
  '智商': 'iq',
  '智力': 'iq',
  '智慧': 'iq',
  '情商': 'eq',
  '财富': 'wealth',
  '金钱': 'wealth',
  '人脉': 'network',
  '关系': 'network',
  '名望': 'fame',
  '声望': 'fame',
  '名誉': 'fame',
  
  // 英文别名
  'intelligence': 'iq',
  'charisma': 'eq',
  'money': 'wealth',
  'reputation': 'fame',
};

// 键名标准化函数
function normalizeAttributeKey(key: string): keyof PlayerAttributes | null {
  // 直接匹配
  if (key in ATTRIBUTE_NAME_MAPPING) {
    return ATTRIBUTE_NAME_MAPPING[key];
  }
  // 已经是有效键名
  if (['energy', 'physique', 'health', 'iq', 'eq', 'wealth', 'network', 'fame'].includes(key)) {
    return key as keyof PlayerAttributes;
  }
  return null;
}
```

---

## 四、混合生成策略建议

### 4.1 静态结构 + AI内容槽

推荐采用"模板+插槽"模式，而非让AI生成完整JSON：

```typescript
// 模板定义（硬编码）
interface EventTemplate {
  id: string;
  type: EventType;
  era: number;
  ageRange: AgeRange;
  triggerCondition?: (state: GameState) => boolean;
  
  // AI生成内容槽
  contentSlots: {
    title: AIGeneratedSlot<string>;
    baseText: AIGeneratedSlot<string>;
    options: AIGeneratedSlot<EventOptionContent[]>;
  };
  
  // 固定结构
  structure: {
    optionCount: [number, number];  // 选项数量范围
    outcomeTypes: OutcomeType[];    // 允许的结果类型
  };
}

// AI生成内容（仅包含自由文本）
interface EventOptionContent {
  text: string;
  successOutcome: {
    description: string;
    attributeChanges: Partial<PlayerAttributes>; // 仍需验证
  };
  failureOutcome: {
    description: string;
    attributeChanges: Partial<PlayerAttributes>; // 仍需验证
  };
}
```

### 4.2 分阶段生成策略

```
阶段1: 生成纯文本内容
    │    - 事件标题、描述、选项文本
    │    - 结果描述文本
    ▼
阶段2: 生成结构化数据（带约束）
    │    - 属性变化（提供白名单）
    │    - 数值奖励（提供范围）
    ▼
阶段3: 组装与验证
    │    - 将文本与结构数据组装
    │    - 执行完整验证流程
    ▼
阶段4: 后处理
    │    - 分配系统ID
    │    - 注册到引用表
    ▼
```

### 4.3 Prompt设计建议

#### 4.3.1 结构化输出Prompt模板

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
1. attributeChanges 的键名必须是以下之一：energy, physique, health, iq, eq, wealth, network, fame
2. attributeChanges 的数值范围：-20 到 20
3. options 数组长度：2-3个
4. 所有描述文本使用中文，不要使用英文

## 示例
[在此插入符合要求的示例]
```

#### 4.3.2 Few-Shot示例选择

选择示例时应考虑：
1. **覆盖性**：覆盖不同类型的属性变化
2. **典型性**：展示最常见的成功/失败模式
3. **边界性**：展示数值范围的边界情况

---

## 五、实施建议

### 5.1 优先级排序

| 阶段 | 任务 | 预期产出 | 风险评估 |
|------|------|---------|---------|
| P0 | 语法修复层 | 能处理90%的JSON格式问题 | 低 |
| P0 | 字段验证器 | 确保输出符合接口定义 | 低 |
| P1 | 中文键名映射 | 处理中英文键名混用 | 中 |
| P1 | 引用完整性检查 | 防止无效ID引用 | 中 |
| P2 | 数值平衡检查 | 防止数值溢出 | 中 |
| P2 | 自动修复机制 | 减少人工干预 | 高 |

### 5.2 监控指标

| 指标 | 目标值 | 监控方式 |
|------|-------|---------|
| JSON解析成功率 | >95% | 日志统计 |
| 自动修复率 | >80% | 日志统计 |
| 需要人工干预率 | <5% | 告警 |
| 平均修复时间 | <100ms | 性能监控 |

### 5.3 测试策略

1. **单元测试**：针对每个验证器
2. **集成测试**：端到端生成流程
3. **模糊测试**：输入各种异常格式
4. **回归测试**：确保修复不引入新问题

---

## 六、总结

### 6.1 核心原则

1. **最小化AI生成范围**：只让AI生成纯文本，结构化数据由代码控制
2. **多层验证**：语法→结构→业务逻辑，层层过滤
3. **优雅降级**：任何环节失败都有备选方案
4. **可观测性**：所有修复和降级都记录日志

### 6.2 推荐方案

采用"**模板驱动 + AI填充 + 严格验证**"的混合模式：

- **模板驱动**：事件结构、选项数量、结果类型由代码定义
- **AI填充**：标题、描述、选项文本由AI生成
- **严格验证**：所有AI输出经过多层验证后才进入游戏

这种方案既能发挥AI的创造力，又能确保游戏系统的稳定性和一致性。
