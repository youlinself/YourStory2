import { useAgentStore } from '@/stores/agentStore'

const AVAILABLE_SKILLS = [
  { name: 'deep_interview', label: '深度访谈', icon: '🎙️' },
  { name: 'timeline_organize', label: '时间线整理', icon: '📅' },
  { name: 'style_check', label: '风格检查', icon: '✍️' },
  { name: 'guided_questioning', label: '引导提问', icon: '❓' }
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
    <div className="flex gap-2 p-2">
      {AVAILABLE_SKILLS.map(skill => {
        const isActive = activeSkills.includes(skill.name)
        return (
          <button
            key={skill.name}
            onClick={() => toggleSkill(skill.name)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{skill.icon}</span>
            <span>{skill.label}</span>
          </button>
        )
      })}
    </div>
  )
}
