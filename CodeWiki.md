# YourStory2 项目 Code Wiki

> **项目版本**: v0.1.0
> **最后更新**: 2026-07-19
> **项目类型**: 桌面端自传创作助手（Tauri + React + TypeScript）

---

## 目录

- [1. 项目概述](#1-项目概述)
- [2. 技术栈](#2-技术栈)
- [3. 项目架构](#3-项目架构)
- [4. 模块详解](#4-模块详解)
- [5. 数据模型](#5-数据模型)
- [6. 核心服务](#6-核心服务)
- [7. 状态管理](#7-状态管理)
- [8. 组件库](#8-组件库)
- [9. 路由系统](#9-路由系统)
- [10. 提示词工程](#10-提示词工程)
- [11. 依赖关系](#11-依赖关系)
- [12. 运行方式](#12-运行方式)
- [13. UI 实现状态分析](#13-ui-实现状态分析)
- [14. 未来开发计划](#14-未来开发计划)

---

## 1. 项目概述

YourStory2 是一款基于 Tauri 2 的桌面端自传创作助手，通过 AI 对话引导用户回忆和记录人生故事，结构化提取内容并生成自传章节草稿。

### 核心功能

| 功能模块 | 描述 | 实现状态 |
|---------|------|---------|
| 对话式创作 | AI引导对话，逐步构建自传 | ✅ 已实现 |
| 内容提取 | 从对话中自动提取结构化内容 | ✅ 已实现 |
| 章节管理 | 章节CRUD、进度跟踪 | ✅ 已实现 |
| 草稿管理 | AI生成内容预览、编辑、确认 | ✅ 已实现 |
| 多模型支持 | 支持10+ AI供应商 | ✅ 已实现 |
| 数据持久化 | localStorage本地存储 | ✅ 已实现 |
| 智能建议 | AI动态生成引导问题 | ✅ 已实现 |
| 自传预览 | 查看完整自传内容 | 🔶 UI占位 |

---

## 2. 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.1.0 | UI框架 |
| TypeScript | 5.8.3 | 类型安全 |
| Vite | 7.3.6 | 构建工具 |
| Tailwind CSS | 4.3.2 | 样式系统 |
| Zustand | 5.0.14 | 状态管理 |
| React Router | 7.18.1 | 路由管理 |
| @tailwindcss/vite | 4.3.2 | Tailwind Vite插件 |

### 后端（Tauri）

| 技术 | 版本 | 用途 |
|------|------|------|
| Tauri | 2.x | 跨平台桌面框架 |
| tauri-plugin-opener | 2.x | 文件打开插件 |

### 开发工具

| 工具 | 用途 |
|------|------|
| Yarn 4.9.2 | 包管理 |
| VS Code | IDE |
| rust-analyzer | Rust语言支持 |

---

## 3. 项目架构

### 3.1 目录结构

```
YourStory2/
├── src/                          # 前端源码
│   ├── ai_config/                # AI配置
│   │   ├── prompts/              # 提示词模板
│   │   ├── index.ts              # 导出入口
│   │   ├── promptComposer.ts     # 提示词组装器
│   │   └── vendors.ts            # 供应商配置
│   ├── assets/                   # 静态资源
│   ├── components/               # 组件库
│   │   ├── common/               # 通用组件
│   │   ├── dialogue/             # 对话相关组件
│   │   ├── home/                 # 首页组件
│   │   ├── layout/               # 布局组件
│   │   └── ui/                   # 基础UI组件
│   ├── hooks/                    # 自定义Hooks
│   ├── pages/                    # 页面组件
│   │   ├── Autobiography/        # 自传页面
│   │   ├── Dialogue/             # 对话页面（旧版）
│   │   ├── DialogueAgent/        # 对话Agent页面（新版）
│   │   ├── Home/                 # 首页
│   │   └── Settings/             # 设置页面
│   ├── services/                 # 服务层
│   │   ├── ai/                   # AI服务
│   │   └── storage/              # 存储服务
│   ├── store/                # Zustand状态 store
│   ├── types/                    # TypeScript类型定义
│   ├── utils/                    # 工具函数
│   ├── App.css                   # 全局样式
│   ├── App.tsx                   # 应用根组件
│   ├── main.tsx                  # 应用入口
│   └── vite-env.d.ts             # Vite环境类型
├── src-tauri/                    # Tauri后端
│   ├── capabilities/             # 权限配置
│   ├── icons/                    # 应用图标
│   ├── src/                      # Rust源码
│   │   ├── lib.rs                # 库入口
│   │   └── main.rs               # 主入口
│   ├── build.rs                  # 构建脚本
│   ├── Cargo.toml                # Rust依赖
│   └── tauri.conf.json           # Tauri配置
├── docs/                         # 文档
│   ├── autobiography-agent-design.md  # 架构设计文档
│   └── design-system-specification.md # 设计系统规范
├── public/                       # 公共资源
├── index.html                    # HTML入口
├── package.json                  # 项目依赖
├── tsconfig.json                 # TypeScript配置
├── vite.config.ts                # Vite配置
└── yarn.lock                     # 依赖锁文件
```

### 3.2 架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           应用层 (React)                              │
│  ┌─────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │  Home   │ │DialogueAgent│ │Autobiography│ │    Settings     │   │
│  └────┬────┘ └──────┬──────┘ └──────┬──────┘ └────────┬────────┘   │
│       │             │               │                 │             │
│  ┌────┴─────────────┴───────────────┴─────────────────┴────────┐   │
│  │                    Components Layer                          │   │
│  │  layout/  common/  dialogue/  home/  ui/                    │   │
│  └─────────────────────────────┬───────────────────────────────┘   │
│                                │                                    │
│  ┌─────────────────────────────┴───────────────────────────────┐   │
│  │                    State Layer (Zustand)                    │   │
│  │  aiStore / dialogueStore / autobiographyStore / settingsStore│   │
│  └─────────────────────────────┬───────────────────────────────┘   │
│                                │                                    │
│  ┌─────────────────────────────┴───────────────────────────────┐   │
│  │                    Service Layer                            │   │
│  │  AIService              StorageService                     │   │
│  └─────────────────────────────┬───────────────────────────────┘   │
│                                │                                    │
│  ┌─────────────────────────────┴───────────────────────────────┐   │
│  │                    Config Layer                             │   │
│  │  PromptComposer         Vendors (AI供应商)                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────┴───────────────────────────────────┐
│                        Tauri Backend (Rust)                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  greet command / plugin-opener                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. 模块详解

### 4.1 页面模块 (pages/)

#### Home/index.tsx
- **职责**: 首页展示，章节概览，创作引导
- **路由**: `/`
- **实现状态**: 🔶 UI静态占位（数据为硬编码）

| 功能 | 状态 | 说明 |
|------|------|------|
| 章节列表展示 | 🔶 UI占位 | 硬编码示例数据 |
| 进度统计 | 🔶 UI占位 | 静态数据 |
| 创作步骤引导 | 🔶 UI占位 | 静态展示 |
| 概览/创作/统计Tab | 🔶 UI占位 | 统计Tab未实现 |

#### DialogueAgent/index.tsx
- **职责**: 核心对话创作功能，AI引导对话、内容提取、章节关联
- **路由**: `/dialogue` 或 `/dialogue/:chapterId`
- **实现状态**: ✅ 核心功能已实现

| 功能 | 状态 | 说明 |
|------|------|------|
| AI对话交互 | ✅ 已实现 | 支持上下文感知 |
| 章节关联对话 | ✅ 已实现 | 通过URL参数 |
| 内容提取展示 | ✅ 已实现 | ContentExtractCard组件 |
| 智能建议 | ✅ 已实现 | AI动态生成 |
| 欢迎引导 | ✅ 已实现 | AI生成个性化引导 |
| 章节切换 | ✅ 已实现 | 左侧OutlineView |
| 草稿确认写入 | ✅ 已实现 | 写入autobiographyStore |
| 章节选择弹窗 | ✅ 已实现 | 自由对话时提取内容可写入任意章节 |

#### Dialogue/index.tsx
- **职责**: 旧版对话页面（保留但不再使用）
- **路由**: 无（已被DialogueAgent替代）
- **实现状态**: 🔴 废弃

#### Autobiography/index.tsx
- **职责**: 自传章节管理和预览
- **路由**: `/autobiography`
- **实现状态**: 🔶 UI静态占位

| 功能 | 状态 | 说明 |
|------|------|------|
| 章节列表展示 | 🔶 UI占位 | 硬编码示例数据 |
| 搜索过滤 | 🔶 UI占位 | 前端过滤已实现 |
| 进度统计 | 🔶 UI占位 | 静态数据 |
| 导出功能 | 🔴 未实现 | 仅按钮占位 |
| 预览全文 | 🔴 未实现 | 仅按钮占位 |

#### Settings/index.tsx
- **职责**: AI模型配置，应用设置
- **路由**: `/settings`
- **实现状态**: 🔶 UI静态占位

| 功能 | 状态 | 说明 |
|------|------|------|
| 模型选择 | 🔶 UI占位 | 静态选项 |
| API Key配置 | 🔶 UI占位 | 输入框占位 |
| 温度参数 | 🔶 UI占位 | 滑动条占位 |
| 自动保存开关 | 🔶 UI占位 | 开关占位 |
| 深色模式 | 🔶 UI占位 | 开关占位 |
| 数据导出/清除 | 🔴 未实现 | 仅按钮占位 |

### 4.2 组件模块 (components/)

#### 布局组件 (layout/)

| 组件 | 文件 | 职责 |
|------|------|------|
| AppLayout | `AppLayout.tsx` | 主布局：侧边栏 + 内容区 |
| Header | `Header.tsx` | 顶部导航栏 |
| HomeLayout | `HomeLayout.tsx` | 首页布局（带右侧面板） |
| MainLayout | `MainLayout.tsx` | 通用主布局 |
| Sidebar | `Sidebar.tsx` | 侧边导航栏 |

#### 对话组件 (dialogue/)

| 组件 | 文件 | 职责 |
|------|------|------|
| SidePanel | `SidePanel.tsx` | 右侧面板容器，支持大纲/草稿切换 |
| OutlineView | `OutlineView.tsx` | 大纲视图：章节列表+进度 |
| DraftView | `DraftView.tsx` | 草稿预览：当前章节草稿内容 |
| ContentExtractCard | `ContentExtractCard.tsx` | 内容提取卡片：展示AI提取的结构化内容 |
| SuggestionBar | `SuggestionBar.tsx` | 智能建议条：动态引导问题 |

#### 通用组件 (common/)

| 组件 | 文件 | 职责 |
|------|------|------|
| MessageBubble | `MessageBubble.tsx` | 消息气泡：用户/AI消息展示 |
| LoadingDots | `LoadingDots.tsx` | 加载动画点 |
| LoadingSpinner | `LoadingSpinner.tsx` | 加载旋转器 |
| Toast | `Toast.tsx` | 全局提示通知 |

#### UI基础组件 (ui/)

| 组件 | 文件 | 职责 |
|------|------|------|
| Button | `Button.tsx` | 按钮组件 |
| Input | `Input.tsx` | 输入框组件 |
| Card | `Card.tsx` | 卡片容器 |
| Modal | `Modal.tsx` | 模态弹窗 |
| ConfirmDialog | `ConfirmDialog.tsx` | 确认对话框 |
| EmptyState | `EmptyState.tsx` | 空状态占位 |
| ErrorState | `ErrorState.tsx` | 错误状态展示 |

### 4.3 服务模块 (services/)

#### AIService (services/ai/AIService.tsx)
- **职责**: AI接口调用，支持多供应商
- **核心方法**:

```typescript
class AIService {
  // 生成对话回复（支持章节上下文）
  generateResponse(
    userInput: string,
    conversationHistory: Message[],
    chapterContext?: ChapterContext
  ): Promise<string>

  // 从对话中提取结构化内容
  extractContent(
    recentMessages: Message[],
    chapterTitle: string
  ): Promise<ExtractedContent | null>

  // 生成智能建议
  generateSuggestions(
    autobiography: Autobiography | null,
    currentChapterId: string | null,
    recentMessages: Message[]
  ): Promise<Suggestion[]>

  // 生成章节摘要
  generateChapterSummary(
    chapterTitle: string,
    dialogueContent: string
  ): Promise<string>

  // 生成欢迎引导
  generateWelcomeGuide(
    autobiography: Autobiography | null,
    chapterId: string | null
  ): Promise<{welcome, guide, starters, tips} | null>
}
```

#### StorageService (services/storage/StorageService.tsx)
- **职责**: localStorage 数据持久化
- **设计模式**: 单例模式
- **核心方法**:

```typescript
class StorageService {
  static getInstance(): StorageService
  saveData(key: string, data: any): Promise<void>
  loadData<T>(key: string): Promise<T | null>
  removeData(key: string): Promise<void>
  clearAll(): Promise<void>
}
```

### 4.4 AI配置模块 (ai_config/)

#### PromptComposer (promptComposer.ts)
- **职责**: 提示词组装和解析
- **核心方法**:

```typescript
const PromptComposer = {
  getSystemPrompt(): string              // 获取主系统提示词
  buildMessages(...)                     // 构建对话消息数组
  buildExtractMessages(...)              // 构建内容提取消息
  buildSuggestionMessages(...)           // 构建建议生成消息
  buildWelcomeGuideMessages(...)         // 构建欢迎引导消息
  parseCompactCommand(input: string): string | null  // 解析压缩指令
}
```

#### Vendors (vendors.ts)
- **职责**: AI供应商配置管理
- **支持的供应商**:

| 供应商 | ID | 默认模型 | 最大输出Token |
|--------|-----|---------|--------------|
| OpenAI | `openai` | gpt-4o-mini | 16384 |
| Anthropic | `anthropic` | claude-sonnet-4-20250514 | 8192 |
| DeepSeek | `deepseek` | deepseek-chat | 8192 |
| MiniMax | `minimax` | MiniMax-Text-01 | 40000 |
| MiMo | `mimo` | MiMo-VL-7B-RL | 8192 |
| 通义千问 | `qwen` | qwen-max | 8192 |
| 智谱GLM | `zhipu` | glm-4-plus | 4096 |
| Kimi | `kimi` | moonshot-v1-32k | 8192 |
| 豆包 | `doubao` | doubao-pro-32k | 4096 |
| SiliconFlow | `siliconflow` | Qwen/Qwen2.5-72B-Instruct | 8192 |
| 自定义 | `custom` | - | 4096 |

---

## 5. 数据模型

### 5.1 核心类型定义

```typescript
// ===== types/index.ts =====

/** 对话消息 */
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'content_extract';
  extractedContent?: ExtractedContent;
}

/** 提取的结构化内容 */
interface ExtractedContent {
  paragraphs: string[];
  timeTag?: string;
  emotionTags?: string[];
  people?: string[];
  status: 'pending' | 'approved' | 'edited' | 'rejected';
  editedContent?: string;
}

/** 自传章节 */
interface Chapter {
  id: string;
  title: string;
  content: string;           // 最终确认内容
  draftContent?: string;     // 草稿内容
  timeRange?: string;        // 时间范围
  status?: 'empty' | 'draft' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

/** 自传 */
interface Autobiography {
  id: string;
  title: string;
  chapters: Chapter[];
  createdAt: Date;
  updatedAt: Date;
}

/** AI配置 */
interface AISettings {
  apiKey: string;
  model: string;
  baseUrl: string;
  vendor: string;
  temperature: number;
  maxInputTokens: number;
  maxOutputTokens: number;
}

/** 对话会话 */
interface DialogueSession {
  id: string;
  chapterId: string | null;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

/** 智能建议 */
interface Suggestion {
  id: string;
  text: string;
  type: 'guide_question' | 'chapter_topic' | 'follow_up' | 'summarize';
  chapterId?: string;
}

/** 章节上下文（传给AI） */
interface ChapterContext {
  chapterId: string;
  chapterTitle: string;
  existingContent: string;
  timeRange?: string;
}
```

### 5.2 数据流

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  DialogueAgent │────▶│ dialogueStore│────▶│ localStorage│
│   (页面)      │     │  (状态管理)   │     │  (持久化)   │
└──────┬──────┘     └─────────────┘     └─────────────┘
       │
       │ 写入草稿
       ▼
┌─────────────┐     ┌─────────────┐
│autobiographyStore│──▶│ localStorage│
│  (自传数据)    │     │            │
└─────────────┘     └─────────────┘
```

### 5.3 localStorage 存储键

| 键名 | 数据类型 | 说明 |
|------|---------|------|
| `ai-settings` | AISettings | AI模型和API配置 |
| `autobiography` | Autobiography | 自传数据（含章节） |
| `dialogue-sessions` | Record<string, DialogueSession> | 对话会话（按章节索引） |
| `app-settings` | AppSettings | 应用设置 |

---

## 6. 核心服务

### 6.1 AI服务调用流程

```
用户输入
    │
    ▼
┌──────────────────────────────────────┐
│  DialogueAgent.handleSendMessage()   │
│  1. 添加用户消息到 dialogueStore      │
│  2. 构建 ChapterContext（如有章节）    │
│  3. 调用 AIService.generateResponse() │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  AIService.generateResponse()        │
│  1. 检测 /compact 压缩指令            │
│  2. 通过 PromptComposer 组装消息      │
│  3. 发送 HTTP 请求到 AI API           │
│  4. 返回 AI 回复文本                  │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  DialogueAgent 处理回复              │
│  1. parseExtract() 解析 EXTRACT 标记 │
│  2. 构建 Message 对象                │
│  3. 添加到 dialogueStore             │
│  4. 异步生成智能建议                  │
└──────────────────────────────────────┘
```

### 6.2 内容提取流程

```
AI回复包含 [EXTRACT]...[END_EXTRACT]
               │
               ▼
┌──────────────────────────────────────┐
│  parseExtract(response)              │
│  1. 正则匹配 EXTRACT 标记            │
│  2. 解析 JSON 内容                   │
│  3. 返回 { text, extract }           │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  渲染 ContentExtractCard              │
│  - 展示段落内容                      │
│  - 显示时间/情感/人物标签             │
│  - 提供确认/编辑/丢弃操作             │
└──────────────────────────────────────┘
```

---

## 7. 状态管理

### 7.1 Store 架构

```typescript
// stores/index.ts
export {
  useAIStore,                // AI配置状态
  useDialogueStore,          // 对话状态
  useAutobiographyStore,     // 自传数据状态
  useSettingsStore           // 应用设置状态
}
```

### 7.2 aiStore

```typescript
interface AIState extends AISettings {
  // Actions
  setApiKey: (apiKey: string) => void;
  setModel: (model: string) => void;
  setBaseUrl: (baseUrl: string) => void;
  setVendor: (vendor: string) => void;  // 自动更新baseUrl和model
  setTemperature: (temperature: number) => void;
  setMaxInputTokens: (maxInputTokens: number) => void;
  setMaxOutputTokens: (maxOutputTokens: number) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}
```

### 7.3 dialogueStore

```typescript
interface DialogueState {
  // State
  activeSession: DialogueSession | null;
  sessions: Record<string, DialogueSession>;
  suggestions: Suggestion[];
  isGenerating: boolean;
  sidePanel: 'outline' | 'draft';
  sidePanelOpen: boolean;

  // Actions
  initSession: (chapterId: string | null) => Promise<void>;
  addMessage: (message: Message) => void;
  setSuggestions: (suggestions: Suggestion[]) => void;
  setIsGenerating: (val: boolean) => void;
  setSidePanel: (panel: 'outline' | 'draft') => void;
  toggleSidePanel: () => void;
  updateExtractStatus: (messageId: string, status: 'approved' | 'edited' | 'rejected', editedContent?: string) => void;
  saveSession: () => Promise<void>;
}
```

### 7.4 autobiographyStore

```typescript
interface AutobiographyState {
  autobiography: Autobiography | null;

  // Actions
  load: () => Promise<void>;
  create: () => Promise<void>;
  createChapter: (title: string, timeRange?: string) => Promise<string>;
  deleteChapter: (chapterId: string) => Promise<void>;
  updateChapterContent: (chapterId: string, content: string) => Promise<void>;
  updateChapterDraft: (chapterId: string, draftContent: string) => Promise<void>;
  confirmChapterDraft: (chapterId: string) => Promise<void>;
  getCompletionStats: () => { total: number; completed: number; inProgress: number; draft: number };
}
```

### 7.5 settingsStore

```typescript
interface SettingsState {
  autoSave: boolean;
  darkMode: boolean;
  notifications: boolean;

  // Actions
  setAutoSave: (val: boolean) => void;
  setDarkMode: (val: boolean) => void;
  setNotifications: (val: boolean) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}
```

---

## 8. 组件库

### 8.1 组件层级

```
App
└── Router
    └── Routes
        └── Route (AppLayout)
            ├── Sidebar
            │   ├── Logo
            │   ├── NavLinks
            │   └── BottomContent (动态)
            └── Outlet (Page Content)
                ├── Home
                │   ├── ChapterList
                │   ├── StepCards
                │   └── RightPanel
                ├── DialogueAgent
                │   ├── ChatPanel
                │   │   ├── ContextBanner
                │   │   ├── MessageList
                │   │   ├── SuggestionBar
                │   │   └── ChatInput
                │   └── SidePanel
                │       ├── OutlineView
                │       └── DraftView
                ├── Autobiography
                │   ├── Stats
                │   ├── ChapterGroups
                │   └── SearchBar
                └── Settings
                    ├── AIConfig
                    ├── WritingPreferences
                    └── DataPrivacy
```

### 8.2 可复用组件

#### Button
```typescript
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  className?: string;
}
```

#### Modal
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}
```

#### MessageBubble
```typescript
interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  className?: string;
}
```

---

## 9. 路由系统

### 9.1 路由配置

```typescript
// App.tsx
<Router>
  <ToastProvider>
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/dialogue" element={<DialogueAgent />} />
        <Route path="/dialogue/:chapterId" element={<DialogueAgent />} />
        <Route path="/autobiography" element={<Autobiography />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  </ToastProvider>
</Router>
```

### 9.2 路由说明

| 路径 | 组件 | 职责 |
|------|------|------|
| `/` | Home | 首页概览 |
| `/dialogue` | DialogueAgent | 自由对话（无章节） |
| `/dialogue/:chapterId` | DialogueAgent | 章节关联对话 |
| `/autobiography` | Autobiography | 自传管理 |
| `/settings` | Settings | 应用设置 |

---

## 10. 提示词工程

### 10.1 提示词模板

| 文件 | 用途 | 触发时机 |
|------|------|---------|
| `system_prompt.md` | 主系统提示词 | 每次对话 |
| `content_extract.md` | 内容提取专用 | 提取结构化内容 |
| `suggestion_gen.md` | 建议词生成 | 每3轮对话或有提取时 |
| `welcome_guide.md` | 欢迎引导 | 首次进入对话 |
| `context_compact.md` | 上下文压缩 | 用户输入 /compact |
| `json_output_rules.md` | JSON输出规范 | 结构化输出时前置 |

### 10.2 EXTRACT 标记格式

```
[EXTRACT]{
  "paragraphs": ["改写后的自传体段落"],
  "timeTag": "时间标签",
  "emotionTags": ["情感标签1", "情感标签2"],
  "people": ["人物1", "人物2"]
}[END_EXTRACT]
```

---

## 11. 依赖关系

### 11.1 前端依赖

```json
{
  "dependencies": {
    "@tauri-apps/api": "^2",          // Tauri API
    "@tauri-apps/plugin-opener": "^2", // 文件打开插件
    "react": "^19.1.0",               // React框架
    "react-dom": "^19.1.0",           // React DOM
    "react-router-dom": "^7.18.1",    // 路由
    "zustand": "^5.0.14"              // 状态管理
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.2",    // Tailwind Vite插件
    "@tauri-apps/cli": "^2",          // Tauri CLI
    "@types/react": "^19.1.8",         // React类型
    "@types/react-dom": "^19.1.6",     // React DOM类型
    "@vitejs/plugin-react": "^4.6.0", // React插件
    "tailwindcss": "^4.3.2",           // Tailwind CSS
    "typescript": "~5.8.3",           // TypeScript
    "vite": "^7.0.4"                  // Vite构建工具
  }
}
```

### 11.2 后端依赖

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[build-dependencies]
tauri-build = { version = "2", features = [] }
```

---

## 12. 运行方式

### 12.1 开发环境

```bash
# 安装依赖
yarn install

# 启动开发服务器（Tauri + Vite）
yarn tauri dev

# 仅启动前端开发服务器
yarn dev
```

### 12.2 构建

```bash
# 构建生产版本
yarn tauri build

# 仅构建前端
yarn build

# 预览构建结果
yarn preview
```

### 12.3 开发工具配置

- **IDE**: VS Code
- **推荐插件**:
  - Tauri (tauri-apps.tauri-vscode)
  - rust-analyzer (rust-lang.rust-analyzer)

### 12.4 环境要求

| 工具 | 版本要求 |
|------|---------|
| Node.js | >= 18 |
| Rust | 最新稳定版 |
| yarn | 4.9.2+ |

---

## 13. UI 实现状态分析

### 13.1 已实现功能 (✅)

| 功能模块 | 实现文件 | 说明 |
|---------|---------|------|
| AI对话交互 | DialogueAgent/index.tsx | 完整实现，支持上下文感知 |
| 内容提取展示 | ContentExtractCard.tsx | 结构化内容展示与操作 |
| 智能建议生成 | AIService.generateSuggestions | AI动态生成引导问题 |
| 章节关联对话 | dialogueStore | URL参数驱动，按章节存储 |
| 草稿管理 | autobiographyStore | 草稿创建、编辑、确认 |
| 多供应商支持 | vendors.ts | 10+ AI供应商配置 |
| 数据持久化 | StorageService | localStorage存储 |
| 欢迎引导 | AIService.generateWelcomeGuide | AI个性化引导 |
| 响应式布局 | layout组件 | 完整的布局系统 |

### 13.2 UI静态占位 (🔶)

这些模块仅实现了UI外观，数据为硬编码或功能未完整连接：

| 页面/组件 | 问题描述 | 优先级 |
|----------|---------|--------|
| Home/index.tsx | 章节列表为硬编码示例数据，未连接autobiographyStore | 高 |
| Home/index.tsx | 进度统计数据为静态值 | 高 |
| Home/index.tsx | 统计Tab未实现 | 中 |
| Autobiography/index.tsx | 章节列表为硬编码示例数据 | 高 |
| Autobiography/index.tsx | 进度统计为静态值 | 高 |
| Autobiography/index.tsx | 搜索过滤未连接实际数据 | 中 |
| Settings/index.tsx | 模型选择未连接aiStore | 高 |
| Settings/index.tsx | API Key配置未连接aiStore | 高 |
| Settings/index.tsx | 所有设置项未持久化 | 高 |
| RightPanel | 今日数据为硬编码 | 中 |
| RightPanel | 最近活动为硬编码 | 中 |
| RightPanel | 快捷操作未实现 | 中 |
| Sidebar | 当前章节硬编码为"童年趣事" | 中 |
| Sidebar | 进度数据为静态值 | 中 |

### 13.3 未实现功能 (🔴)

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 导出功能 | 自传导出为Markdown/PDF | 中 |
| 对话搜索 | 搜索历史对话内容 | 低 |
| 流式响应 | 实时显示AI输出 | 中 |
| Markdown渲染 | AI回复格式化渲染 | 低 |
| 浅色/深色主题切换 | settingsStore已有状态 | 中 |
| 多轮提取合并 | 智能合并多次提取内容 | 低 |
| 自动保存 | settingsStore已有状态 | 中 |
| 消息通知 | settingsStore已有状态 | 低 |
| 数据迁移 | localStorage → Tauri文件存储 | 低 |

---

## 14. 未来开发计划

### Phase 1: 数据连通（高优先级）

**目标**: 将UI占位组件连接到实际数据源

#### 1.1 首页数据连通

- [x] 连接 `autobiographyStore` 获取真实章节数据
- [x] 实现动态进度统计
- [x] 添加章节卡片点击跳转功能
- [x] 实现"添加新章节"按钮功能

**涉及文件**:
- `src/pages/Home/index.tsx`
- `src/components/home/RightPanel.tsx`

#### 1.2 自传页面数据连通

- [x] 连接 `autobiographyStore` 获取真实章节数据
- [x] 实现搜索过滤功能（连接真实数据源）
- [x] 实现展开/折叠状态持久化
- [x] 添加章节编辑跳转功能

**涉及文件**:
- `src/pages/Autobiography/index.tsx`

#### 1.3 设置页面数据连通

- [x] 连接 `aiStore` 实现配置读写
- [x] 实现模型选择联动（vendor → baseUrl + model）
- [x] 配置变更自动保存
- [x] 实现"验证"API Key功能

**涉及文件**:
- `src/pages/Settings/index.tsx`
- `src/stores/aiStore.ts`

#### 1.4 侧边栏数据连通

- [x] 显示真实当前章节（从dialogueStore获取）
- [x] 显示真实进度数据
- [x] 会话统计显示真实数据

**涉及文件**:
- `src/components/layout/AppLayout.tsx`
- `src/components/home/RightPanel.tsx`

### Phase 2: 功能完善（中优先级）

**目标**: 完善核心功能和用户体验

#### 2.1 设置功能完善

- [x] 实现深色/浅色主题切换
- [x] 实现自动保存功能（对话草稿定时保存）
- [x] 实现消息通知功能
- [x] 添加设置导入/导出

**涉及文件**:
- `src/pages/Settings/index.tsx`
- `src/stores/settingsStore.ts`
- `src/contexts/ThemeContext.tsx`（新增）

#### 2.2 导出功能

- [x] 实现Markdown格式导出
- [x] 实现纯文本格式导出
- [x] 添加导出选项（全部/单章/草稿）

**新增文件**:
- `src/services/export/ExportService.ts`

#### 2.3 流式响应

- [x] 实现SSE/ReadableStream处理
- [x] AI回复逐字显示
- [x] 优化加载状态展示

**涉及文件**:
- `src/services/ai/AIService.ts`
- `src/components/common/MessageBubble.tsx`

#### 2.4 对话增强

- [x] 实现消息编辑/重新生成
- [x] 实现对话历史搜索
- [x] 添加对话标签/分类

**涉及文件**:
- `src/pages/DialogueAgent/index.tsx`
- `src/components/common/MessageBubble.tsx`
- `src/stores/dialogueStore.ts`
- `src/types/index.ts`

### Phase 3: 体验优化（低优先级）

**目标**: 打磨细节，提升产品质感

#### 3.1 UI/UX优化

- [x] 添加空状态引导（EmptyState组件应用）
- [x] 优化错误处理（ErrorState组件应用）
- [x] 添加键盘快捷键支持
- [x] 实现拖拽排序章节

**涉及文件**:
- `src/pages/Home/index.tsx`
- `src/pages/Autobiography/index.tsx`
- `src/pages/DialogueAgent/index.tsx`

#### 3.2 性能优化

- [x] 实现虚拟列表（长对话优化）
- [x] localStorage容量监控
- [x] 旧会话压缩/清理策略
- [x] 完整备份/恢复功能
- [x] 本地自动备份

**新增文件**:
- `src/services/backup/BackupService.ts`
- `src/hooks/useVirtualList.ts`

**修改文件**:
- `src/stores/autobiographyStore.ts`
- `src/stores/dialogueStore.ts`
- `src/pages/Settings/index.tsx`
- `src/pages/DialogueAgent/index.tsx`

#### 3.3 数据安全

- [x] 实现数据备份/恢复
- [x] 添加敏感数据加密（API Key）
- [x] 实现数据迁移到Tauri文件系统

**新增文件**:
- `src/utils/encryption.ts`
- `src/services/storage/tauriStorage.ts`

**修改文件**:
- `src/stores/aiStore.ts`
- `src/pages/Settings/index.tsx`

### Phase 4: 高级功能（可选）

**目标**: 扩展产品能力

#### 4.1 协作功能

- [ ] 多设备同步
- [x] 分享章节给他人审阅

**新增文件**:
- `src/services/share/ShareService.ts`

#### 4.2 AI增强

- [x] 多轮提取内容智能合并
- [x] 章节内容风格一致性检查
- [x] 时间线自动整理
- [x] 打印友好格式

**新增文件**:
- `src/ai_config/prompts/content_merge.md`
- `src/ai_config/prompts/style_check.md`
- `src/ai_config/prompts/timeline_organize.md`

**修改文件**:
- `src/ai_config/promptComposer.ts`
- `src/services/ai/AIService.ts`
- `src/pages/Autobiography/index.tsx`
- `src/App.css`

#### 4.3 发布功能

- [ ] 电子书生成（epub）
- [ ] 打印友好格式
- [ ] 云端备份

---

## 附录

### A. 关键文件索引

| 文件路径 | 职责 |
|---------|------|
| `src/App.tsx` | 应用根组件，路由配置 |
| `src/main.tsx` | 应用入口 |
| `src/App.css` | 全局样式和设计令牌 |
| `src/types/index.ts` | 全局类型定义 |
| `src/services/ai/AIService.ts` | AI服务核心类 |
| `src/services/storage/StorageService.ts` | 数据持久化服务 |
| `src/ai_config/promptComposer.ts` | 提示词组装器 |
| `src/ai_config/vendors.ts` | AI供应商配置 |
| `src/stores/aiStore.ts` | AI配置状态 |
| `src/stores/dialogueStore.ts` | 对话状态 |
| `src/stores/autobiographyStore.ts` | 自传数据状态 |
| `src/stores/settingsStore.ts` | 应用设置状态 |
| `src/pages/DialogueAgent/index.tsx` | 对话创作核心页面 |
| `src/components/dialogue/ContentExtractCard.tsx` | 内容提取卡片 |
| `src/components/dialogue/SidePanel.tsx` | 侧边面板 |
| `src/utils/parseExtract.ts` | EXTRACT标记解析 |

### B. Git 提交历史

```
47e0bf2 UIv4
5816eaf UIv3
ba0161f UIv2
a46506b UIv1
4a43f84 补充win启动方式
bfe3cd9 修复AI调用问题
e8289e3 提示词工程
41c9de1 对话流程
95da944 优化UIv2
38a8052 UI优化1
d027dbb cc风格
424a3a8 补充风格定义
610ea8a 拓展AI配置
f238237 补充AI配置
7a13978 first commit
```

### C. 设计令牌（CSS变量）

| 变量 | 值 | 用途 |
|------|-----|------|
| `--color-brand` | #da7756 | 主色调（暖赤陶） |
| `--color-brand-hover` | #c4684a | 悬停色 |
| `--color-gold` | #c9a96e | 文学辅助色 |
| `--color-sage` | #7a9e7e | 文学辅助色 |
| `--color-ink` | #1a1a1a | 主文字色 |
| `--color-bg` | #faf8f5 | 背景色 |
| `--font-serif` | "Noto Serif SC" | 衬线字体 |
| `--font-sans` | "Inter", "Noto Sans SC" | 无衬线字体 |

---

> **文档维护**: 本文档应随项目迭代及时更新
> **相关文档**: 
> - [架构设计文档](docs/autobiography-agent-design.md)
> - [设计系统规范](docs/design-system-specification.md)
