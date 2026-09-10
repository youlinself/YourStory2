# YourStory2

基于 **Tauri 2 + React 19 + TypeScript** 构建的桌面端 AI 创作平台，集传记创作、小说写作、模拟人生、卡牌策略于一体。

---

## 功能概览

### 传记创作 (Autobiography)
通过对话式交互，引导你回忆人生故事，AI 智能生成流畅的传记内容，支持章节管理、时间线整理、风格一致性检查、内容审阅与编辑。

### 对话创作 (Dialogue Agent)
以对话为核心的内容创作工具，支持话题引导、AI 内容生成、智能提问、内容提取与合并，让创作如同聊天般自然。

### 小说创作 (Novel)
功能完备的小说写作工作室，包含：
- 多卷本管理与章节编辑
- 角色设计面板与人物关系图谱
- 世界观构建工具
- 写作灵感板与标签管理
- AI 辅助写作（续写、角色生成、情节建议、润色）
- Markdown 编辑器与版本对比
- 写作统计与分析
- 导入/导出功能

### 模拟人生 (Simulation)
融合卡牌与 Roguelike 元素的人生模拟游戏：
- 多时代背景（童年、少年、青年、中年、老年）
- 属性系统（精力、体质、智商、情商、财富、人脉、声望）
- 事件驱动的人生历程
- 卡牌战斗系统（攻击、技能、诅咒、境界卡）
- 修仙境界体系
- 羁绊卡牌系统
- 人生总结与评分

### 智囊团 (ThinkTank)
卡牌收集与策略对战系统，包含数百张不同类型的卡牌，支持自由组牌与模拟对战。

### AI 工坊 (AI Workshop)
任务协作工作区，支持任务提交、AI 秘书辅助、办公画布可视化。

### 成就系统 (Achievement Wall)
多维度成就体系，涵盖战斗、人生、修仙、收集、特殊五大类别。

### 游戏记录
历史模拟记录存档，支持查看详情、评分对比与记录管理。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Tauri 2 (Rust) |
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 7 |
| 样式方案 | TailwindCSS 4 |
| 状态管理 | Zustand |
| 路由 | React Router v7 |
| 图表 | Recharts |
| 编辑器 | @uiw/react-md-editor |

---

## 支持的 AI 供应商

| 供应商 | 默认模型 |
|--------|----------|
| OpenAI | gpt-4o-mini |
| Anthropic (Claude) | claude-sonnet-4-20250514 |
| DeepSeek | deepseek-chat |
| MiniMax | MiniMax-Text-01 |
| 通义千问 (阿里云) | qwen-max |
| 智谱 GLM | glm-4-plus |
| Kimi (月之暗面) | moonshot-v1-32k |
| 豆包 (火山引擎) | doubao-pro-32k |
| SiliconFlow | Qwen2.5-72B-Instruct |
| Ollama (本地) | llama3.2 |
| 自定义 | 兼容 OpenAI API 格式 |

---

## 环境要求

- **Node.js** >= 18
- **Rust** 最新稳定版（通过 [rustup](https://rustup.rs/) 安装）
- **pnpm** / **npm** / **yarn** 任意包管理器

---

## 启动方式

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发模式（热重载）

```bash
npm run dev
```

此命令会同时启动 Vite 前端开发服务器和 Tauri 桌面窗口。

### 3. 构建生产版本

```bash
npm run build
```

前端产物输出至 `dist/` 目录。

### 4. 构建桌面安装包

```bash
npm run tauri build
```

构建完成后，安装包位于 `src-tauri/target/release/bundle/` 目录下。

---

## 桌面安装包

`src-tauri/` 目录下包含完整的 Tauri 桌面应用配置与构建产物：

```
src-tauri/
├── Cargo.toml          # Rust 依赖配置
├── tauri.conf.json     # Tauri 应用配置（窗口、图标、权限等）
├── icons/              # 应用图标资源
├── capabilities/       # 权限能力配置
├── src/                 # Rust 后端源码
└── target/release/bundle/  # 构建产物（安装包）
    ├── msi/            # Windows 安装包 (.msi)
    ├── nsis/           # Windows NSIS 安装包 (.exe)
    ├── deb/            # Linux Debian 包 (.deb)
    ├── rpm/            # Linux RPM 包 (.rpm)
    ├── dmg/            # macOS 磁盘镜像 (.dmg)
    └── appimage/       # Linux AppImage (.AppImage)
```

### 安装包获取

1. **从源码构建**：运行 `npm run tauri build`，产物自动生成于 `src-tauri/target/release/bundle/`
2. **GitHub Releases**：访问本仓库的 [Releases](https://github.com/your-org/yourstory2/releases) 页面下载预编译安装包

---

## 项目结构

```
YourStory2/
├── src/                    # 前端源码
│   ├── agent/              # AI Agent 核心框架
│   │   ├── llm/            # LLM 统一适配层
│   │   ├── skills/         # 技能系统
│   │   ├── tools/          # 工具注册
│   │   ├── prompts/        # 提示词模板
│   │   └── extensions/     # 业务扩展
│   ├── ai_config/          # AI 供应商配置
│   ├── components/         # 通用 UI 组件
│   ├── pages/              # 页面路由
│   ├── stores/             # Zustand 状态管理
│   ├── services/           # 业务服务层
│   ├── hooks/              # React Hooks
│   ├── data/               # 静态数据配置
│   ├── types/              # TypeScript 类型定义
│   └── utils/              # 工具函数
├── src-tauri/              # Tauri 桌面端（Rust）
├── public/                 # 静态资源
└── archive/                # 项目归档文档
```

---

## 配置说明

首次使用需在 **设置** 页面配置 AI 供应商：
1. 选择 AI 供应商（如 DeepSeek、OpenAI 等）
2. 输入 API Key
3. 选择或自定义模型
4. 点击测试连接验证配置

配置支持本地存储与 Tauri 文件存储两种模式。

---

## License

MIT
