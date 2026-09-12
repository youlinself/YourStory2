import { Mic, CalendarDays, PenLine, CircleHelp, type LucideIcon } from 'lucide-react'
import { useAgentStore } from '@/stores/agentStore'

const AVAILABLE_SKILLS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: 'deep_interview', label: '深度访谈', icon: Mic },
  { name: 'timeline_organize', label: '时间线整理', icon: CalendarDays },
  { name: 'style_check', label: '风格检查', icon: PenLine },
  { name: 'guided_questioning', label: '引导提问', icon: CircleHelp }
]

export function SkillSwitcher() {
  const { agent, activeSkills, activateSkill, deactivateSkill } = useAgentStore()

  const toggleSkill = async (skillName: string) => {
    if (!agent) return

    if (activeSkills.includes(skillName)) {
      await deactivateSkill(skillName)
    } else {
      await activateSkill(skillName)
    }
  }

  return (
    <div className="flex flex-wrap gap-2 p-3">
      {AVAILABLE_SKILLS.map(skill => {
        const isActive = activeSkills.includes(skill.name)
        const Icon = skill.icon
        return (
          <button
            key={skill.name}
            onClick={() => toggleSkill(skill.name)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-colors ${
              isActive
                ? 'bg-brand-light text-brand border border-brand/30'
                : 'bg-bg-subtle text-ink-muted hover:bg-border-subtle'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{skill.label}</span>
          </button>
        )
      })}
    </div>
  )
}
