# UI 调整文档

> 检查日期：2006-09-07
> 检查范围：项目全部 UI 组件

---

## 一、间距问题（内容贴合容器、缺乏间距感）

### 1.1 技能选择器 (SkillSwitcher)

| 文件 | 行号 | 当前值 | 问题 |
|------|------|--------|------|
| `src/components/dialogue/SkillSwitcher.tsx` | L24 | `p-2` (8px) | 容器内边距过小 |
| `src/components/dialogue/SkillSwitcher.tsx` | L31 | `px-3 py-1` | 按钮内边距过小 |

**建议修复：**
```tsx
// 容器 padding 增大
<div className="flex flex-wrap gap-2 p-3">
// 按钮 padding 增大
className="flex items-center gap-1.5 px-4 py-1.5 ..."
```

---

### 1.2 命令面板 (CommandPanel)

| 文件 | 行号 | 当前值 | 问题 |
|------|------|--------|------|
| `src/components/dialogue/CommandPanel.tsx` | L80 | `border rounded-lg` | 无 padding |

**建议修复：**
```tsx
<div className="border rounded-lg p-3">
```

---

### 1.3 写作统计卡片

| 文件 | 行号 | 当前值 | 问题 |
|------|------|--------|------|
| `src/styles/dialogue.css` | L825-L827 | `padding: 4px` | `card-p-1` 内边距过小 |

**建议修复：**
```css
.card-p-1 {
  padding: 0.75rem; /* 从 4px 提升到 12px */
}
```

---

### 1.4 章节大纲卡片

| 文件 | 行号 | 当前值 | 问题 |
|------|------|--------|------|
| `src/pages/DialogueAgent/index.tsx` | L418 | `card card-p-1` | 使用了 `card-p-1` |

**建议修复：**
```tsx
<div className="card p-3">
```

---

### 1.5 右侧面板统计行

| 文件 | 行号 | 当前值 | 问题 |
|------|------|--------|------|
| `src/App.css` | L791-L797 | `padding: 0.625rem 0` | 无水平 padding |

**建议修复：**
```css
.stat-row {
  padding: 0.625rem 0.5rem; /* 添加水平 padding */
}
```

---

### 1.6 话题卡片描述区域

| 文件 | 行号 | 当前值 | 问题 |
|------|------|--------|------|
| `src/styles/dialogue.css` | L585-L589 | `font-size: 12px` | 描述文字与上方间距不足 |

**建议修复：**
```css
.topic-description {
  font-size: 12px;
  color: var(--color-ink-muted);
  line-height: 1.5;
  margin-top: 4px; /* 添加上边距 */
}
```

---

## 二、颜色对比度问题（文字不清）

### 2.1 作曲家区域提示

| 文件 | 行号 | 当前值 | 对比度 | 问题 |
|------|------|--------|--------|------|
| `src/styles/dialogue.css` | L768-L771 | `color: var(--color-ink-faint)` (#b0b0b0) | ~2.3:1 | 严重不足 |

**建议修复：**
```css
.composer-hint {
  font-size: 12px;
  color: var(--color-ink-muted); /* 从 #b0b0b0 改为 #8a8a8a */
}
```

---

### 2.2 字数统计

| 文件 | 行号 | 当前值 | 对比度 | 问题 |
|------|------|--------|--------|------|
| `src/styles/dialogue.css` | L785-L789 | `color: var(--color-ink-faint)` (#b0b0b0) | ~2.3:1 | 严重不足 |

**建议修复：**
```css
.char-count {
  font-size: 12px;
  color: var(--color-ink-muted);
}
```

---

### 2.3 CTA 提示文字

| 文件 | 行号 | 当前值 | 对比度 | 问题 |
|------|------|--------|--------|------|
| `src/styles/dialogue.css` | L630-L633 | `color: var(--color-ink-faint)` (#b0b0b0) | ~2.3:1 | 严重不足 |

**建议修复：**
```css
.cta-hint {
  font-size: 12px;
  color: var(--color-ink-muted);
}
```

---

### 2.4 章节大纲状态

| 文件 | 行号 | 当前值 | 对比度 | 问题 |
|------|------|--------|--------|------|
| `src/styles/dialogue.css` | L883-L887 | `color: var(--color-ink-muted)` (#8a8a8a) | ~3.5:1 | 11px 字号偏小 |

**建议修复：**
```css
.outline-item-status {
  font-size: 12px; /* 从 11px 提升到 12px */
  color: var(--color-ink-secondary); /* 从 #8a8a8a 改为 #4a4a4a */
  margin-top: 2px;
}
```

---

### 2.5 技能选择器未激活按钮

| 文件 | 行号 | 当前值 | 问题 |
|------|------|--------|------|
| `src/components/dialogue/SkillSwitcher.tsx` | L33 | `bg-gray-100 text-gray-600` | 与项目设计风格不一致 |

**建议修复：**
```tsx
// 使用项目 CSS 变量替代 Tailwind 默认色
'bg-bg-subtle text-ink-muted hover:bg-border-subtle'
```

---

### 2.6 全局辅助文字对比度提升

建议将所有使用 `var(--color-ink-faint)` 的 12px 以下文字提升为 `var(--color-ink-muted)`。

---

## 三、内容溢出问题

### 3.1 技能选择按钮行（用户反馈示例）

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/components/dialogue/SkillSwitcher.tsx` | L24 | 缺少 `flex-wrap`，按钮可能溢出 |

**建议修复：**
```tsx
<div className="flex flex-wrap gap-2 p-3">
```

---

### 3.2 命令面板命令项

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/components/dialogue/CommandPanel.tsx` | L98-L109 | 长命令名称和描述可能溢出 |

**建议修复：**
```tsx
<div className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 min-w-0">
  <span className="font-mono text-sm font-semibold shrink-0">{cmd.name}</span>
  <span className="text-sm text-gray-500 truncate">{cmd.description}</span>
</div>
```

---

### 3.3 对话聊天气泡

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/styles/dialogue.css` | L416-L437 | 长无空格字符串可能溢出 |

**建议修复：**
```css
.chat-bubble {
  padding: 12px 16px;
  max-width: 75%;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}
```

---

### 3.4 章节大纲项标题

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/styles/dialogue.css` | L873-L877 | 长标题可能溢出 |

**建议修复：**
```css
.outline-item-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

---

### 3.5 话题卡片文字

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/styles/dialogue.css` | L579-L589 | 长话题标题和描述可能溢出 |

**建议修复：**
```css
.topic-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topic-description {
  font-size: 12px;
  color: var(--color-ink-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

---

### 3.6 节点卡片内容

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/styles/dialogue.css` | L2340-L2350 | 缺少标准 fallback |

**建议修复：**
```css
.node-item-content {
  font-size: 12px;
  color: var(--color-ink-secondary);
  font-family: var(--font-serif);
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

---

### 3.7 节点卡片标题

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/styles/dialogue.css` | L2309-L2314 | 长标题可能溢出 |

**建议修复：**
```css
.node-item-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-ink);
  font-family: var(--font-serif);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

---

## 四、修复优先级

| 优先级 | 问题编号 | 原因 |
|--------|----------|------|
| 高 | 3.1 | 用户反馈示例，直接影响功能 |
| 高 | 2.1, 2.2, 2.3 | 对比度严重不足，影响可读性 |
| 高 | 1.1, 1.3 | 间距问题明显，影响视觉体验 |
| 中 | 3.3, 3.4, 3.5 | 溢出问题在特定场景下出现 |
| 中 | 1.2, 1.4, 1.5 | 间距问题轻微 |
| 中 | 2.4, 2.5 | 对比度问题轻微 |
| 低 | 3.2, 3.6, 3.7 | 边界场景问题 |
| 低 | 1.6, 2.6 | 优化性质 |

---

## 五、修改文件清单

| 文件路径 | 修改类型 |
|----------|----------|
| `src/components/dialogue/SkillSwitcher.tsx` | 间距 + 溢出 |
| `src/components/dialogue/CommandPanel.tsx` | 间距 + 溢出 |
| `src/styles/dialogue.css` | 间距 + 对比度 + 溢出 |
| `src/App.css` | 间距 |
| `src/styles/design-tokens.css` | 可选：调整色值变量 |

---

## 六、验收标准

1. **间距**：所有容器内边距至少 8px，子元素之间有明显间距感
2. **对比度**：正文文字对比度 ≥ 4.5:1，辅助文字对比度 ≥ 3:1
3. **溢出**：所有长文本都有适当的截断或换行处理，不会溢出容器
