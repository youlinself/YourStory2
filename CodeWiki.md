# YourStory2 - Code Wiki 文档

> **项目名称**: YourStory2  
> **项目类型**: 桌面端 AI 自传创作助手  
> **技术栈**: Tauri 2 + React 19 + TypeScript + Zustand + Tailwind CSS 4 + Vite 7  
> **版本**: 0.1.0  
> **包管理器**: Yarn 4.9.2  

---

## 目录

- [1. 项目整体架构](#1-项目整体架构)
- [2. 目录结构](#2-目录结构)
- [3. 技术栈与依赖](#3-技术栈与依赖)
- [4. 核心模块详解](#4-核心模块详解)
  - [4.1 应用入口层](#41-应用入口层)
  - [4.2 状态管理模块 (Stores)](#42-状态管理模块-stores)
  - [4.3 服务层 (Services)](#43-服务层-services)
  - [4.4 AI 配置模块](#44-ai-配置模块)
  - [4.5 页面层 (Pages)](#45-页面层-pages)
  - [4.6 组件层 (Components)](#46-组件层-components)
  - [4.7 工具函数 (Utils)](#47-工具函数-utils)
  - [4.8 类型定义 (Types)](#48-类型定义-types)
- [5. 数据模型](#5-数据模型)
- [6. 关键类与函数说明](#6-关键类与函数说明)
- [7. 依赖关系图](#7-依赖关系图)
- [8. 项目运行方式](#8-项目运行方式)
- [9. AI 功能设计](#9-ai-功能设计)
- [10. 数据存储方案](#10-数据存储方案)
- [11. Tauri 后端说明](#11-tauri-后端说明)

---

## 1. 项目整体架构

YourStory2 是一款基于 **Tauri 2** 的桌面端 AI 自传创作助手，通过与 AI 对话的方式引导用户回忆和记录人生故事，最终生成结构化的个人自传。

### 架构分层

```
┌─────────────────────────────────────────────────────────────────┐
│                      前端应用层 (React + Vite)                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐  ┌───────────────┐ │
│  │ Pages   │  │Components│  │  Stores     │  │   Services    │ │
│  │ 页面    │  │ 组件     │  │ 状态管理     │  │  业务逻辑     │ │
│  └─────────┘  └─────────┘  └─────────────┘  └───────────────┘ │
│                          │                                      │
│                    浏览器 localStorage                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Tauri 2 后端 (Rust)                           │
│  ┌────────────────┐  ┌─────────────────┐                        │
│  │ main.rs        │  │ lib.rs          │                        │
│  │ 应用启动入口    │  │ 命令注册/插件    │                        │
│  └────────────────┘  └─────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### 核心架构特点

| 特性 | 实现 |
|------|------|
| **跨平台桌面应用** | Tauri 2 (Rust) |
| **前端框架** | React 19 + TypeScript |
| **状态管理** | Zustand 5 |
| **路由管理** | React Router DOM 7 |
| **样式方案** | Tailwind CSS 4 |
| **构建工具** | Vite 7 |
| **数据存储** | localStorage (浏览器端) |
| **AI 集成** | 多供应商 OpenAI 兼容 API |

---

## 2. 目录结构

```
YourStory2/
├── .vscode/                    # VS Code 配置
├── .yarn/                      # Yarn 缓存
├── docs/                       # 设计文档
│   └── autobiography-agent-design.md  # 智能体架构设计文档
├── public/                     # 静态资源
│   ├── tauri.svg
│   └── vite.svg
├── src/                        # 前端源码
│   ├── ai_config/              # AI 提示词与供应商配置
│   │   ├── prompts/            # Markdown 提示词文件
│   │   │   ├── system_prompt.md        # 主系统提示词
│   │   │   ├── content_extract.md      # 内容提取提示词
│   │   │   ├── context_compact.md      # 上下文压缩提示词
│   │   │   ├── suggestion_gen.md       # 建议词生成提示词
│   │   │   ├── welcome_guide.md        # 欢迎引导提示词
│   │   │   └── json_output_rules.md    # JSON 输出规范
│   │   ├── index.ts            # 模块导出
│   │   ├── promptComposer.ts   # 提示词组装工具
│   │   └── vendors.ts          # AI 供应商配置
│   ├── assets/                 # 前端资源
│   ├── components/             # 组件库
│   │   ├── common/             # 通用组件
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── index.ts
│   │   ├── dialogue/           # 对话相关组件
│   │   │   ├── ContentExtractCard.tsx  # 内容提取卡片
│   │   │   ├── DraftView.tsx           # 草稿视图
│   │   │   ├── OutlineView.tsx         # 大纲视图
│   │   │   ├── SidePanel.tsx           # 侧边面板
│   │   │   ├── SuggestionBar.tsx       # 建议词条
│   │   │   └── index.ts
│   │   ├── layout/             # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── index.ts
│   │   ├── ui/                 # 基础 UI 组件
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── hooks/                  # React Hooks
│   │   ├── useLocalStorage.ts  # localStorage Hook
│   │   └── index.ts
│   ├── pages/                  # 页面组件
│   │   ├── Autobiography/      # 自传管理页
│   │   │   └── index.tsx
│   │   ├── Dialogue/           # 旧版对话页（保留）
│   │   │   └── index.tsx
│   │   ├── DialogueAgent/      # 智能对话页（新）
│   │   │   └── index.tsx
│   │   ├── Home/               # 首页
│   │   │   └── index.tsx
│   │   ├── Settings/           # 设置页
│   │   │   └── index.tsx
│   │   └── index.ts
│   ├── services/               # 业务服务层
│   │   ├── ai/
│   │   │   ├── AIService.ts    # AI 请求封装
│   │   │   └── index.ts
│   │   ├── storage/
│   │   │   ├── StorageService.ts  # 存储服务
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── stores/                 # 状态管理
│   │   ├── aiStore.ts          # AI 配置状态
│   │   ├── autobiographyStore.ts  # 自传数据状态
│   │   ├── dialogueStore.ts    # 对话会话状态
│   │   └── index.ts
│   ├── types/                  # TypeScript 类型定义
│   │   └── index.ts
│   ├── utils/                  # 工具函数
│   │   ├── formatDate.ts       # 日期格式化
│   │   ├── generateId.ts       # ID 生成器
│   │   ├── parseExtract.ts     # EXTRACT 标记解析
│   │   └── index.ts
│   ├── App.css                 # 全局样式
│   ├── App.tsx                 # 应用根组件
│   ├── main.tsx                # 应用入口
│   └── vite-env.d.ts           # Vite 类型声明
├── src-tauri/                  # Tauri 后端 (Rust)
│   ├── capabilities/           # Tauri 能力配置
│   │   └── default.json
│   ├── icons/                  # 应用图标
│   ├── src/
│   │   ├── lib.rs              # Rust 库入口
│   │   └── main.rs             # Rust 主程序
│   ├── Cargo.toml              # Rust 依赖配置
│   ├── Cargo.lock
│   ├── build.rs                # 构建脚本
│   └── tauri.conf.json         # Tauri 配置
├── .gitignore
├── .yarnrc.yml                 # Yarn 配置
├── index.html                  # HTML 入口
├── package.json                # 项目配置
├── package-lock.json
├── tsconfig.json               # TypeScript 配置
├── tsconfig.node.json
├── vite.config.ts              # Vite 配置
└── yarn.lock
```

---

## 3. 技术栈与依赖

### 3.1 核心依赖

| 类别 | 包名 | 版本 | 用途 |
|------|------|------|------|
| **运行时框架** | `react` | ^19.1.0 | UI 框架 |
| | `react-dom` | ^19.1.0 | DOM 渲染 |
| **桌面壳** | `@tauri-apps/api` | ^2 | Tauri API |
| | `@tauri-apps/plugin-opener` | ^2 | 文件/URL 打开插件 |
| **状态管理** | `zustand` | ^5.0.14 | 轻量级状态管理 |
| **路由** | `react-router-dom` | ^7.18.1 | 客户端路由 |

### 3.2 开发依赖

| 类别 | 包名 | 版本 | 用途 |
|------|------|------|------|
| **构建工具** | `vite` | ^7.0.4 | 构建/开发服务器 |
| | `@vitejs/plugin-react` | ^4.6.0 | React 支持 |
| **样式** | `tailwindcss` | ^4.3.2 | CSS 框架 |
| | `@tailwindcss/vite` | ^4.3.2 | Tailwind Vite 插件 |
| **语言** | `typescript` | ~5.8.3 | 类型系统 |
| **类型定义** | `@types/react` | ^19.1.8 | React 类型 |
| | `@types/react-dom` | ^19.1.6 | ReactDOM 类型 |
| **Tauri CLI** | `@tauri-apps/cli` | ^2 | 桌面应用构建 |

### 3.3 Rust 后端依赖 (Cargo.toml)

| 包名 | 用途 |
|------|------|
| `tauri` | Tauri 框架 |
| `tauri-plugin-opener` | 系统打开功能 |
| `serde` | 序列化/反序列化 |
| `serde_json` | JSON 处理 |

---

## 4. 核心模块详解

### 4.1 应用入口层

#### `main.tsx` - 应用启动入口

```tsx
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**职责**: 将 React 应用挂载到 DOM 根节点。

#### `App.tsx` - 应用根组件

```tsx
// 核心结构
<Router>
  <MainLayout>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dialogue" element={<DialogueAgent />} />
      <Route path="/dialogue/:chapterId" element={<DialogueAgent />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/autobiography" element={<Autobiography />} />
    </Routes>
  </MainLayout>
</Router>
```

**职责**:
- 初始化路由系统
- 加载 AI 配置 (`loadSettings`)
- 包装全局布局组件

**路由表**:

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | `Home` | 首页 |
| `/dialogue` | `DialogueAgent` | 自由对话模式 |
| `/dialogue/:chapterId` | `DialogueAgent` | 章节关联对话 |
| `/settings` | `Settings` | AI 配置页 |
| `/autobiography` | `Autobiography` | 自传管理页 |

---

### 4.2 状态管理模块 (Stores)

项目使用 **Zustand** 进行全局状态管理，分为三个核心 Store：

#### 4.2.1 `aiStore.ts` - AI 配置状态

**文件位置**: [src/stores/aiStore.ts](file:///src/stores/aiStore.ts)

**管理状态**:
- `apiKey` - API 密钥
- `model` - 模型名称
- `baseUrl` - API 地址
- `vendor` - 供应商 ID
- `temperature` - 生成温度
- `maxInputTokens` / `maxOutputTokens` - Token 限制

**关键方法**:

| 方法 | 说明 |
|------|------|
| `setVendor(vendor)` | 切换供应商，自动更新 baseUrl 和 model |
| `loadSettings()` | 从 localStorage 加载配置 |
| `saveSettings()` | 持久化配置到 localStorage |

**存储键**: `ai-settings`

#### 4.2.2 `dialogueStore.ts` - 对话会话状态

**文件位置**: [src/stores/dialogueStore.ts](file:///src/stores/dialogueStore.ts)

**管理状态**:
- `activeSession` - 当前活跃会话
- `sessions` - 所有会话（按 chapterId 索引）
- `suggestions` - 当前建议列表
- `isGenerating` - 是否正在生成
- `sidePanel` - 面板模式（outline/draft）
- `sidePanelOpen` - 面板是否展开

**关键方法**:

| 方法 | 说明 |
|------|------|
| `initSession(chapterId)` | 初始化会话，加载或创建 |
| `addMessage(message)` | 添加消息并持久化 |
| `setSuggestions(suggestions)` | 更新建议列表 |
| `updateExtractStatus(msgId, status)` | 更新内容提取状态 |
| `setSidePanel(panel)` | 切换面板模式 |
| `toggleSidePanel()` | 切换面板展开/收起 |

**存储键**: `dialogue-sessions`

**会话索引逻辑**:
```typescript
function sessionKey(chapterId: string | null): string {
  return chapterId || 'free';  // 自由对话使用 'free' 键
}
```

#### 4.2.3 `autobiographyStore.ts` - 自传数据状态

**文件位置**: [src/stores/autobiographyStore.ts](file:///src/stores/autobiographyStore.ts)

**管理状态**:
- `autobiography` - 自传对象（包含章节列表）

**关键方法**:

| 方法 | 说明 |
|------|------|
| `load()` | 加载自传数据 |
| `create()` | 创建新自传 |
| `createChapter(title, timeRange)` | 创建章节 |
| `deleteChapter(chapterId)` | 删除章节 |
| `updateChapterContent(id, content)` | 更新章节内容 |
| `updateChapterDraft(id, draft)` | 更新章节草稿 |
| `confirmChapterDraft(chapterId)` | 确认草稿写入内容 |
| `getCompletionStats()` | 获取完成统计 |

**草稿写入逻辑** (`confirmChapterDraft`):
```typescript
// 将 draftContent 合并到 content 中
const newContent = ch.content
  ? `${ch.content}\n\n${ch.draftContent}`
  : ch.draftContent || '';
```

**存储键**: `autobiography`

---

### 4.3 服务层 (Services)

#### 4.3.1 `AIService.ts` - AI 请求服务

**文件位置**: [src/services/ai/AIService.ts](file:///src/services/ai/AIService.ts)

**设计模式**: 单例类，封装所有 AI API 调用

**配置接口**:
```typescript
interface AIServiceConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  vendor?: string;
  temperature?: number;
  maxInputTokens?: number;
  maxOutputTokens?: number;
}
```

**核心方法**:

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `generateResponse()` | `userInput`, `history`, `chapterContext?` | `Promise<string>` | 生成对话回复，支持章节上下文感知 |
| `extractContent()` | `recentMessages`, `chapterTitle` | `Promise<ExtractedContent \| null>` | 从对话中提取结构化内容 |
| `generateSuggestions()` | `autobiography`, `chapterId`, `messages` | `Promise<Suggestion[]>` | 生成智能建议 |
| `generateChapterSummary()` | `title`, `dialogueContent` | `Promise<string>` | 生成章节摘要 |
| `generateWelcomeGuide()` | `autobiography`, `chapterId` | `Promise<...>` | 生成个性化欢迎引导 |

**上下文压缩指令**:
```typescript
// 输入 /compact 可触发上下文压缩
const compactDirective = PromptComposer.parseCompactCommand(userInput);
```

**Token 限制控制**:
```typescript
// 根据供应商限制 clamp max_tokens
const vendorLimit = getMaxOutputTokens(this.vendor);
const maxTokens = Math.min(this.maxOutputTokens, vendorLimit);
```

**API 请求结构**:
```typescript
POST ${baseUrl}/chat/completions
Headers: {Authorization: `Bearer ${apiKey}`}
Body: {
  model: this.model,
  messages: [...],
  max_tokens: maxTokens,
  temperature: this.temperature
}
```

#### 4.3.2 `StorageService.ts` - 存储服务

**文件位置**: [src/services/storage/StorageService.ts](file:///src/services/storage/StorageService.ts)

**设计模式**: 单例模式

**方法**:

| 方法 | 说明 |
|------|------|
| `saveData(key, data)` | JSON 序列化后存入 localStorage |
| `loadData<T>(key)` | 读取并反序列化 |
| `removeData(key)` | 删除指定键 |
| `clearAll()` | 清空所有数据 |

**注意**: 所有方法都是异步的（返回 `Promise`），为后续迁移到 Tauri 文件存储预留接口。

---

### 4.4 AI 配置模块

#### 4.4.1 `vendors.ts` - AI 供应商配置

**文件位置**: [src/ai_config/vendors.ts](file:///src/ai_config/vendors.ts)

**支持的供应商**:

| ID | 名称 | 默认模型 | 最大输出 Token |
|----|------|----------|----------------|
| `openai` | OpenAI | gpt-4o-mini | 16384 |
| `anthropic` | Claude | claude-sonnet-4-20250514 | 8192 |
| `deepseek` | DeepSeek | deepseek-chat | 8192 |
| `minimax` | MiniMax | MiniMax-Text-01 | 40000 |
| `mimo` | 小米 MiMo | MiMo-VL-7B-RL | 8192 |
| `qwen` | 通义千问 | qwen-max | 8192 |
| `zhipu` | 智谱 GLM | glm-4-plus | 4096 |
| `kimi` | Kimi | moonshot-v1-32k | 8192 |
| `doubao` | 豆包 | doubao-pro-32k | 4096 |
| `siliconflow` | SiliconFlow | Qwen/Qwen2.5-72B-Instruct | 8192 |
| `custom` | 自定义 | - | 4096 |

**工具函数**:
```typescript
getVendorById(id)           // 获取供应商配置
getVendorModels(id)         // 获取模型列表
getDefaultBaseUrl(id)       // 获取默认 Base URL
getDefaultModel(id)         // 获取默认模型
getMaxOutputTokens(id)      // 获取最大输出 Token
fetchVendorModels(id, key)  // 远程获取最新模型列表
```

#### 4.4.2 `promptComposer.ts` - 提示词组装工具

**文件位置**: [src/ai_config/promptComposer.ts](file:///src/ai_config/promptComposer.ts)

**职责**: 从 Markdown 配置文件加载提示词，组装完整消息数组

**核心方法**:

| 方法 | 说明 |
|------|------|
| `getSystemPrompt()` | 获取主系统提示词 |
| `getContentExtractPrompt()` | 获取内容提取提示词 |
| `getSuggestionGenPrompt()` | 获取建议词生成提示词 |
| `getWelcomeGuidePrompt()` | 获取欢迎引导提示词 |
| `getContextCompactPrompt()` | 获取上下文压缩提示词 |
| `buildMessages(userInput, history, chapterContext?)` | 构建对话消息数组 |
| `buildExtractMessages(messages, title)` | 构建内容提取消息数组 |
| `buildSuggestionMessages(chapterInfo, summary)` | 构建建议生成消息数组 |
| `buildWelcomeGuideMessages(status, chapterInfo?)` | 构建欢迎引导消息数组 |
| `parseCompactCommand(input)` | 解析 /compact 压缩指令 |
| `prependJsonRulesToSystem(content)` | 前置 JSON 输出规范 |
| `mergeIntoSystem(messages, fragment)` | 合并片段到 system 消息 |

**消息组装示例**:
```typescript
// 构建对话消息，注入章节上下文
buildMessages(userInput, history, chapterContext) {
  let systemContent = this.getSystemPrompt();
  
  if (chapterContext) {
    systemContent += `\n## 当前章节上下文\n- 章节标题：${chapterContext.chapterTitle}`;
    // ... 注入时间范围、已有内容
  }
  
  return [
    { role: 'system', content: systemContent },
    ...history,
    { role: 'user', content: userInput }
  ];
}
```

---

### 4.5 页面层 (Pages)

#### 4.5.1 `Home` - 首页

**文件位置**: [src/pages/Home/index.tsx](file:///src/pages/Home/index.tsx)

**职责**: 应用入口引导页
- 展示产品功能介绍
- 提供"对话创作"和"我的自传"入口
- 快速开始引导步骤

#### 4.5.2 `DialogueAgent` - 智能对话页（核心页面）

**文件位置**: [src/pages/DialogueAgent/index.tsx](file:///src/pages/DialogueAgent/index.tsx)

**职责**: 核心创作页面，支持自由对话和章节关联对话

**功能特性**:
- 消息收发与展示
- 内容提取卡片交互
- 智能建议词切换
- 侧边面板（大纲/草稿切换）
- 章节切换与管理
- 欢迎引导生成

**关键状态与交互**:

```typescript
// 核心交互流程
1. 初始化 → loadSettings() + loadAutobiography() + initSession(chapterId)
2. 发送消息 → handleSendMessage()
   - 添加用户消息到 store
   - 构建 chapterContext（章节上下文）
   - 调用 AIService.generateResponse()
   - 解析 EXTRACT 标记 → 渲染 ContentExtractCard
   - 异步生成建议词（每3轮或提取内容后）
3. 内容提取 → handleApproveExtract()
   - 有章节 → 直接写入 draftContent
   - 无章节 → 弹出章节选择 Modal
   - 编辑模式 → handleEditExtract()
4. 草稿确认 → confirmChapterDraft()
5. 章节切换 → handleSwitchChapter()
6. 摘要生成 → handleGenerateSummary()
```

**章节上下文构建**:
```typescript
if (chapterId && currentChapter) {
  chapterContext = {
    chapterId: currentChapter.id,
    chapterTitle: currentChapter.title,
    existingContent: currentChapter.content || '',
    timeRange: currentChapter.timeRange,
  };
}
```

#### 4.5.3 `Autobiography` - 自传管理页

**文件位置**: [src/pages/Autobiography/index.tsx](file:///src/pages/Autobiography/index.tsx)

**职责**: 自传总览与章节管理
- 展示自传标题和完成统计
- 章节列表展示（状态、时间范围）
- 创建/删除章节
- 跳转到章节对话

#### 4.5.4 `Settings` - 设置页

**文件位置**: [src/pages/Settings/index.tsx](file:///src/pages/Settings/index.tsx)

**职责**: AI 配置管理
- 供应商选择（下拉）
- API Key 输入
- 测试连接并获取模型列表
- Base URL 配置
- 模型选择（支持远程获取）
- Temperature 滑块（0-2）
- Token 限制配置
- 保存设置

**关键功能**:
```typescript
// 测试连接
handleTestConnection() {
  const models = await fetchVendorModels(vendor, apiKey);
  setFetchedModels(models);
  setTestStatus('success');
}

// 保存设置时 clamp maxOutputTokens
const vendorLimit = getMaxOutputTokens(localVendor);
const clampedMaxOutput = Math.min(localMaxOutputTokens, vendorLimit);
```

---

### 4.6 组件层 (Components)

#### 4.6.1 布局组件 (`layout/`)

| 组件 | 文件 | 职责 |
|------|------|------|
| `MainLayout` | [MainLayout.tsx](file:///src/components/layout/MainLayout.tsx) | 页面整体布局：Sidebar + Header + Content |
| `Sidebar` | [Sidebar.tsx](file:///src/components/layout/Sidex.tsx) | 侧边导航栏，菜单路由 |
| `Header` | [Header.tsx](file:///src/components/layout/Header.tsx) | 顶部导航，页面标题显示 |

#### 4.6.2 对话组件 (`dialogue/`)

| 组件 | 文件 | 职责 |
|------|------|------|
| `ContentExtractCard` | [ContentExtractCard.tsx](file:///src/components/dialogue/ContentExtractCard.tsx) | AI 提取内容卡片，支持确认/编辑/丢弃 |
| `SuggestionBar` | [SuggestionBar.tsx](file:///src/components/dialogue/SuggestionBar.tsx) | 智能建议词展示条 |
| `SidePanel` | [SidePanel.tsx](file:///src/components/dialogue/SidePanel.tsx) | 右侧面板容器，支持 outline/draft 切换 |
| `OutlineView` | [OutlineView.tsx](file:///src/components/dialogue/OutlineView.tsx) | 自传大纲视图，章节列表+进度 |
| `DraftView` | [DraftView.tsx](file:///src/components/dialogue/DraftView.tsx) | 章节草稿预览与操作 |

**ContentExtractCard 交互**:
```
┌─────────────────────────────────────┐
│  📄 AI 提取的自传内容                │
│  [1990年夏天] [温馨] [父亲]          │  ← 标签展示
│                                     │
│  那年夏天，我记忆中最深刻的是...      │  ← 内容预览
│                                     │
│  [写入章节] [编辑] [丢弃]            │  ← 操作按钮
└─────────────────────────────────────┘
```

#### 4.6.3 基础 UI 组件 (`ui/`)

| 组件 | 说明 |
|------|------|
| `Button` | 按钮组件，支持 variant (primary/secondary/ghost) 和 size (sm/md/lg) |
| `Card` | 卡片容器，可选标题和点击事件 |
| `Input` | 输入框组件，支持 label |
| `Modal` | 弹窗组件 |

#### 4.6.4 通用组件 (`common/`)

| 组件 | 文件 | 职责 |
|------|------|------|
| `MessageBubble` | [MessageBubble.tsx](file:///src/components/common/MessageBubble.tsx) | 消息气泡，区分用户/AI 样式 |
| `LoadingSpinner` | LoadingSpinner.tsx | 加载动画 |

**MessageBubble 结构**:
```tsx
// AI 消息
<div className="flex justify-start">
  <AIAvatar />  {/* 渐变背景 SVG 图标 */}
  <div className="chat-bubble-ai">
    <p>{message}</p>
  </div>
  <timestamp />
</div>

// 用户消息
<div className="flex justify-end">
  <div className="chat-bubble-user">
    <p>{message}</p>
  </div>
</div>
```

---

### 4.7 工具函数 (Utils)

**文件位置**: [src/utils/](file:///src/utils/)

| 函数 | 文件 | 说明 |
|------|------|------|
| `generateId` | [generateId.ts](file:///src/utils/generateId.ts) | 生成唯一 ID |
| `formatDate` | [formatDate.ts](file:///src/utils/formatDate.ts) | 日期格式化 |
| `parseExtract` | [parseExtract.ts](file:///src/utils/parseExtract.ts) | 解析 AI 回复中的 EXTRACT 标记 |

**parseExtract 详解**:
```typescript
// 从 AI 回复中解析 [EXTRACT]...[END_EXTRACT] 标记
export function parseExtract(response: string): {
  text: string;                          // 纯文本内容
  extract: ExtractedContent | null;      // 提取的结构化内容
} {
  const regex = /\[EXTRACT\](.*?)\[END_EXTRACT\]/s;
  const match = response.match(regex);
  if (!match) return { text: response, extract: null };

  const text = response.replace(regex, '').trim();
  try {
    const parsed = JSON.parse(match[1]);
    return {
      text,
      extract: {
        paragraphs: parsed.paragraphs || [],
        timeTag: parsed.timeTag,
        emotionTags: parsed.emotionTags,
        people: parsed.people,
        status: 'pending',
      },
    };
  } catch {
    return { text: response, extract: null };
  }
}
```

**示例输入/输出**:
```
输入: "那年夏天很美好。[EXTRACT]{\"paragraphs\":[\"那年夏天...\"],\"timeTag\":\"1990年夏\"}[END_EXTRACT]"

输出: {
  text: "那年夏天很美好。",
  extract: {
    paragraphs: ["那年夏天..."],
    timeTag: "1990年夏",
    status: "pending"
  }
}
```

---

### 4.8 类型定义 (Types)

**文件位置**: [src/types/index.ts](file:///src/types/index.ts)

#### 核心类型

```typescript
/** 对话消息 */
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'content_extract';           // 消息类型
  extractedContent?: ExtractedContent;        // 提取的结构化内容
}

/** AI 从对话中提取的结构化内容 */
interface ExtractedContent {
  paragraphs: string[];                        // 提取的段落
  timeTag?: string;                            // 时间标签
  emotionTags?: string[];                      // 情感标签
  people?: string[];                           // 关键人物
  status: 'pending' | 'approved' | 'edited' | 'rejected';
  editedContent?: string;                      // 用户编辑后的内容
}

/** 自传章节 */
interface Chapter {
  id: string;
  title: string;
  content: string;                             // 最终确认内容
  draftContent?: string;                       // 对话产生的草稿
  timeRange?: string;                          // 时间范围，如 "1990-2000"
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

/** AI 配置 */
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
  chapterId: string | null;                    // 关联章节，null 表示自由对话
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

/** 章节上下文（传给 AI） */
interface ChapterContext {
  chapterId: string;
  chapterTitle: string;
  existingContent: string;
  timeRange?: string;
}
```

---

## 5. 数据模型

### 5.1 实体关系

```
Autobiography (1) ──── (N) Chapter
                              │
                              │ 1:0..1
                              ▼
                        DialogueSession (按 chapterId 索引)
                              │
                              │ 1:N
                              ▼
                           Message
                              │
                              │ 1:0..1
                              ▼
                       ExtractedContent
```

### 5.2 localStorage 存储映射

| Key | 类型 | 说明 |
|-----|------|------|
| `ai-settings` | `AISettings` | AI 配置（apiKey, model, baseUrl 等） |
| `autobiography` | `Autobiography` | 自传数据（包含章节列表） |
| `dialogue-sessions` | `Record<string, DialogueSession>` | 对话会话，按 `chapterId` 或 `'free'` 索引 |

### 5.3 内容提取状态机

```
           ┌─────────────┐
           │   pending   │  ← 初始状态（AI 自动提取后）
           └──────┬──────┘
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ approved │ │  edited  │ │ rejected │
└──────────┘ └──────────┘ └──────────┘
```

---

## 6. 关键类与函数说明

### 6.1 AIService 类

```typescript
class AIService {
  // 构造函数
  constructor(config: AIServiceConfig);
  
  // 核心方法
  async generateResponse(
    userInput: string,
    conversationHistory: Message[],
    chapterContext?: ChapterContext
  ): Promise<string>;
  
  async extractContent(
    recentMessages: Message[],
    chapterTitle: string
  ): Promise<ExtractedContent | null>;
  
  async generateSuggestions(
    autobiography: Autobiography | null,
    currentChapterId: string | null,
    recentMessages: Message[]
  ): Promise<Suggestion[]>;
  
  async generateChapterSummary(
    chapterTitle: string,
    dialogueContent: string
  ): Promise<string>;
  
  async generateWelcomeGuide(
    autobiography: Autobiography | null,
    chapterId: string | null
  ): Promise<{ welcome: string; guide: string; starters: string[]; tips: string } | null>;
  
  // 私有方法
  private buildChapterInfo(chapters, currentChapterId): string;
  private handleCompact(history, directive): Promise<string>;
  private sendRequest(messages): Promise<string>;
}
```

### 6.2 PromptComposer 对象

```typescript
const PromptComposer = {
  // 获取提示词
  getSystemPrompt(): string;
  getJsonOutputRules(): string;
  getContextCompactPrompt(): string;
  getContentExtractPrompt(): string;
  getSuggestionGenPrompt(): string;
  getWelcomeGuidePrompt(): string;
  
  // 组装消息
  buildMessages(userInput, history, chapterContext?, stage?): Message[];
  buildExtractMessages(recentMessages, title): Message[];
  buildSuggestionMessages(chapterInfo, summary): Message[];
  buildWelcomeGuideMessages(autobiographyStatus, chapterInfo?): Message[];
  
  // 工具方法
  prependJsonRulesToSystem(content): string;
  mergeIntoSystem(messages, fragment): Message[];
  parseCompactCommand(input): string | null;
};
```

### 6.3 关键 Hooks

```typescript
// 全局 Store Hooks (Zustand)
useAIStore()           // AI 配置状态与操作
useDialogueStore()     // 对话会话状态与操作
useAutobiographyStore() // 自传数据状态与操作

// 本地存储 Hook
useLocalStorage<T>(key, initialValue): [T, setter]
```

---

## 7. 依赖关系图

```
App.tsx
├── Router (react-router-dom)
├── MainLayout (components/layout)
│   ├── Sidebar
│   ├── Header
│   └── {children} (Pages)
│       ├── Home
│       │   └── Card, Button
│       ├── DialogueAgent
│       │   ├── MessageBubble (common)
│       │   ├── ContentExtractCard, SuggestionBar, SidePanel (dialogue)
│       │   ├── Modal (ui)
│       │   ├── useAIStore, useDialogueStore, useAutobiographyStore
│       │   ├── AIService (services/ai)
│       │   ├── generateId, parseExtract (utils)
│       │   └── useNavigate, useParams (react-router-dom)
│       ├── Autobiography
│       │   ├── Card, Button, Input, Modal (ui)
│       │   └── useAutobiographyStore
│       └── Settings
│           ├── Card, Input, Button (ui)
│           ├── useAIStore
│           └── AI_VENDORS, fetchVendorModels (ai_config)
├── useEffect → useAIStore.loadSettings()
└── useEffect → useAutobiographyStore.load()
```

### Store 依赖关系

```
aiStore
└── StorageService (services/storage)

dialogueStore
├── StorageService (services/storage)
└── generateId (utils)

autobiographyStore
├── StorageService (services/storage)
└── generateId (utils)
```

### Service 依赖关系

```
AIService
├── PromptComposer (ai_config)
├── AI_VENDORS (ai_config/vendors)
└── fetch API (浏览器原生)

StorageService
└── localStorage (浏览器原生)
```

---

## 8. 项目运行方式

### 8.1 前置要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 18 | JavaScript 运行时 |
| Yarn | 4.9.2+ | 包管理器（项目已锁定） |
| Rust | 最新版 | Tauri 后端编译需要 |
| VS Code | 推荐 | IDE 开发环境 |

### 8.2 安装依赖

```bash
# 使用 Yarn（推荐）
yarn install

# 或使用 npm
npm install
```

### 8.3 开发模式

```bash
# 启动 Tauri 开发模式（含前端热重载）
yarn tauri dev

# 或
npm run tauri dev
```

**Tauri 开发模式启动流程**:
1. `beforeDevCommand`: `npm run dev` → 启动 Vite 开发服务器 (http://localhost:1420)
2. Tauri 启动桌面应用，连接前端 URL
3. Vite HMR 支持前端热更新

### 8.4 构建生产版本

```bash
# 构建前端 + 打包桌面应用
yarn tauri build

# 或
npm run tauri build
```

**构建流程**:
1. `beforeBuildCommand`: `npm run build` → TypeScript 编译 + Vite 构建
2. 前端输出到 `dist/` 目录
3. Tauri 打包 Rust 代码 + 前端资源
4. 生成平台特定安装包 (Windows: .msi/.exe, macOS: .dmg, Linux: .deb/.AppImage)

### 8.5 仅前端开发（无桌面壳）

```bash
# 仅启动 Vite 开发服务器
yarn dev

# 构建前端资源
yarn build

# 预览构建结果
yarn preview
```

### 8.6 配置说明

#### Vite 配置 (`vite.config.ts`)

```typescript
{
  plugins: [react(), tailwindcss()],
  server: {
    port: 1420,           // 固定端口
    strictPort: true,     // 端口被占用时失败
    host: process.env.TAURI_DEV_HOST || false,
    hmr: { protocol: "ws", port: 1421 },  // HMR WebSocket 配置
  },
  clearScreen: false,     // 防止掩盖 Rust 错误
}
```

#### Tauri 配置 (`tauri.conf.json`)

```json
{
  "productName": "yourstory2",
  "version": "0.1.0",
  "identifier": "com.administrator.yourstory2",
  "app": {
    "windows": [{ "title": "yourstory2", "width": 800, "height": 600 }],
    "security": { "csp": null }
  },
  "bundle": { "active": true, "targets": "all" }
}
```

---

## 9. AI 功能设计

### 9.1 对话流程

```
┌─────────────────────┐
│     用户进入对话      │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  生成个性化欢迎引导    │  ← AIService.generateWelcomeGuide()
│  (starters 转为建议)  │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│     用户发送消息      │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  AI 生成回复         │  ← AIService.generateResponse()
│  (支持章节上下文)     │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  解析 EXTRACT 标记    │  ← parseExtract()
│  渲染内容提取卡片     │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  异步生成建议词       │  ← AIService.generateSuggestions()
│  (每3轮或提取后)     │
└─────────────────────┘
```

### 9.2 提示词系统

| 提示词文件 | 用途 |
|------------|------|
| `system_prompt.md` | 主系统提示词，定义 AI 角色和行为 |
| `content_extract.md` | 内容提取专用提示词 |
| `context_compact.md` | 上下文压缩提示词 |
| `suggestion_gen.md` | 建议词生成提示词 |
| `welcome_guide.md` | 欢迎引导生成提示词 |
| `json_output_rules.md` | JSON 输出规范 |

### 9.3 上下文压缩

输入 `/compact` 或 `/compact [关注方向]` 触发:
1. 检测指令 → `PromptComposer.parseCompactCommand()`
2. 调用压缩处理 → `AIService.handleCompact()`
3. 将对话历史压缩为精简摘要

---

## 10. 数据存储方案

### 10.1 当前方案: localStorage

| Key | 数据大小估算 | 说明 |
|-----|--------------|------|
| `ai-settings` | < 1KB | API 配置 |
| `autobiography` | 取决于内容 | 自传数据 |
| `dialogue-sessions` | 可增长 | 对话历史 |

**限制**: 约 5MB 总容量

### 10.2 数据持久化策略

```
用户操作 → Store 状态更新 → StorageService 异步保存
                │
                ▼
          localStorage (JSON 序列化)
```

### 10.3 未来扩展（设计文档建议）

- 迁移至 Tauri 文件存储 (绕过 5MB 限制)
- 对话历史压缩/归档
- 云同步支持

---

## 11. Tauri 后端说明

### 11.1 当前状态

Tauri 后端目前非常精简，仅包含:
- 一个示例命令 `greet(name)` - 打印问候语
- `tauri-plugin-opener` 插件 - 支持使用系统默认程序打开文件或 URL

### 11.2 核心文件

**`src-tauri/src/main.rs`** - 程序入口:
```rust
fn main() {
    yourstory2_lib::run()
}
```

**`src-tauri/src/lib.rs`** - 库入口与命令注册:
```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 11.3 后续扩展建议

根据设计文档，未来可添加:
- 文件系统 API 替代 localStorage
- 更强大的本地数据存储能力
- 系统级集成功能

---

## 附录: 快速导航

| 需求 | 文件位置 |
|------|----------|
| 修改路由 | [src/App.tsx](file:///src/App.tsx) |
| 添加新页面 | 在 [src/pages/](file:///src/pages/) 创建，更新 `index.ts` |
| 添加新组件 | 在 [src/components/](file:///src/components/) 对应目录创建 |
| 修改 AI 提示词 | [src/ai_config/prompts/](file:///src/ai_config/prompts/) Markdown 文件 |
| 添加 AI 供应商 | 编辑 [src/ai_config/vendors.ts](file:///src/ai_config/vendors.ts) 的 `AI_VENDORS` 数组 |
| 修改状态管理 | [src/stores/](file:///src/stores/) 对应 Store 文件 |
| 修改样式 | Tailwind CSS，配置文件为 [src/App.css](file:///src/App.css) |
| 修改 Tauri 配置 | [src-tauri/tauri.conf.json](file:///src-tauri/tauri.conf.json) |

---

*文档生成日期: 2026-07-18*  
*项目版本: 0.1.0*
