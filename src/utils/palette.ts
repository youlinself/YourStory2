/**
 * 统一分类调色板（唯一事实源）
 *
 * 用途：标签、角色、情节线、灵感卡等需要「多色区分」的数据着色。
 * 设计约定（HIG Clarity）：
 *  - 数据分类色允许脱离品牌色相，但必须集中在此处定义，组件中禁止出现颜色字面量；
 *  - 所有色值需在明/暗两种模式下保证可读性（500 档饱和度）；
 *  - 需要新颜色时先在此登记，再使用。
 */
import {
  FilePen, User, Globe, MessageSquare, Sparkles, Lightbulb, ClipboardList,
  Settings, Bot, type LucideIcon,
} from 'lucide-react';

/** 通用分类色板（按顺序循环取用，保证相邻项区分度） */
export const CATEGORICAL_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#0ea5e9', // sky
] as const;

/** 按字符串种子稳定取色（同名标签/角色始终同色） */
export const getCategoryColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return CATEGORICAL_COLORS[Math.abs(hash) % CATEGORICAL_COLORS.length];
};

/** 具名色引用（供各领域语义映射复用，避免字面量） */
export const DATA_COLORS = {
  blue: '#3b82f6',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  violet: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
  orange: '#f97316',
  indigo: '#6366f1',
  lime: '#84cc16',
  cyan: '#06b6d4',
  rose: '#f43f5e',
  sky: '#0ea5e9',
  slate: '#94a3b8',
  slateDark: '#64748b',
  redDeep: '#dc2626',
  redLight: '#f87171',
  redDark: '#991b1b',
  orangeDeep: '#ea580c',
  orangeBright: '#fb923c',
  greenBright: '#4ade80',
  greenDeep: '#16a34a',
  purple: '#a855f7',
  gray: '#6b7280',
  gold: '#fbbf24',
  blueBright: '#60a5fa',
  emeraldBright: '#34d399',
  slateLight: '#9ca3af',
} as const;

/** 血条/进度条分段色（游戏化组件共用） */
export const HP_BAR_COLORS = {
  high: `linear-gradient(to right, ${DATA_COLORS.redDeep}, ${DATA_COLORS.redLight})`,
  mid: `linear-gradient(to right, ${DATA_COLORS.orangeDeep}, ${DATA_COLORS.orangeBright})`,
  low: `linear-gradient(to right, ${DATA_COLORS.redDark}, ${DATA_COLORS.redDeep})`,
  success: `linear-gradient(to right, ${DATA_COLORS.greenDeep}, ${DATA_COLORS.greenBright})`,
} as const;

/** 模拟人生：玩家属性色（与 design-tokens 的游戏域语义色保持区分度） */
export const ATTRIBUTE_COLORS: Record<string, string> = {
  energy: DATA_COLORS.amber,
  physique: DATA_COLORS.red,
  health: DATA_COLORS.emerald,
  iq: DATA_COLORS.blue,
  eq: DATA_COLORS.violet,
  wealth: DATA_COLORS.orange,
  network: DATA_COLORS.cyan,
  fame: DATA_COLORS.pink,
} as const;

/** 模拟人生：卡牌类型色（power 对应 design-tokens 的 --color-power） */
export const CARD_TYPE_COLORS: Record<string, { border: string; label: string; bg: string; glow: string }> = {
  attack: { border: 'rgba(209, 36, 47, 0.15)', label: 'text-danger', bg: 'rgba(209, 36, 47, 0.08)', glow: 'hover:border-danger/30' },
  skill: { border: 'rgba(45, 123, 185, 0.15)', label: 'text-info', bg: 'rgba(45, 123, 185, 0.08)', glow: 'hover:border-info/30' },
  power: { border: 'rgba(168, 85, 247, 0.15)', label: 'text-power', bg: 'rgba(168, 85, 247, 0.08)', glow: 'hover:border-power/30' },
  default: { border: 'rgba(201, 169, 110, 0.2)', label: 'text-gold', bg: 'rgba(201, 169, 110, 0.08)', glow: 'hover:border-gold/30' },
} as const;

/** 成就稀有度色 */
export const RARITY_COLORS: Record<string, string> = {
  common: DATA_COLORS.gray,
  rare: DATA_COLORS.blue,
  epic: DATA_COLORS.violet,
  legendary: DATA_COLORS.amber,
} as const;

/** 羁绊卡牌稀有度配置 */
export const BOND_RARITY_CONFIG: Record<string, { label: string; color: string; bgColor: string; glowColor: string }> = {
  common: {
    label: '普通',
    color: DATA_COLORS.slateLight,
    bgColor: 'rgba(156, 163, 175, 0.15)',
    glowColor: 'rgba(156, 163, 175, 0.3)',
  },
  uncommon: {
    label: '稀有',
    color: DATA_COLORS.emeraldBright,
    bgColor: 'rgba(52, 211, 153, 0.15)',
    glowColor: 'rgba(52, 211, 153, 0.3)',
  },
  rare: {
    label: '珍贵',
    color: DATA_COLORS.blueBright,
    bgColor: 'rgba(96, 165, 250, 0.15)',
    glowColor: 'rgba(96, 165, 250, 0.3)',
  },
  legendary: {
    label: '传说',
    color: DATA_COLORS.gold,
    bgColor: 'rgba(251, 191, 36, 0.15)',
    glowColor: 'rgba(251, 191, 36, 0.4)',
  },
} as const;

/** 人物弧光节点色 */
export const ARC_NODE_COLORS: Record<string, string> = {
  turning_point: DATA_COLORS.amber,
  growth: DATA_COLORS.emerald,
  setback: DATA_COLORS.red,
  revelation: DATA_COLORS.violet,
  decision: DATA_COLORS.blue,
  climax: DATA_COLORS.pink,
  resolution: DATA_COLORS.teal,
} as const;

/**
 * AI 成员角色色（OfficeCanvas）。
 * 前四项与 design-tokens.css 的 brand/info/sage/gold 保持同步；
 * 组件会以 `${color}15` 方式拼接透明度，因此必须使用 hex 字面量而非 var()。
 */
export const AGENT_ROLE_COLORS: Record<string, string> = {
  plot_writer: '#da7756',
  character_designer: '#2d7bb9',
  world_builder: '#7a9e7e',
  dialogue_specialist: '#c9a96e',
  style_polisher: '#9b59b6',
  creative_consultant: '#e67e22',
  custom: '#95a5a6',
} as const;

/**
 * AI 成员角色图标（UI 渲染用）。
 * 注意：角色预设数据里的 emoji 字段会注入 AI 提示词，属数据载荷，不在此替换。
 */
export const AGENT_ROLE_ICONS: Record<string, LucideIcon> = {
  plot_writer: FilePen,
  character_designer: User,
  world_builder: Globe,
  dialogue_specialist: MessageSquare,
  style_polisher: Sparkles,
  creative_consultant: Lightbulb,
  secretary_assistant: ClipboardList,
  custom: Settings,
};

/** AI 成员角色默认图标（未知角色） */
export const AGENT_ROLE_DEFAULT_ICON: LucideIcon = Bot;
