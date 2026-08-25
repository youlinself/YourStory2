# AI生成时机与调度设计方案

## 一、需求总结

| 时机 | 触发条件 | 用户等待策略 |
|------|---------|-------------|
| **首次游戏开始** | 玩家选择出生年份后 | 显示AI生成loading页 |
| **Boss战期间** | 玩家进入Boss战斗（每十年第10年） | 后台异步生成下十年内容 |
| **Boss战后等待** | 玩家击败Boss但生成未完成 | 显示loading页等待 |
| **Boss战后完成** | 玩家击败Boss且生成已完成 | 直接进入新时代 |

---

## 二、游戏流程与生成时机映射

### 2.1 当前游戏流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          十年周期流程（当前）                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐   ┌──────────┐        ┌──────────┐   ┌──────────────┐   │
│  │ 第1年    │──▶│ 第2年    │──...──▶│ 第9年    │──▶│ 第10年(Boss) │   │
│  └──────────┘   └──────────┘        └──────────┘   └──────┬───────┘   │
│                                                            │           │
│                                                            ▼           │
│                                                   ┌──────────────┐    │
│                                                   │ completeOption│    │
│                                                   │ completed=true │    │
│                                                   └──────┬───────┘    │
│                                                          │            │
│                                                          ▼            │
│                                                   ┌──────────────┐    │
│                                                   │ advanceEra()  │    │
│                                                   │ phase=loading │    │
│                                                   └──────┬───────┘    │
│                                                          │            │
│                                                          ▼            │
│                                                   ┌──────────────┐    │
│                                                   │ generateMap() │    │
│                                                   │ 同步生成十年内容│    │
│                                                   └──────┬───────┘    │
│                                                          │            │
│                                                          ▼            │
│                                                   ┌──────────────┐    │
│                                                   │ year_view     │    │
│                                                   │ 展示新十年地图 │    │
│                                                   └──────────────┘    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 AI增强后的游戏流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          十年周期流程（AI增强版）                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 阶段A：首次游戏开始                                               │    │
│  │ 触发：玩家选择出生年份 → 点击"开始人生"                            │    │
│  │ 生成内容：第1年(0-9岁)的全部事件、怪物、Boss、商店                  │    │
│  │ 用户等待：显示AI生成loading页（预计5-15秒）                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 阶段B：第1-9年游玩期                                              │    │
│  │ 玩家正常游玩，使用阶段A生成的内容                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 阶段C：Boss战触发（第10年）                                       │    │
│  │ 触发：玩家选择Boss选项 → 进入Boss战斗                             │    │
│  │ 后台动作：异步启动下十年内容生成（第11-20岁）                       │    │
│  │ 玩家状态：正常进行Boss战斗，不感知后台生成                         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 阶段D：Boss战后处理                                               │    │
│  │                                                                  │    │
│  │  ┌──────────────────────┐    ┌──────────────────────┐           │    │
│  │  │ D1: 生成已完成        │    │ D2: 生成未完成        │           │    │
│  │  │ 直接显示新时代地图    │    │ 显示loading页等待     │           │    │
│  │  └──────────────────────┘    └──────────────────────┘           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 阶段E：新时代开始                                                 │    │
│  │ 展示新十年地图，玩家继续游玩                                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 三、AI生成内容范围（结合玩家当前年份）

### 3.1 年龄计算基础

玩家年份计算公式：
- 实际年龄 = 当前年份 - 出生年份
- 时代索引 = Math.floor(实际年龄 / 10)
- 时代内年份 = 实际年龄 % 10（0-9）

### 3.2 各阶段生成内容清单

#### 阶段A：首次游戏开始（出生年份，0-9岁）

| 内容类型 | 数量 | 年龄关联说明 |
|---------|------|-------------|
| **普通怪物** | 8-10个 | 0-9岁年龄段，以"婴幼儿"、"童年"主题为主 |
| **精英怪物** | 2-3个 | 6-9岁年龄段，难度较低 |
| **Boss** | 1个 | 9岁Boss，"童年终结"主题 |
| **事件** | 15-20个 | 覆盖0-9岁，出生事件、婴儿期、幼儿期、幼儿园 |
| **商店卡牌** | 5-8张 | 低龄卡牌，高年龄卡牌设置ageRange限制 |
| **特殊事件** | 3-5个 | 出生事件(born)、蹒跚学步、幼年时光等里程碑 |

#### 阶段B：Boss战后台生成（下一个十年）

假设玩家当前年龄为N岁，即将进入N+1~N+10岁时代：

| 内容类型 | 数量 | 年龄关联说明 |
|---------|------|-------------|
| **普通怪物** | 15-20个 | 基于年龄段主题，参考`monsterMapping.ts`的变体 |
| **精英怪物** | 5-8个 | 难度随年龄递增 |
| **Boss** | 1个 | (N+10)岁Boss，基于`createAnnualBoss`动态生成 |
| **事件** | 20-30个 | 覆盖N+1~N+10岁，基于年龄过滤 |
| **商店卡牌** | 10-15张 | 基于玩家当前属性，优先提供高稀有度卡牌 |

#### 年龄段与内容主题对照表

| 年龄段 | 年龄范围 | 怪物主题 | 事件主题 | 难度系数 |
|--------|---------|---------|---------|---------|
| 婴幼儿 | 0-5岁 | 黏液泡泡、小幽灵 | 出生、婴儿期、幼儿期 | 0.5 |
| 童年 | 6-9岁 | 鼻涕虫、恶作剧幽灵 | 幼儿园、学前班 | 0.6 |
| 少年 | 10-13岁 | 史莱姆、暗影人 | 小学、少年烦恼 | 0.8 |
| 青少年 | 14-17岁 | 酸液怪、叛逆暗影 | 中学、青春期 | 1.0 |
| 大学 | 18-21岁 | 实验凝胶、迷茫幽灵 | 高考、大学生活 | 1.1 |
| 青年 | 22-29岁 | 职场泥怪、社畜幽魂 | 求职、创业、恋爱 | 1.3 |
| 壮年 | 30-39岁 | 油腻怪、KPI恶鬼 | 事业、婚姻、育儿 | 1.5 |
| 中年 | 40-49岁 | 脂肪肝怪、房贷幽灵 | 中年危机、养老 | 1.7 |
| 知天命 | 50-59岁 | 养生果冻、看透幽魂 | 养生、退休规划 | 1.6 |
| 花甲 | 60-69岁 | 枸杞史莱姆、广场舞幽灵 | 退休、含饴弄孙 | 1.5 |
| 古稀 | 70-79岁 | 太极凝胶、长寿幽魂 | 长寿、回忆 | 1.4 |
| 杖朝 | 80-89岁 | 仙丹软糖、仙风幽灵 | 智慧、传承 | 1.3 |
| 期颐 | 90-99岁 | 长生果冻、长生鬼仙 | 传奇、超越 | 1.2 |
| 长寿之星 | 100-110岁 | 寿星凝胶、万年鬼王 | 修仙、长生 | 1.5 |
| 传奇人生 | 111-999岁 | 混沌原液、混沌魔神 | 传说、神话 | 2.0 |

### 3.3 难度动态调整参数（结合年龄）

```typescript
interface DifficultyContext {
  // 基础难度（基于年龄段）
  baseDifficulty: number;        // 0.5 - 3.0，由年龄段决定
  
  // 玩家当前年龄
  playerAge: number;             // 当前实际年龄
  targetAgeStart: number;        // 目标时代起始年龄
  targetAgeEnd: number;          // 目标时代结束年龄
  
  // 玩家表现修正
  playerPerformance: {
    winRate: number;             // 最近10场战斗胜率
    avgHealthPercent: number;    // 战斗后平均生命百分比
    deathCount: number;          // 死亡次数
  };
  
  // 属性修正
  playerAttributes: PlayerAttributes;
  
  // 最终难度系数
  finalMultiplier: number;       // 计算后的最终难度
}

// 年龄段基础难度映射
const AGE_BASE_DIFFICULTY: Record<string, number> = {
  '婴幼儿': 0.5,    // 0-5岁
  '童年': 0.6,      // 6-9岁
  '少年': 0.8,      // 10-13岁
  '青少年': 1.0,    // 14-17岁
  '大学': 1.1,      // 18-21岁
  '青年': 1.3,      // 22-29岁
  '壮年': 1.5,      // 30-39岁
  '中年': 1.7,      // 40-49岁
  '知天命': 1.6,    // 50-59岁
  '花甲': 1.5,      // 60-69岁
  '古稀': 1.4,      // 70-79岁
  '杖朝': 1.3,      // 80-89岁
  '期颐': 1.2,      // 90-99岁
  '长寿之星': 1.5,  // 100-110岁
  '传奇人生': 2.0,  // 111-999岁
};

// 根据年龄获取基础难度
function getBaseDifficultyByAge(age: number): number {
  if (age <= 5) return 0.5;
  if (age <= 9) return 0.6;
  if (age <= 13) return 0.8;
  if (age <= 17) return 1.0;
  if (age <= 21) return 1.1;
  if (age <= 29) return 1.3;
  if (age <= 39) return 1.5;
  if (age <= 49) return 1.7;
  if (age <= 59) return 1.6;
  if (age <= 69) return 1.5;
  if (age <= 79) return 1.4;
  if (age <= 89) return 1.3;
  if (age <= 99) return 1.2;
  if (age <= 110) return 1.5;
  return 2.0;
}

// 难度计算公式
function calculateDifficulty(ctx: DifficultyContext): number {
  let difficulty = ctx.baseDifficulty;
  
  // 根据胜率调整
  if (ctx.playerPerformance.winRate > 0.8) {
    difficulty *= 1.2;  // 玩家太强，增加难度
  } else if (ctx.playerPerformance.winRate < 0.4) {
    difficulty *= 0.8;  // 玩家太弱，降低难度
  }
  
  // 根据生命百分比调整
  if (ctx.playerPerformance.avgHealthPercent > 0.7) {
    difficulty *= 1.1;
  } else if (ctx.playerPerformance.avgHealthPercent < 0.3) {
    difficulty *= 0.9;
  }
  
  // 根据死亡次数调整
  difficulty *= Math.max(0.7, 1 - ctx.playerPerformance.deathCount * 0.05);
  
  return Math.max(0.5, Math.min(3.0, difficulty));
}

// 计算目标时代的年龄范围
function getTargetAgeRange(currentAge: number): { start: number; end: number } {
  const currentEra = Math.floor(currentAge / 10);
  const nextEra = currentEra + 1;
  return {
    start: nextEra * 10,
    end: nextEra * 10 + 9,
  };
}

// 构建生成上下文
function buildGenerationContext(gameState: GameState): GenerationContext {
  const { age, attributes, choiceHistory } = gameState;
  const targetAgeRange = getTargetAgeRange(age);
  
  return {
    currentAge: age,
    currentYear: gameState.currentYear,
    birthYear: gameState.birthYear!,
    targetEra: Math.floor(age / 10) + 1,
    targetAgeStart: targetAgeRange.start,
    targetAgeEnd: targetAgeRange.end,
    playerAttributes: attributes,
    playerPerformance: calculatePlayerPerformance(choiceHistory),
    difficulty: calculateDifficulty({
      baseDifficulty: getBaseDifficultyByAge(targetAgeRange.start),
      playerAge: age,
      targetAgeStart: targetAgeRange.start,
      targetAgeEnd: targetAgeRange.end,
      playerAttributes: attributes,
      playerPerformance: calculatePlayerPerformance(choiceHistory),
    }),
  };
}
```

---

## 四、状态管理与流程控制

### 4.1 新增状态字段

```typescript
// 在 GameState 中添加
interface GameState {
  // ... 现有字段 ...
  
  // AI生成相关状态
  aiGenerationState: {
    isGenerating: boolean;        // 是否正在生成
    generationPhase: 'idle' | 'preparing' | 'generating_events' | 
                     'generating_monsters' | 'generating_boss' | 
                     'generating_shop' | 'finalizing';
    progress: number;             // 生成进度 0-100
    targetEra: number;            // 目标时代
    startTime: number;            // 开始时间
    estimatedDuration: number;    // 预计耗时(ms)
  };
  
  // 预生成的内容缓存
  preGeneratedContent: {
    era: number;
    events: GameEvent[];
    enemies: Enemy[];
    boss: Enemy | null;
    shopCards: LifeCard[];
    isComplete: boolean;
  } | null;
}
```

### 4.2 生成状态流转

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          生成状态流转图                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────┐                                                            │
│  │  idle   │◀──────────────────────────────────────────────────┐        │
│  └────┬────┘                                                   │        │
│       │                                                        │        │
│       │ 触发生成                                                │        │
│       ▼                                                        │        │
│  ┌─────────────┐                                               │        │
│  │ preparing   │ 准备生成上下文                                  │        │
│  └──────┬──────┘                                               │        │
│         │                                                      │        │
│         ▼                                                      │        │
│  ┌─────────────────┐                                           │        │
│  │ generating_     │ 生成事件内容                                 │        │
│  │ events          │                                           │        │
│  └──────┬──────────┘                                           │        │
│         │                                                      │        │
│         ▼                                                      │        │
│  ┌─────────────────┐                                           │        │
│  │ generating_     │ 生成怪物内容                                 │        │
│  │ monsters        │                                           │        │
│  └──────┬──────────┘                                           │        │
│         │                                                      │        │
│         ▼                                                      │        │
│  ┌─────────────────┐                                           │        │
│  │ generating_boss │ 生成Boss内容                                 │        │
│  └──────┬──────────┘                                           │        │
│         │                                                      │        │
│         ▼                                                      │        │
│  ┌─────────────────┐                                           │        │
│  │ generating_shop │ 生成商店内容                                 │        │
│  └──────┬──────────┘                                           │        │
│         │                                                      │        │
│         ▼                                                      │        │
│  ┌─────────────────┐                                           │        │
│  │ finalizing      │ 验证、组装、缓存                              │        │
│  └──────┬──────────┘                                           │        │
│         │                                                      │        │
│         │ 生成完成                                               │        │
│         └──────────────────────────────────────────────────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 五、核心流程详细设计

### 5.1 首次游戏开始流程（出生年份，0-9岁）

```
玩家选择出生年份（如1980年）
       │
       ▼
┌──────────────────┐
│ 点击"开始人生"    │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ 初始化游戏状态：                                          │
│ - birthYear: 1980                                         │
│ - currentYear: 1980                                       │
│ - age: 0岁                                                │
│ - currentEra: 0                                           │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ 构建生成上下文：                                          │
│ - targetEra: 0                                            │
│ - targetAgeStart: 0                                       │
│ - targetAgeEnd: 9                                         │
│ - baseDifficulty: 0.5（婴幼儿期）                          │
│ - 难度系数: 0.5-0.6                                        │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ 设置状态：                                                │
│ - phase: 'loading'                                       │
│ - aiGenerationState.isGenerating: true                    │
│ - aiGenerationState.targetEra: 0                          │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ 显示AI生成Loading页面：                                    │
│ - 标题："正在为你的人生做准备..."                           │
│ - 进度条：显示当前生成阶段                                  │
│ - 提示文字：正在生成0-9岁内容                              │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ 执行生成（低难度，简单内容）：                              │
│ 1. 生成0-9岁事件（出生、婴儿期、幼儿期、幼儿园）            │
│ 2. 生成低龄怪物（黏液泡泡、鼻涕虫等）                       │
│ 3. 生成9岁Boss（"童年终结"主题）                           │
│ 4. 生成低龄商店卡牌                                        │
│ 5. 验证所有内容                                           │
│ 6. 缓存到preGeneratedContent                              │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ 生成完成：                                                │
│ - phase: 'year_view'                                     │
│ - 展示0-9岁十年地图                                        │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Boss战后台生成流程（结合当前年龄）

```
玩家当前年龄：29岁（1980年出生，2009年）
时代索引：2（20-29岁）
时代内年份：9（第10年，Boss年）
       │
       ▼
玩家进入Boss战斗
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 触发：enterOption() → case 'boss'                         │
│                                                          │
│ 计算目标年龄范围：                                         │
│ - currentAge: 29                                          │
│ - currentEra: 2                                           │
│ - targetEra: 3                                            │
│ - targetAgeStart: 30                                      │
│ - targetAgeEnd: 39                                        │
│ - baseDifficulty: 1.5（壮年期）                            │
└────────┬─────────────────────────────────────────────────┘
         │
         │          ┌─────────────────────────────────────────┐
         │          │ 后台生成线程（不阻塞UI）                   │
         │          │                                         │
         │          │ 1. 构建生成上下文                        │
         │          │    - 目标时代：3（30-39岁）               │
         │          │    - 玩家当前属性                         │
         │          │    - 玩家表现统计                         │
         │          │    - 计算难度系数：1.5 * 表现修正          │
         │          │                                         │
         │          │ 2. 生成30-39岁内容                       │
         │          │    - 怪物：油腻怪、KPI恶鬼、脂肪肝怪       │
         │          │    - 事件：事业、婚姻、育儿、中年危机       │
         │          │    - Boss：壮年Boss                       │
         │          │    - 商店：高稀有度卡牌                    │
         │          │                                         │
         │          │ 3. 验证与缓存                            │
         │          │    - 存入preGeneratedContent             │
         │          │    - 标记isComplete: true                │
         │          └─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ 玩家进行Boss战斗...                                        │
│ （此时后台生成可能正在进行或已完成）                          │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ Boss战斗结束：                                             │
│                                                          │
│ 检查preGeneratedContent是否存在且isComplete:               │
│                                                          │
│  ┌────────────────────┬────────────────────────────┐     │
│  │ 是：生成已完成      │ 否：生成未完成              │     │
│  │                    │                            │     │
│  │ 直接执行advanceEra │ 显示loading页等待生成完成   │     │
│  │ age: 29→30         │ 生成完成后自动进入新时代     │     │
│  └────────────────────┴────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

### 5.3 生成等待Loading页

```
Boss击败，但生成未完成
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 设置状态：                                                │
│ - phase: 'loading'                                       │
│ - loadingType: 'generation_wait'                         │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ 显示等待Loading页面：                                      │
│ - 标题："正在准备下一个十年..."                             │
│ - 进度条：显示aiGenerationState.progress                   │
│ - 提示文字："请稍候，正在为你生成新的人生挑战"               │
│ - 可选：显示预估剩余时间                                    │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ 监听生成完成事件：                                          │
│ - 轮询检查preGeneratedContent.isComplete                   │
│ - 或监听generationComplete事件                              │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ 生成完成：                                                │
│ - 自动执行advanceEra()                                    │
│ - 展示新时代地图                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 六、代码实现方案

### 6.1 新增Action：startBackgroundGeneration（结合年龄）

```typescript
// 在 simulationStore 中添加

startBackgroundGeneration: async (targetEra: number) => {
  const s = get();
  
  // 如果已经在生成中，跳过
  if (s.aiGenerationState.isGenerating) return;
  
  // 计算目标年龄范围
  const targetAgeStart = targetEra * 10;
  const targetAgeEnd = targetEra * 10 + 9;
  const baseDifficulty = getBaseDifficultyByAge(targetAgeStart);
  
  // 初始化生成状态
  set({
    aiGenerationState: {
      isGenerating: true,
      generationPhase: 'preparing',
      progress: 0,
      targetEra,
      startTime: Date.now(),
      estimatedDuration: 10000,
    },
    preGeneratedContent: null,
  });
  
  try {
    // 1. 准备阶段
    set({ aiGenerationState: { ...s.aiGenerationState, generationPhase: 'preparing', progress: 5 } });
    
    const context = buildGenerationContext(s);
    
    await delay(100);
    
    // 2. 生成事件（基于年龄段）
    set({ aiGenerationState: { ...s.aiGenerationState, generationPhase: 'generating_events', progress: 15 } });
    const events = await generateEraEvents({
      ...context,
      ageRange: [targetAgeStart, targetAgeEnd],
      era: targetEra,
    });
    
    // 3. 生成怪物（基于年龄段主题）
    set({ aiGenerationState: { ...s.aiGenerationState, generationPhase: 'generating_monsters', progress: 40 } });
    const enemies = await generateEraEnemies({
      ...context,
      ageRange: [targetAgeStart, targetAgeEnd],
      monsterTheme: getMonsterThemeByAge(targetAgeStart),
    });
    
    // 4. 生成Boss（基于目标年龄）
    set({ aiGenerationState: { ...s.aiGenerationState, generationPhase: 'generating_boss', progress: 60 } });
    const boss = await generateEraBoss({
      ...context,
      bossAge: targetAgeEnd,  // Boss使用时代最后一年
      difficulty: baseDifficulty,
    });
    
    // 5. 生成商店（基于玩家当前属性）
    set({ aiGenerationState: { ...s.aiGenerationState, generationPhase: 'generating_shop', progress: 75 } });
    const shopCards = await generateEraShopCards({
      ...context,
      playerAttributes: s.attributes,
      era: targetEra,
    });
    
    // 6. 验证与组装
    set({ aiGenerationState: { ...s.aiGenerationState, generationPhase: 'finalizing', progress: 90 } });
    
    const validatedContent = await validateAndAssemble({
      era: targetEra,
      ageRange: [targetAgeStart, targetAgeEnd],
      events,
      enemies,
      boss,
      shopCards,
    });
    
    // 7. 缓存结果
    set({
      preGeneratedContent: {
        era: targetEra,
        ageRange: [targetAgeStart, targetAgeEnd],
        events: validatedContent.events,
        enemies: validatedContent.enemies,
        boss: validatedContent.boss,
        shopCards: validatedContent.shopCards,
        isComplete: true,
      },
      aiGenerationState: {
        ...s.aiGenerationState,
        generationPhase: 'idle',
        progress: 100,
        isGenerating: false,
      },
    });
    
    useSimulationStore.getState().emit('generationComplete', { era: targetEra });
    
  } catch (error) {
    console.error('AI生成失败:', error);
    set({
      aiGenerationState: {
        ...s.aiGenerationState,
        generationPhase: 'idle',
        isGenerating: false,
      },
    });
  }
},

### 6.2 修改enterOption中的Boss处理（结合年龄）

```typescript
// 修改 enterOption 中的 case 'boss'
case 'boss': {
  const rand = seededRandom(s.seed + s.currentEra * 100 + s.currentMap.currentYearIndex * 10 + Date.now() % 100);
  const enemies = getEnemyPool(opt.type, s.currentEra, year.eraIndex, rand, s.age, s.currentYear)
    .map((e) => ({ ...e, id: generateId(), currentHealth: e.maxHealth }));
  
  if (enemies.length > 0) {
    get().startCombat(enemies);
    
    // 后台启动下十年内容生成
    const nextEra = s.currentEra + 1;
    if (nextEra < ERAS.length) {
      // 计算目标年龄范围
      const targetAgeStart = nextEra * 10;
      const targetAgeEnd = nextEra * 10 + 9;
      
      // 使用 setTimeout 确保战斗UI先渲染
      setTimeout(() => {
        get().startBackgroundGeneration(nextEra);
      }, 100);
    }
  }
  break;
}

### 6.3 修改completeOption处理生成等待（结合年龄）

```typescript
// 修改 completeOption
completeOption: () => {
  const s = get();
  if (!s.currentMap) return;
  
  const yearIdx = s.currentMap.currentYearIndex;
  const newYears = [...s.currentMap.years];
  newYears[yearIdx] = { ...newYears[yearIdx], isCompleted: true };
  const nextIdx = yearIdx + 1;
  const completed = nextIdx >= YEARS_PER_ERA;
  const nextYearIndex = completed ? yearIdx : nextIdx;
  const newCurrentYear = (s.birthYear || 1950) + s.currentEra * 10 + nextYearIndex;
  const newAge = newCurrentYear - (s.birthYear || 1950);
  
  set({
    currentMap: { ...s.currentMap, years: newYears, currentYearIndex: nextYearIndex, completed },
    currentYear: newCurrentYear,
    age: newAge,
    phase: completed ? 'era_transition' : 'year_view'
  });
  
  if (completed) {
    // 检查是否是Boss年（第10年）
    const isBossYear = yearIdx === YEARS_PER_ERA - 1;
    
    if (isBossYear) {
      // Boss战结束，检查预生成内容是否完成
      const preGenerated = s.preGeneratedContent;
      const nextEra = s.currentEra + 1;
      const targetAgeStart = nextEra * 10;
      const targetAgeEnd = nextEra * 10 + 9;
      
      if (preGenerated && preGenerated.isComplete && preGenerated.era === nextEra) {
        // 生成已完成，直接进入新时代
        get().advanceEra();
      } else {
        // 生成未完成，显示等待loading
        set({ phase: 'loading', loadingType: 'generation_wait' });
        
        // 监听生成完成
        const checkInterval = setInterval(() => {
          const state = useSimulationStore.getState();
          if (state.preGeneratedContent?.isComplete && 
              state.preGeneratedContent.era === state.currentEra + 1) {
            clearInterval(checkInterval);
            set({ loadingType: undefined });
            state.advanceEra();
          }
        }, 200);
        
        // 超时处理：最多等待30秒
        setTimeout(() => {
          clearInterval(checkInterval);
          const state = useSimulationStore.getState();
          if (state.loadingType === 'generation_wait') {
            // 超时，使用默认内容
            console.warn('AI生成超时，使用默认内容');
            set({ loadingType: undefined });
            state.advanceEra();
          }
        }, 30000);
      }
    } else {
      // 非Boss年，正常推进
      get().advanceEra();
    }
  }
},

### 6.4 新增Loading页面组件（结合年龄）

```typescript
// AIGenerationLoading.tsx
import React from 'react';
import { useSimulationStore } from '../stores/simulationStore';

const PHASE_TEXT_MAP: Record<string, string> = {
  preparing: '正在分析你的人生轨迹...',
  generating_events: '正在创作人生故事...',
  generating_monsters: '正在塑造挑战...',
  generating_boss: '正在准备终极考验...',
  generating_shop: '正在准备机遇...',
  finalizing: '正在完善细节...',
};

// 年龄段描述
const AGE_STAGE_DESCRIPTIONS: Record<string, string> = {
  '婴幼儿': '初生的生命，对世界充满好奇',
  '童年': '无忧无虑的童年时光',
  '少年': '渐渐懂事的少年时期',
  '青少年': '青春期的叛逆与成长',
  '大学': '求学探索的阶段',
  '青年': '踏入社会的青年时期',
  '壮年': '事业有成的壮年时期',
  '中年': '肩负重任的中年时期',
  '知天命': '看透世事的知天命之年',
  '花甲': '花甲之年的智慧与从容',
  '古稀': '古稀之年的豁达与宁静',
  '杖朝': '杖朝之年的沉稳与睿智',
  '期颐': '期颐之年的长寿与福泽',
  '长寿之星': '超越常人的长寿存在',
  '传奇人生': '超越凡俗的传奇存在',
};

export const AIGenerationLoading: React.FC = () => {
  const aiGenerationState = useSimulationStore(s => s.aiGenerationState);
  const loadingType = useSimulationStore(s => s.loadingType);
  const currentAge = useSimulationStore(s => s.age);
  
  const isWaitingForGeneration = loadingType === 'generation_wait';
  const phaseText = PHASE_TEXT_MAP[aiGenerationState.generationPhase] || '正在生成...';
  
  // 计算目标年龄段
  const targetEra = aiGenerationState.targetEra;
  const targetAgeStart = targetEra * 10;
  const targetAgeEnd = targetEra * 10 + 9;
  const targetAgeStage = getAgeStageName(targetAgeStart);
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        {/* 动画图标 */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        
        {/* 标题 */}
        <h2 className="text-xl font-bold text-white mb-2">
          {isWaitingForGeneration ? '正在准备下一个十年...' : 'AI为你定制人生...'}
        </h2>
        
        {/* 年龄段信息 */}
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">当前年龄</p>
          <p className="text-lg font-bold text-white">{currentAge}岁</p>
          <p className="text-xs text-gray-500 mt-1">即将进入 {targetAgeStart}-{targetAgeEnd}岁</p>
        </div>
        
        {/* 阶段提示 */}
        <p className="text-gray-400 mb-6">{phaseText}</p>
        
        {/* 进度条 */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${aiGenerationState.progress}%` }}
          />
        </div>
        
        {/* 进度百分比 */}
        <p className="text-sm text-gray-500">{aiGenerationState.progress}%</p>
        
        {/* 预估时间 */}
        {aiGenerationState.isGenerating && (
          <p className="text-xs text-gray-600 mt-2">
            预计剩余 {Math.max(0, Math.ceil((aiGenerationState.estimatedDuration - (Date.now() - aiGenerationState.startTime)) / 1000))} 秒
          </p>
        )}
      </div>
    </div>
  );
};

// 辅助函数：根据年龄获取年龄段名称
function getAgeStageName(age: number): string {
  if (age <= 5) return '婴幼儿';
  if (age <= 9) return '童年';
  if (age <= 13) return '少年';
  if (age <= 17) return '青少年';
  if (age <= 21) return '大学';
  if (age <= 29) return '青年';
  if (age <= 39) return '壮年';
  if (age <= 49) return '中年';
  if (age <= 59) return '知天命';
  if (age <= 69) return '花甲';
  if (age <= 79) return '古稀';
  if (age <= 89) return '杖朝';
  if (age <= 99) return '期颐';
  if (age <= 110) return '长寿之星';
  return '传奇人生';
}
```

---

## 七、异常处理策略

### 7.1 生成超时处理

| 场景 | 处理方式 | 用户体验 |
|------|---------|---------|
| 生成时间 < 10秒 | 正常等待 | 显示进度 |
| 生成时间 10-30秒 | 继续等待 | 显示"即将完成" |
| 生成时间 > 30秒 | 使用默认内容 | 静默降级，无感知 |
| 生成失败 | 使用默认内容 | 静默降级，无感知 |

### 7.2 网络断开处理

```
网络断开检测
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 1. 暂停生成，保存当前进度                                  │
│ 2. 显示网络断开提示                                        │
│ 3. 自动重试（最多3次）                                     │
└────────┬─────────────────────────────────────────────────┘
         │
    ┌────┴────┐
    │         │
 重试成功   重试失败
    │         │
    ▼         ▼
 继续生成   使用默认内容
```

### 7.3 默认内容降级

```typescript
// 当AI生成失败时，使用预设的默认内容
function getDefaultEraContent(era: number): PreGeneratedContent {
  const baseAge = era * 10;
  const ageStage = getAgeStage(baseAge);
  
  return {
    era,
    events: getDefaultEventsForEra(era),      // 从现有事件池获取
    enemies: getDefaultEnemiesForEra(ageStage), // 从现有怪物池获取
    boss: createAnnualBoss(baseAge, 2024, 1.0), // 使用默认Boss生成
    shopCards: getDefaultShopCards(era),        // 从现有卡牌池获取
    isComplete: true,
    isDefault: true,  // 标记为默认内容
  };
}
```

---

## 八、性能优化建议

### 8.1 生成优先级

| 优先级 | 内容 | 原因 |
|--------|------|------|
| P0 | Boss内容 | 玩家最终必须面对 |
| P1 | 普通怪物 | 战斗是核心玩法 |
| P2 | 事件内容 | 丰富体验但可降级 |
| P3 | 商店内容 | 可延后生成 |

### 8.2 分步生成策略

```
阶段1（必须完成）：
  - Boss基础属性
  - 普通怪物基础属性
  
阶段2（优先完成）：
  - 事件标题和描述
  - 怪物描述文本
  
阶段3（可延后）：
  - 商店完整内容
  - 事件选项细节
```

### 8.3 缓存策略

```typescript
// 本地缓存已生成的内容
const GENERATION_CACHE_KEY = 'ai_generation_cache_v1';

interface GenerationCache {
  [era: number]: {
    content: PreGeneratedContent;
    timestamp: number;
    gameVersion: string;
  };
}

// 缓存有效期：7天
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
```

---

## 九、监控与调试

### 9.1 关键指标

| 指标 | 目标值 | 告警阈值 |
|------|-------|---------|
| 首次生成时间 | < 15秒 | > 30秒 |
| 后台生成时间 | < 10秒 | > 20秒 |
| 生成成功率 | > 95% | < 90% |
| 降级使用率 | < 5% | > 10% |

### 9.2 调试日志

```typescript
// 生成流程日志
interface GenerationLog {
  era: number;
  startTime: number;
  endTime: number;
  duration: number;
  phases: {
    name: string;
    duration: number;
    success: boolean;
  }[];
  contentStats: {
    eventsCount: number;
    enemiesCount: number;
    bossGenerated: boolean;
    shopCardsCount: number;
  };
  errors: string[];
}
```

---

## 十、实施计划

### 10.1 第一阶段：基础框架

| 任务 | 预计工时 | 产出 |
|------|---------|------|
| 添加状态字段 | 0.5天 | 状态定义完成 |
| 实现startBackgroundGeneration | 1天 | 后台生成可用 |
| 实现AIGenerationLoading组件 | 0.5天 | Loading页面完成 |
| 集成到enterOption | 0.5天 | Boss战触发生成 |

### 10.2 第二阶段：完善流程

| 任务 | 预计工时 | 产出 |
|------|---------|------|
| 实现生成等待逻辑 | 1天 | 等待Loading可用 |
| 实现超时降级 | 0.5天 | 异常处理完成 |
| 添加进度回调 | 0.5天 | 进度显示准确 |

### 10.3 第三阶段：优化体验

| 任务 | 预计工时 | 产出 |
|------|---------|------|
| 实现缓存机制 | 1天 | 重复游玩加速 |
| 添加监控日志 | 0.5天 | 可追踪生成状态 |
| 性能调优 | 1天 | 生成时间优化 |

---

## 十一、总结

### 核心设计原则

1. **预生成优先**：在Boss战期间后台生成，最大化利用玩家游戏时间
2. **优雅降级**：生成失败或超时时使用默认内容，不影响游戏进行
3. **进度可见**：显示生成进度和预估时间，减少等待焦虑
4. **状态可控**：完整的状态管理，支持暂停、重试、取消

### 用户体验目标

- 首次游戏：等待时间 < 15秒
- 后续时代：90%情况下无需等待（后台已完成）
- 最坏情况：等待时间 < 30秒
