# YourStory2 页面级自传创作智能体 - 架构设计文档

## 1. 现状分析

### 1.1 当前架构

```
┌─────────────────────────────────────────────────────┐
│                      App.tsx                         │
│  /  → Home  /dialogue → Dialogue  /autobiography     │
│           /settings → Settings                      │
├─────────────────────────────────────────────────────┤
│  MainLayout: Sidebar + Header + {children}          │
├─────────────────────────────────────────────────────┤
│  Dialogue 页面                                       │
│  - messages[] 本地 state，无持久化                     │
│  - AIService.generateResponse(content, history)      │
│  - 4个硬编码建议词                                     │
│  - 不读取 URL 参数，不知道"章节"概念                     │
├─────────────────────────────────────────────────────┤
│  Autobiography 页面                                  │
│  - 章节 CRUD（增删，编辑跳转到 /dialogue）              │
│  - localStorage 持久化                               │
│  - 与 Dialogue 页无数据联动                            │
├─────────────────────────────────────────────────────┤
│  AIService                                          │
│  - 单次请求，无流式                                    │
│  - 纯文本输入/输出                                     │
│  - /compact 上下文压缩                                │
│  - PromptComposer 组装 system + history + user       │
└─────────────────────────────────────────────────────┘
```

### 1.2 核心断裂点

| # | 断裂点 | 影响 |
|---|--------|------|
| 1 | Dialogue 不读 `?chapter=xxx` | 章节编辑跳转无效 |
| 2 | 对话内容不持久化 | 刷新即丢失所有对话 |
| 3 | 对话内容无法写入章节 | 聊了等于没聊 |
| 4 | AI 无结构化输出能力 | 无法提取段落/时间线 |
| 5 | 建议词是静态的 | 无法引导用户覆盖人生各阶段 |
| 6 | 无自传整体进度感知 | 对话与创作进度脱节 |

---

## 2. 目标架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  /  → Home    /dialogue/:chapterId? → DialogueAgent          │
│  /autobiography → Autobiography   /settings → Settings       │
├─────────────────────────────────────────────────────────────┤
│                      MainLayout                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  DialogueAgent 页面（改造后）                                  │
│  ┌──────────────────────┬──────────────────────────────┐     │
│  │   聊天面板（左侧）     │    侧边面板（右侧）            │     │
│  │                      │                              │     │
│  │  ┌────────────────┐  │  ┌────────────────────────┐  │     │
│  │  │ 消息列表        │  │  │ 章节大纲               │  │     │
│  │  │ MessageBubble   │  │  │ - 当前章节标题          │  │     │
│  │  └────────────────┘  │  │ - 已有章节列表          │  │     │
│  │                      │  │ - 创作进度条            │  │     │
│  │  ┌────────────────┐  │  ├────────────────────────┤  │     │
│  │  │ 智能建议区      │  │  │ 章节草稿预览           │  │     │
│  │  │ 动态引导问题     │  │  │ - AI 生成的段落        │  │     │
│  │  └────────────────┘  │  │ - 用户确认/编辑         │  │     │
│  │                      │  ├────────────────────────┤  │     │
│  │  ┌────────────────┐  │  │ 操作工具栏             │  │     │
│  │  │ 输入区          │  │  │ - 写入章节            │  │     │
│  │  └────────────────┘  │  │ - 生成摘要            │  │     │
│  │                      │  │ - 切换章节            │  │     │
│  └──────────────────────┴──────────────────────────────┘     │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  Stores (Zustand)                                            │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────┐       │
│  │ aiStore      │ │ dialogueStore│ │ autobiographyStore│      │
│  │ (API配置)    │ │ (对话状态)    │ │ (自传数据)        │      │
│  └─────────────┘ └──────────────┘ └─────────────────┘       │
├─────────────────────────────────────────────────────────────┤
│  Services                                                    │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────┐       │
│  │ AIService    │ │ DialogueStore│ │ StorageService   │      │
│  │ (AI调用)     │ │ (对话持久化)  │ │ (localStorage)  │      │
│  └─────────────┘ └──────────────┘ └─────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 设计原则

1. **渐进增强**：不破坏现有功能，在现有基础上扩展
2. **数据闭环**：对话 → 提取 → 章节内容，形成完整链路
3. **智能引导**：AI 根据已有内容主动引导，而非被动回答
4. **状态可恢复**：所有对话和草稿都持久化，刷新不丢失

---

## 3. 数据模型设计

### 3.1 扩展类型定义

```typescript
// ===== types/index.ts 扩展 =====

/** 对话消息 - 扩展原 Message */
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  /** 消息类型：普通对话 / 结构化内容提取 */
  type: 'text' | 'content_extract';
  /** 当 type='content_extract' 时，AI 提取的结构化内容 */
  extractedContent?: ExtractedContent;
}

/** AI 从对话中提取的结构化内容 */
interface ExtractedContent {
  /** 提取的段落（可直接写入章节） */
  paragraphs: string[];
  /** 时间标签（如 "1990年夏天"） */
  timeTag?: string;
  /** 情感标签（如 "温馨", "艰辛"） */
  emotionTags?: string[];
  /** 关键人物 */
  people?: string[];
  /** 用户确认状态 */
  status: 'pending' | 'approved' | 'edited' | 'rejected';
  /** 用户编辑后的内容（status='edited' 时有值） */
  editedContent?: string;
}

/** 章节 - 扩展 */
interface Chapter {
  id: string;
  title: string;
  content: string;           // 最终确认的章节内容
  draftContent: string;      // 对话产生的草稿内容（未确认）
  timeRange?: string;        // 时间范围，如 "1990-2000"
  status: 'empty' | 'draft' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

/** 自传 - 扩展 */
interface Autobiography {
  id: string;
  title: string;
  chapters: Chapter[];
  createdAt: Date;
  updatedAt: Date;
}

/** 对话会话 - 新增 */
interface DialogueSession {
  id: string;
  chapterId: string | null;   // 关联章节，null 表示自由对话
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

/** 智能建议 - 新增 */
interface Suggestion {
  id: string;
  text: string;
  type: 'guide_question' | 'chapter_topic' | 'follow_up' | 'summarize';
  /** 建议关联的章节（可选） */
  chapterId?: string;
}
```

### 3.2 localStorage 存储方案

```
Key                          Value
─────────────────────────────────────────────────
ai-settings                  AISettings (已有)
autobiography                Autobiography (已有，扩展字段)
dialogue-sessions            DialogueSession[] (新增)
dialogue-active-session-id   string (新增)
```

---

## 4. 状态管理设计

### 4.1 新增 dialogueStore

```typescript
// stores/dialogueStore.ts

interface DialogueState {
  // 当前活跃会话
  activeSession: DialogueSession | null;
  // 所有会话（按章节索引）
  sessions: Record<string, DialogueSession>;
  // 当前建议列表
  suggestions: Suggestion[];
  // 是否正在生成
  isGenerating: boolean;
  // 侧边面板当前显示的内容
  sidePanel: 'outline' | 'draft' | 'preview';

  // Actions
  initSession: (chapterId: string | null) => Promise<void>;
  loadSession: (chapterId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  updateSuggestions: () => Promise<void>;
  saveSession: () => Promise<void>;
  applyExtractedContent: (messageId: string, editedContent?: string) => void;
  writeDraftToChapter: (chapterId: string) => Promise<void>;
}
```

### 4.2 扩展 autobiographyStore

```typescript
// stores/autobiographyStore.ts（替代现有页面内 state）

interface AutobiographyState {
  autobiography: Autobiography | null;

  // Actions
  load: () => Promise<void>;
  createChapter: (title: string, timeRange?: string) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>;
  updateChapterContent: (chapterId: string, content: string) => Promise<void>;
  updateChapterDraft: (chapterId: string, draftContent: string) => Promise<void>;
  confirmChapterDraft: (chapterId: string) => Promise<void>;
  getCompletionStats: () => { total: number; completed: number; inProgress: number };
}
```

---

## 5. 组件拆分设计

### 5.1 DialogueAgent 页面组件树

```
DialogueAgent (pages/DialogueAgent/index.tsx)
├── DialogueHeader                    # 页面顶部：章节标题 + 面板切换
│   ├── ChapterTitle                  # 当前章节标题（可点击切换）
│   └── PanelToggle                   # 侧边面板开关
│
├── DialogueBody                      # 主体区域（左右分栏）
│   ├── ChatPanel                     # 左侧聊天面板
│   │   ├── ContextBanner             # 上下文提示条（当前编辑的章节）
│   │   ├── MessageList               # 消息列表
│   │   │   └── MessageBubble         # 复用现有组件
│   │   │       └── ContentExtractCard# 结构化内容提取卡片（新）
│   │   ├── SuggestionBar             # 智能建议条（动态）
│   │   └── ChatInput                 # 输入区域（复用现有样式）
│   │
│   └── SidePanel                     # 右侧面板
│       ├── OutlineView               # 大纲视图
│       │   ├── ChapterList           # 章节列表 + 进度
│       │   └── CompletionProgress    # 整体进度条
│       ├── DraftView                 # 草稿预览
│       │   ├── DraftContent          # 当前章节草稿
│       │   └── DraftActions          # 确认/编辑/丢弃
│       └── ChapterSwitcher           # 章节切换下拉
```

### 5.2 关键组件职责

| 组件 | 职责 | 文件路径 |
|------|------|----------|
| `DialogueAgent` | 页面容器，路由参数解析，会话初始化 | `pages/DialogueAgent/index.tsx` |
| `ChatPanel` | 聊天区域，消息收发 | `components/dialogue/ChatPanel.tsx` |
| `ContentExtractCard` | 展示 AI 提取的结构化内容，支持确认/编辑 | `components/dialogue/ContentExtractCard.tsx` |
| `SuggestionBar` | 动态建议词，根据进度和上下文生成 | `components/dialogue/SuggestionBar.tsx` |
| `SidePanel` | 侧边面板容器，支持大纲/草稿切换 | `components/dialogue/SidePanel.tsx` |
| `OutlineView` | 自传大纲，章节列表+进度 | `components/dialogue/OutlineView.tsx` |
| `DraftView` | 章节草稿预览和操作 | `components/dialogue/DraftView.tsx` |

### 5.3 文件结构

```
src/
├── pages/
│   ├── DialogueAgent/          # 新增：替换 Dialogue
│   │   └── index.tsx
│   └── index.ts                # 更新导出
├── components/
│   ├── dialogue/               # 新增目录
│   │   ├── ChatPanel.tsx
│   │   ├── ContentExtractCard.tsx
│   │   ├── SuggestionBar.tsx
│   │   ├── SidePanel.tsx
│   │   ├── OutlineView.tsx
│   │   ├── DraftView.tsx
│   │   └── index.ts
│   └── common/
│       └── MessageBubble.tsx   # 小幅扩展，支持 content_extract 类型
├── stores/
│   ├── dialogueStore.ts        # 新增
│   ├── autobiographyStore.ts   # 新增（从 Autobiography 页面提取）
│   └── index.ts                # 更新导出
├── ai_config/
│   └── prompts/
│       ├── system_prompt.md    # 重写
│       ├── content_extract.md  # 新增：内容提取 prompt
│       └── suggestion_gen.md   # 新增：建议词生成 prompt
├── services/
│   └── ai/
│       └── AIService.ts        # 扩展：支持结构化输出、流式响应
└── types/
    └── index.ts                # 扩展类型定义
```

---

## 6. AI 服务层设计

### 6.1 AIService 扩展

```typescript
// services/ai/AIService.ts 新增方法

class AIService {
  // 现有方法保持不变 ...

  /** 生成对话回复（扩展：感知章节上下文） */
  async generateResponse(
    userInput: string,
    conversationHistory: Message[],
    chapterContext?: ChapterContext,  // 新增
  ): Promise<string>;

  /** 从对话中提取结构化内容 */
  async extractContent(
    recentMessages: Message[],
    chapterTitle: string,
  ): Promise<ExtractedContent>;

  /** 生成智能建议 */
  async generateSuggestions(
    autobiography: Autobiography,
    currentChapterId: string | null,
    recentMessages: Message[],
  ): Promise<Suggestion[]>;

  /** 生成章节摘要 */
  async generateChapterSummary(
    chapterTitle: string,
    dialogueContent: string,
  ): Promise<string>;
}

interface ChapterContext {
  chapterId: string;
  chapterTitle: string;
  existingContent: string;
  timeRange?: string;
}
```

### 6.2 Prompt 设计

#### 6.2.1 主系统 Prompt（重写 system_prompt.md）

```
你是一位专业的自传创作助手。你的任务是通过对话引导用户回忆和记录他们的人生故事。

## 当前上下文
{如有章节信息则注入章节标题、已有内容、时间范围}

## 核心原则
1. 友好耐心：温暖鼓励，让用户感到安全
2. 开放式引导：用开放式问题引导回忆
3. 时间线梳理：帮助整理人生脉络
4. 细节鼓励：鼓励分享场景、气味、对话、情绪
5. 适时总结：在关键节点提供阶段性总结
6. 隐私保护：尊重用户边界

## 内容提取规则
在对话过程中，当用户分享了一段完整的人生故事后：
- 如果内容足够丰富（包含具体事件、时间、人物、感受），在回复末尾附带一个内容提取标记
- 格式：[EXTRACT]{"paragraphs":["..."],"timeTag":"...","emotionTags":["..."],"people":["..."]}[END_EXTRACT]
- 这些提取的内容将用于生成自传章节草稿

## 对话策略
- 开始阶段：询问基本信息和想从哪个时期开始
- 回忆阶段：用具体问题引导（"那天的天气如何？""你当时穿的什么？"）
- 深入阶段：追问情感和感受
- 转折阶段：识别人生重大转折点并深入探讨
- 收尾阶段：帮助做阶段性总结

## 输出要求
- 回复自然流畅，像朋友间的对话
- 每次回复聚焦1-2个话题
- 对用户的分享给予真诚回应
```

#### 6.2.2 内容提取 Prompt（content_extract.md）

```
你是自传内容提取专家。请从以下对话中提取可用于自传写作的结构化内容。

## 输入
最近的对话记录和当前章节信息。

## 输出要求
提取以下内容（JSON格式）：
- paragraphs: 从用户描述中提取的完整段落（改写为自传体第三人称或第一人称叙述）
- timeTag: 时间标签
- emotionTags: 情感标签（2-4个）
- people: 提到的关键人物

## 改写规则
1. 保持用户原始描述的核心事实和情感
2. 将口语化表达改为书面化叙述
3. 补充合理的细节使段落更丰满
4. 保持第一人称视角
5. 每个段落应有完整的叙事弧（起因-经过-感受）
```

#### 6.2.3 建议词生成 Prompt（suggestion_gen.md）

```
你是一位自传创作引导专家。根据用户的自传当前状态，生成引导性问题和建议。

## 输入
- 自传已有章节和完成度
- 当前正在创作的章节
- 最近的对话内容

## 输出
生成4个建议（JSON数组），类型包括：
- guide_question: 引导用户回忆新的话题
- chapter_topic: 建议新的章节主题
- follow_up: 对最近对话的深入追问
- summarize: 建议对当前内容进行总结

## 原则
1. 避免重复已讨论过的话题
2. 覆盖人生重要维度（家庭、教育、事业、感情、转折点、成就）
3. 问题要具体，避免笼统
4. 根据用户表达的情感状态调整问题的敏感度
```

### 6.3 流式响应支持（可选增强）

```typescript
// AIService 新增流式方法
async generateResponseStream(
  userInput: string,
  conversationHistory: Message[],
  chapterContext?: ChapterContext,
  onChunk: (chunk: string) => void,
): Promise<string>;
```

流式响应可以显著提升用户体验（用户能实时看到 AI 正在输入），但需要前端支持 SSE/ReadableStream 处理。建议作为第二阶段优化。

---

## 7. 页面交互流程

### 7.1 用户旅程

```
场景 A：从自传页面进入某章节的对话
─────────────────────────────────────
1. 用户在 /autobiography 点击某章节的"编辑"按钮
2. 跳转到 /dialogue/chapter-abc
3. DialogueAgent 读取 chapterId，加载对应 DialogueSession
4. 页面显示：
   - 左侧：该章节的对话历史（如有）
   - 右侧：该章节的草稿内容（如有）
   - 底部建议词：基于该章节已聊内容动态生成
5. 用户继续对话，AI 感知"当前正在创作第X章"
6. 用户分享新内容 → AI 提取结构化内容 → 右侧草稿更新
7. 用户点击"确认写入" → 草稿合并到章节正式内容

场景 B：自由对话（无指定章节）
─────────────────────────────────────
1. 用户点击侧边栏"对话创作"
2. 跳转到 /dialogue（无 chapterId）
3. DialogueAgent 创建自由对话会话
4. 页面显示：
   - 左侧：通用引导对话
   - 右侧：自传大纲 + 各章节进度
   - 底部建议词：基于自传整体进度生成（如"聊聊童年""记录一段旅行"）
5. 当 AI 引导到某个具体话题时，可以建议"我们要不要创建一个新章节来记录这个？"
6. 用户同意 → 创建新章节 → 自动切换到该章节的对话上下文
```

### 7.2 内容提取→确认流程

```
用户分享故事
    │
    ▼
AI 回复 + [EXTRACT] 标记
    │
    ▼
前端解析 EXTRACT，渲染 ContentExtractCard
    │
    ▼
用户看到提取的段落预览
    │
    ├─ 点击"确认" → 写入 draftContent → 右侧草稿更新
    ├─ 点击"编辑" → 进入编辑模式 → 修改后确认
    └─ 点击"丢弃" → 丢弃提取内容
```

### 7.3 建议词生成时机

| 时机 | 建议类型 | 说明 |
|------|---------|------|
| 对话开始（<=1条消息） | chapter_topic + guide_question | 引导用户选择创作方向 |
| AI 回复后（每3轮对话） | follow_up + guide_question | 深入当前话题 + 引入新话题 |
| 用户分享了一段故事后 | follow_up + summarize | 追问细节 or 建议总结 |
| 章节对话即将结束时 | summarize + chapter_topic | 总结当前 + 建议下一章 |

---

## 8. 侧边面板设计

### 8.1 大纲视图（OutlineView）

```
┌─────────────────────────┐
│  📖 我的自传              │
│  ━━━━━━━━━━━━━━━━━━━━━━ │
│  进度 ████████░░ 3/5 章   │
│                          │
│  ✅ 第1章: 童年时光        │  ← 已完成
│  ✅ 第2章: 求学岁月        │  ← 已完成
│  🔵 第3章: 初入职场        │  ← 进行中（当前）
│  ⬜ 第4章: 创业故事        │  ← 未开始
│  ⬜ 第5章: 人生感悟        │  ← 未开始
│                          │
│  [+ 添加新章节]            │
└─────────────────────────┘
```

### 8.2 草稿视图（DraftView）

```
┌─────────────────────────┐
│  📝 第3章草稿             │
│  ━━━━━━━━━━━━━━━━━━━━━━ │
│                          │
│  [AI提取的段落预览...]     │
│                          │
│  ┌───────────────────┐  │
│  │ 2005年夏天，我从    │  │
│  │ 大学毕业，带着对     │  │
│  │ 未来的憧憬来到了     │  │
│  │ 北京...            │  │
│  └───────────────────┘  │
│                          │
│  来源：对话 #3-#5        │
│                          │
│  [确认写入] [编辑] [丢弃]  │
└─────────────────────────┘
```

---

## 9. 实现阶段规划

### Phase 1：基础连通（核心 MVP）

**目标**：对话与章节关联，内容可落盘

1. **扩展 types/index.ts** — 新增 DialogueSession、ExtractedContent、Suggestion 等类型
2. **新增 dialogueStore.ts** — 对话状态管理 + 持久化
3. **新增 autobiographyStore.ts** — 从 Autobiography 页面提取状态逻辑
4. **改造 Dialogue 页面** — 读取路由参数，加载/创建会话
5. **扩展 AIService** — `generateResponse` 感知章节上下文
6. **重写 system_prompt.md** — 注入章节上下文
7. **新增 ContentExtractCard** — 展示 AI 提取的结构化内容
8. **新增 DraftView** — 右侧草稿预览 + 写入操作
9. **新增 SidePanel** — 右侧面板容器

### Phase 2：智能引导

**目标**：AI 主动引导用户创作

1. **新增 suggestion_gen.md** — 建议词生成 prompt
2. **AIService.generateSuggestions** — 调用 AI 生成建议
3. **新增 SuggestionBar** — 动态建议条组件
4. **新增 OutlineView** — 大纲视图 + 进度
5. **改造路由** — `/dialogue/:chapterId?`

### Phase 3：体验优化

**目标**：打磨细节体验

1. **流式响应** — 实时显示 AI 输出
2. **对话搜索** — 搜索历史对话内容
3. **多轮提取合并** — 将多次提取的内容智能合并
4. **导出功能** — 将完成的自传导出为 Markdown/PDF
5. **Markdown 渲染** — AI 回复中的格式化内容正确渲染

---

## 10. 关键实现细节

### 10.1 路由改造

```typescript
// App.tsx
<Route path="/dialogue/:chapterId?" element={<DialogueAgent />} />
```

### 10.2 EXTRACT 标记解析

```typescript
// utils/parseExtract.ts
function parseExtract(response: string): {
  text: string;
  extract: ExtractedContent | null;
} {
  const regex = /\[EXTRACT\](.*?)\[END_EXTRACT\]/s;
  const match = response.match(regex);
  if (!match) return { text: response, extract: null };

  const text = response.replace(regex, '').trim();
  try {
    const extract = JSON.parse(match[1]);
    return { text, extract };
  } catch {
    return { text: response, extract: null };
  }
}
```

### 10.3 会话持久化策略

- **实时保存**：每条新消息后立即保存到 localStorage
- **延迟写入**：高频操作（如打字中的草稿编辑）使用 debounce
- **存储容量**：localStorage 约 5MB 限制，需要监控容量，必要时压缩旧会话

### 10.4 Autobiography 页面解耦

将 [Autobiography 页面](file:///f:/self_work/yourStory2/YourStory2/src/pages/Autobiography/index.tsx) 中的状态管理逻辑提取到 `autobiographyStore`，使对话页面和自传页面共享同一份数据，避免数据不一致。

### 10.5 向后兼容

- 旧的 `/dialogue` 路由重定向到新的 `/dialogue`（无 chapterId，即自由对话模式）
- 现有的 `AIService.generateResponse` 签名通过可选参数扩展，不破坏现有调用
- 现有 `Message` 类型通过可选字段扩展（type、extractedContent）

---

## 11. 需要决策的问题

| # | 问题 | 选项 | 建议 |
|---|------|------|------|
| 1 | 是否保留旧 Dialogue 页面？ | A) 直接替换 B) 并存过渡 | A) 直接替换，减少维护成本 |
| 2 | 内容提取的触发方式？ | A) AI 自动提取 B) 用户手动触发 C) 两者都支持 | C) AI 自动提取 + 用户可手动触发 |
| 3 | 侧边面板默认展开/收起？ | A) 默认展开 B) 默认收起 | A) 默认展开，移动端收起 |
| 4 | 建议词生成频率？ | A) 每轮都生成 B) 每N轮生成 C) 本地规则 + AI 增强 | C) 本地规则生成基础建议，关键节点调用 AI |
| 5 | 对话历史是否也保存到章节？ | A) 只保存提取内容 B) 对话历史也保存 | B) 对话历史也保存，便于回顾创作过程 |

---

## 12. 技术风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| localStorage 容量不足 | 无法保存更多对话 | 监控容量，压缩旧会话，后续迁移至 Tauri 文件存储 |
| AI 不稳定提取 EXTRACT | 内容提取失败 | 多次重试 + 降级为纯文本模式 |
| 建议词生成延迟 | 建议条空白 | 本地规则优先生成，AI 异步补充 |
| 流式响应兼容性 | 部分 AI 供应商不支持 | 检测供应商能力，降级为普通请求 |
