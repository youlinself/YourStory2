# YourStory 人性化交互设计规范

> 面向文学创作者的沉浸式写作体验设计指南

---

## 目录

1. [设计价值观](#1-设计价值观)
2. [设计原则](#2-设计原则)
3. [交互反馈规范](#3-交互反馈规范)
4. [空状态设计](#4-空状态设计)
5. [错误处理规范](#5-错误处理规范)
6. [动效与过渡规范](#6-动效与过渡规范)
7. [视觉层次规范](#7-视觉层次规范)

---

## 1. 设计价值观

### 核心理念：沉浸、温暖、值得信赖

YourStory 是为文学创作者设计的自传写作工具。我们的设计应该像一位贴心的写作伙伴——在需要时给予引导，在专注时保持安静。

| 价值观 | 含义 | 设计体现 |
|--------|------|----------|
| **沉浸** | 让创作者专注于写作本身 | 减少视觉干扰，使用优雅的衬线字体，营造书写氛围 |
| **温暖** | 传递人文关怀 | 柔和的配色、圆润的边角、鼓励性的文案 |
| **值得信赖** | 建立创作者的信心 | 清晰的状态反馈、可靠的数据保护、专业的视觉呈现 |

### 与现有设计语言的延续

在现有的 Terracotta 温暖赤陶色基础上，我们进一步强化「文学感」：

```css
/* 现有的品牌色继续作为主色调 */
--color-brand-primary: #da7756;      /* 温暖赤陶色 - 主操作、强调 */
--color-brand-primary-hover: #c4684a; /* 悬停状态 */
--color-brand-primary-light: rgba(218, 119, 86, 0.1); /* 淡入背景 */

/* 新增文学感辅助色 */
--color-literary-gold: #c9a96e;       /* 文学金 - 用于成就、完成状态 */
--color-literary-sage: #7a9e7e;       /* 宁静绿 - 用于成功、生长感 */
```

---

## 2. 设计原则

### 原则一：安静的陪伴（Quiet Presence）

**理念**：设计不应抢夺写作的注意力。

```
✓ 正确：加载时使用柔和的打字机效果，不打断思路
✗ 错误：弹出模态框要求确认，打断写作流程
```

**实施要点**：
- 操作反馈使用 subtle 的视觉变化，避免弹窗打断
- 重要操作使用 inline feedback，次要操作使用 toast
- 页面切换使用平滑过渡，而非生硬的跳转

### 原则二：有节奏的反馈（Rhythmic Feedback）

**理念**：交互反馈应有如同阅读般的节奏感。

| 交互类型 | 反馈时机 | 反馈方式 | 持续时间 |
|----------|----------|----------|----------|
| 即时响应 | 0-100ms | 微动画（按钮缩放、颜色变化）| 200ms |
| 短时操作 | 100ms-1s | 加载指示器（打字机点）| 持续到完成 |
| 长时操作 | >1s | 进度指示 + 引导文案 | 持续到完成 |

### 原则三：优雅的引导（Graceful Guidance）

**理念**：空状态和错误状态不是失败，而是引导的机会。

```
场景：用户第一次打开「我的自传」页面，没有任何章节

✗ 错误示范：
   "暂无数据"

✓ 正确示范：
   插图：一支羽毛笔在空白纸上
   标题："您的故事，从这里开始"
   说明："每一部自传都始于第一个章节。让我们一起创建您的第一章吧。"
   操作按钮：[开始创作]
```

---

## 3. 交互反馈规范

### 3.1 按钮反馈

#### 状态定义

| 状态 | 视觉表现 | 使用场景 |
|------|----------|----------|
| Default | 标准样式 | 可交互状态 |
| Hover | 颜色加深 + 轻微阴影提升 | 鼠标悬停 |
| Active/Pressed | 缩放 0.97 + 颜色加深 | 按下瞬间 |
| Focus | 外圈光环（brand-primary 30%）| 键盘导航 |
| Disabled | 透明度 50% + 禁止光标 | 不可交互 |
| Loading | 内容替换为加载指示器 | 异步进行中 |

#### 代码示例

```tsx
// 主按钮 - 带完整状态
<Button
  variant="primary"
  size="md"
  isLoading={isSubmitting}
  loadingText="保存中..."
  onClick={handleSave}
>
  保存章节
</Button>

// 加载态示例
{isSubmitting ? (
  <>
    < LoadingDots /> 保存中...
  </>
) : (
  '保存章节'
)}
```

### 3.2 表单反馈

#### 输入框状态

```
┌─────────────────────────────────────────────────────┐
│ 标签                                                │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 输入内容...                              │ │
│ └─────────────────────────────────────────────────┘ │
│ 辅助文字 / 错误提示                                 │
└─────────────────────────────────────────────────────┘
```

| 状态 | 边框色 | 阴影 | 辅助文字颜色 |
|------|--------|------|--------------|
| Default | border-default | 无 | ink-muted |
| Focus | brand-primary | brand-primary-light 30% | ink-secondary |
| Error | error | error 10% | error |
| Success | success | success 10% | success |

#### 即时验证反馈

```tsx
// 密码强度示例
<Input
  label="设置访问密码"
  value={password}
  onChange={setPassword}
  type="password"
  validation={{
    minLength: 8,
    requireNumber: true,
    requireLetter: true,
  }}
/>

// 验证提示组件
<ValidationHints
  rules={[
    { label: '至少8个字符', met: password.length >= 8 },
    { label: '包含数字', met: /\d/.test(password) },
    { label: '包含字母', met: /[a-zA-Z]/.test(password) },
  ]}
/>
```

### 3.3 Toast 通知

#### 使用场景

- 保存成功的轻量确认
- 网络请求完成的通知
- 可撤销操作的提示

#### Toast 类型

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ 章节已保存                                    [撤销]  [×] │  Success
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ⚠ 网络连接不稳定，内容将在恢复后自动保存                    │  Warning
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ✕ 保存失败，请稍后重试                           [重试]     │  Error
└─────────────────────────────────────────────────────────────┘
```

#### 规范

| 属性 | 规范 |
|------|------|
| 位置 | 页面顶部居中，距顶部 24px |
| 持续时间 | Success: 3s, Warning: 5s, Error: 需手动关闭 |
| 动画 | 从上方滑入，停留，向上滑出 |
| 移动端 | 全宽显示，左右各 16px padding |

### 3.4 确认对话框

#### 使用原则

仅用于不可逆或高风险操作：
- 删除章节/内容
- 清空草稿
- 重置设置
- 退出未保存的编辑

#### 对话框结构

```
┌─────────────────────────────────────────────────────────────┐
│  标题（明确说明操作后果）                                    │
│                                                             │
│  说明文字（解释此操作的影响）                                │
│                                                             │
│  [取消]  [危险操作按钮 - 使用红色或深色]                     │
└─────────────────────────────────────────────────────────────┘
```

```tsx
// 使用示例
<ConfirmDialog
  isOpen={showDeleteConfirm}
  title="删除这一章？"
  description="章节「童年记忆」及其所有内容将被永久删除，此操作不可撤销。"
  confirmText="确认删除"
  confirmVariant="danger"
  cancelText="取消"
  onConfirm={handleDelete}
  onCancel={() => setShowDeleteConfirm(false)}
/>
```

---

## 4. 空状态设计

### 4.1 空状态的类型

| 类型 | 场景 | 设计策略 |
|------|------|----------|
| 首次使用 | 新用户首次进入功能 | 引导式空状态，提供创建入口 |
| 清空 | 用户主动清空所有内容 | 中性空状态，提供恢复选项 |
| 无结果 | 搜索/筛选无匹配 | 解释性空状态，提供修改建议 |
| 无权限 | 内容被设为私密 | 尊重隐私，提供申请访问入口 |

### 4.2 空状态组件结构

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [插图/图标区域]                          │
│                     (柔和、文学感)                           │
│                                                             │
│                      标题文字                               │
│                  (温暖、鼓励性)                              │
│                                                             │
│                    说明文字                                 │
│               (解释原因，提供帮助)                           │
│                                                             │
│                  [主要操作按钮]                              │
│                                                             │
│                  [次要操作链接]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 场景化空状态设计

#### 场景一：初次进入「我的自传」

```tsx
<EmptyState
  illustration="feather-quill"  // 羽毛笔插图
  title="您的故事，从这里开始"
  description="每一部伟大的自传都始于第一个章节。让我们一起创建您的第一章吧。"
  primaryAction={{
    label: '开始创作',
    onClick: handleCreateChapter,
  }}
  secondaryAction={{
    label: '了解如何创作',
    onClick: handleShowGuide,
  }}
/>
```

#### 场景二：对话页面 - 第一次输入

```tsx
// 你的实现已经做得很好，建议增强：
<div className="text-center py-8">
  {/* 现有的欢迎消息 */}
  <p className="text-body text-ink-secondary mb-6">
    让我们从简单的开始...
  </p>
  
  {/* 增加情感化的引导 */}
  <div className="flex flex-col items-center gap-3">
    <span className="text-caption text-ink-faint">
      不知道从哪里开始？试试这些：
    </span>
    {/* SuggestionChips 组件 */}
  </div>
</div>
```

#### 场景三：搜索无结果

```tsx
<EmptyState
  illustration="magnifying-glass"
  title="没有找到相关内容"
  description="尝试使用不同的关键词，或浏览所有章节来寻找您需要的内容。"
  primaryAction={{
    label: '清除搜索',
    onClick: handleClearSearch,
  }}
/>
```

### 4.4 插图风格指南

| 属性 | 规范 |
|------|------|
| 风格 | 手绘线条风、文学主题 |
| 颜色 | 使用品牌色系，避免过于鲜艳 |
| 复杂度 | 简洁明了，避免分散注意力 |
| 尺寸 | 120px - 200px（根据场景调整）|

**推荐插图主题**：
- 羽毛笔与纸张 - 创作相关
- 书本与眼镜 - 阅读/回顾相关
- 树木年轮 - 人生历程
- 温暖的灯光 - 灵感/陪伴感

---

## 5. 错误处理规范

### 5.1 错误分级

| 级别 | 影响范围 | 处理方式 | 示例 |
|------|----------|----------|------|
| L1 - 提示 | 不影响核心功能 | Toast 通知 | "设置已保存" |
| L2 - 警告 | 部分功能受限 | Inline 警告 | "网络不稳定" |
| L3 - 错误 | 操作失败 | Error State + 重试 | "保存失败" |
| L4 - 严重 | 核心功能不可用 | Full Page Error | "无法连接到服务" |

### 5.2 错误提示的文案规范

```
✗ 技术化文案：
   "Error 500: Internal Server Error"

✓ 用户友好文案：
   标题：服务器暂时无法响应
   说明：我们正在努力修复这个问题。您可以稍后重试，或联系支持团队。
   操作：[重试]  [联系支持]

✗ 指责用户文案：
   "输入格式错误"

✓ 建设性文案：
   标题：日期格式需要调整
   说明：请使用 YYYY-MM-DD 格式输入日期，例如 2024-01-15。
```

### 5.3 网络错误处理

```tsx
// 网络错误组件
<ErrorState
  icon="wifi-offline"
  title="网络连接已断开"
  description="请检查您的网络连接。您的内容已自动保存在本地，恢复连接后将自动同步。"
  primaryAction={{
    label: '重试连接',
    onClick: handleRetry,
  }}
  secondaryAction={{
    label: '继续离线编辑',
    onClick: handleContinueOffline,
  }}
  offlineIndicator={true}  // 显示离线状态指示器
/>
```

### 5.4 表单错误处理

```tsx
// 表单级错误
<FormErrorSummary
  title="请修正以下问题："
  errors={[
    { field: 'title', message: '章节标题不能为空' },
    { field: 'content', message: '内容至少需要100个字符' },
  ]}
  onFocusField={handleFocusField}  // 点击跳转到对应字段
/>

// 字段级错误
<div className="form-field">
  <label>章节标题</label>
  <input
    className="input-error"  // 红色边框 + 红色阴影
    value={title}
    onChange={handleTitleChange}
  />
  <span className="field-error">
    <ErrorIcon /> 章节标题不能为空
  </span>
</div>
```

### 5.5 API 错误处理

```typescript
// 统一错误处理服务
class ErrorHandler {
  static handle(error: ApiError): ErrorAction {
    switch (error.code) {
      case 401:
        return {
          type: 'AUTH_ERROR',
          message: '您的登录已过期，请重新登录',
          action: { type: 'REDIRECT', to: '/login' },
        };
      
      case 429:
        return {
          type: 'RATE_LIMIT',
          message: '请求过于频繁，请稍后再试',
          action: { type: 'RETRY', delay: 5000 },
        };
      
      case 500:
        return {
          type: 'SERVER_ERROR',
          message: '服务器暂时不可用',
          description: '您的数据已安全保存，请稍后重试。',
          action: { type: 'RETRY' },
        };
      
      default:
        return {
          type: 'UNKNOWN',
          message: '发生未知错误',
          action: { type: 'RETRY' },
        };
    }
  }
}
```

---

## 6. 动效与过渡规范

### 6.1 动效原则

| 原则 | 说明 | 应用 |
|------|------|------|
| 有意义 | 动效应传达信息 | 加载状态表示「正在处理」 |
| 快速 | 不阻塞用户操作 | 交互反馈 ≤ 200ms |
| 自然 | 符合物理世界规律 | 缓动函数使用 ease-out |
| 克制 | 不过度装饰 | 避免不必要的动效 |

### 6.2 缓动函数

```css
/* 标准缓动 */
--ease-out: cubic-bezier(0.22, 0.61, 0.36, 1);    /* 进入视口 */
--ease-in: cubic-bezier(0.55, 0.06, 0.68, 0.19);   /* 离开视口 */
--ease-in-out: cubic-bezier(0.42, 0, 0.58, 1);     /* 状态切换 */

/* 特殊效果 */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* 弹性效果 */
```

### 6.3 页面过渡

```css
/* 页面淡入 */
@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-transition {
  animation: pageEnter 0.3s var(--ease-out);
}
```

### 6.4 列表动画

```css
/* 新项加入 */
@keyframes listItemEnter {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.list-item {
  animation: listItemEnter 0.25s var(--ease-out);
}

/* 错开动画 */
.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 50ms; }
.list-item:nth-child(3) { animation-delay: 100ms; }
```

### 6.5 微交互规范

#### 按钮按压效果

```css
/* 现有实现 - 保持 */
button:active:not(:disabled) {
  transform: scale(0.97);
  transition-duration: 0.1s;
}
```

#### 开关切换

```css
/* 平滑滑动 */
.toggle-switch {
  transition: background-color 0.2s var(--ease-out);
}

.toggle-knob {
  transition: transform 0.2s var(--ease-spring);
}
```

#### 输入框焦点

```css
/* 焦点光环 */
.input-base:focus {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px var(--color-brand-primary-light);
  transition: all 0.2s var(--ease-out);
}
```

### 6.6 加载状态动效

#### 打字机加载点（已有，优化）

```tsx
// 现有组件 - 保持并扩展使用
<div className="loading-dots">
  <span className="loading-dot" style={{ animationDelay: '0ms' }} />
  <span className="loading-dot" style={{ animationDelay: '200ms' }} />
  <span className="loading-dot" style={{ animationDelay: '400ms' }} />
</div>

// 使用场景
// 1. AI 回复加载中
// 2. 内容生成中
// 3. 自动保存中（subtle 版本）
```

#### 骨架屏

```tsx
// 内容加载占位
<div className="skeleton-container">
  <div className="skeleton-line skeleton-line--title" />
  <div className="skeleton-line skeleton-line--body" />
  <div className="skeleton-line skeleton-line--body" />
  <div className="skeleton-line skeleton-line--body-short" />
</div>

/* 骨架屏动画 */
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.skeleton-line {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-bg-primary) 37%,
    var(--color-bg-secondary) 63%
  );
  background-size: 200px 100%;
  animation: shimmer 1.4s ease infinite;
}
```

---

## 7. 视觉层次规范

### 7.1 字重层次

```css
/* 标题层级 - 现有，保持 */
.text-display-xl { /* 2.5rem, serif, 600 */ }
.text-display-lg { /* 2rem, serif, 600 */ }
.text-display-md { /* 1.5rem, serif, 600 */ }
.text-heading {    /* 1.25rem, serif, 600 */ }
.text-subheading { /* 0.875rem, sans, 600, uppercase */ }

/* 正文层级 */
.text-body {       /* 1rem, sans, 400 */ }
.text-body-serif { /* 1.0625rem, serif, 400 */ }  /* AI 回复专用 */

/* 辅助文字 */
.text-caption {    /* 0.8125rem, sans, 400 */ }
.text-fine-print { /* 0.75rem, sans, 400 */ }
```

### 7.2 颜色语义

| 用途 | 颜色变量 | 使用场景 |
|------|----------|----------|
| 主要操作 | brand-primary | 按钮、链接、强调 |
| 成功状态 | success | 完成、成功提示、在线状态 |
| 警告状态 | warning | 注意、待处理、草稿状态 |
| 错误状态 | error | 错误、删除、危险操作 |
| 信息提示 | info | 提示、说明、引导 |

### 7.3 间距规范

```css
/* 基础间距单位 */
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */

/* 组件内间距 */
--component-padding-sm: 0.75rem;
--component-padding-md: 1rem;
--component-padding-lg: 1.5rem;

/* 页面间距 */
--page-padding-md: 1.5rem;
--page-padding-lg: 2rem;
```

### 7.4 圆角规范

```css
/* 圆角层级 */
--radius-sm: 0.5rem;    /* 8px - 小元素：标签、徽章 */
--radius-md: 0.75rem;   /* 12px - 输入框、按钮 */
--radius-lg: 1rem;      /* 16px - 卡片、模态框 */
--radius-xl: 1.5rem;    /* 24px - 大容器 */
--radius-full: 9999px;  /* 胶囊形：按钮、标签 */

/* 使用示例 */
.btn-primary { border-radius: var(--radius-md); }
.card { border-radius: var(--radius-lg); }
.chat-bubble { border-radius: var(--radius-xl); }
```

---

## 附录：组件清单

### 需要新增的组件

| 组件 | 用途 | 优先级 |
|------|------|--------|
| Toast | 轻量通知 | 高 |
| ConfirmDialog | 操作确认 | 高 |
| EmptyState | 空状态展示 | 高 |
| ErrorState | 错误状态展示 | 高 |
| LoadingDots | 加载指示器 | 高 |
| Skeleton | 骨架屏加载 | 中 |
| ValidationHint | 表单验证提示 | 中 |
| OfflineIndicator | 离线状态指示 | 低 |

### 需要优化的现有组件

| 组件 | 优化内容 |
|------|----------|
| Button | 增加 loading 状态、loadingText 属性 |
| Input | 增加 validation 属性、 ValidationHints |
| Modal | 增加动画过渡、更好的关闭反馈 |
| MessageBubble | 增加复制、引用等操作 |

---

## 执行检查清单

- [ ] 所有交互按钮都有完整的 5 种状态（Default/Hover/Active/Focus/Disabled）
- [ ] 异步操作有加载状态反馈
- [ ] 表单验证有即时、清晰的错误提示
- [ ] 空状态使用引导式设计而非简单的"暂无数据"
- [ ] 网络错误有优雅的降级处理
- [ ] 页面切换有平滑过渡动画
- [ ] Toast 通知在 3-5 秒后自动消失
- [ ] 危险操作有二次确认对话框

---

*本规范基于 YourStory 现有设计系统扩展，面向文学创作者群体，旨在提供沉浸、温暖、值得信赖的写作体验。*
