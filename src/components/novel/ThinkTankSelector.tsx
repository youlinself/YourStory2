import React, { useState, useEffect } from 'react';
import useThinkTankStore from '../../stores/thinkTankStore';
import useAIStore from '../../stores/aiStore';

interface ThinkTankSelectorProps {
  selectedMemberId: string | null;
  onSelect: (memberId: string | null) => void;
  showDefaultOption?: boolean;
}

const ThinkTankSelector: React.FC<ThinkTankSelectorProps> = ({
  selectedMemberId,
  onSelect,
  showDefaultOption = true,
}) => {
  const { members, rolePresets, loadMembers } = useThinkTankStore();
  const { model, customModelName } = useAIStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const enabledMembers = members.filter((m) => m.isEnabled);

  const getRolePreset = (role: string) => {
    return rolePresets.find((p) => p.role === role);
  };

  const selectedMember = selectedMemberId
    ? members.find((m) => m.id === selectedMemberId)
    : null;

  const selectedRolePreset = selectedMember ? getRolePreset(selectedMember.role) : null;

  const handleSelect = (memberId: string | null) => {
    onSelect(memberId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border-subtle bg-bg-base hover:border-brand/50 transition-colors text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedMember ? (
            <>
              <span className="text-lg flex-shrink-0">{selectedRolePreset?.icon || '⚙️'}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink truncate">{selectedMember.name}</div>
                <div className="text-[10px] text-ink-faint truncate">
                  {selectedMember.config.customModelName || selectedMember.config.model}
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="text-lg flex-shrink-0">🤖</span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink">默认AI</div>
                <div className="text-[10px] text-ink-faint truncate">
                  {customModelName || model}
                </div>
              </div>
            </>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-ink-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-subtle rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {showDefaultOption && (
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-bg-subtle transition-colors text-left ${
                selectedMemberId === null ? 'bg-brand/5' : ''
              }`}
              onClick={() => handleSelect(null)}
            >
              <span className="text-lg">🤖</span>
              <div>
                <div className="text-sm font-medium text-ink">默认AI</div>
                <div className="text-[10px] text-ink-faint">使用设置页配置的默认AI</div>
              </div>
              {selectedMemberId === null && (
                <svg className="w-4 h-4 text-brand ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
          )}

          {enabledMembers.length > 0 && (
            <div className="border-t border-border-subtle">
              <div className="px-3 py-1.5 text-[10px] text-ink-faint bg-bg-subtle">
                AI 智囊团
              </div>
              {enabledMembers.map((member) => {
                const preset = getRolePreset(member.role);
                return (
                  <button
                    key={member.id}
                    className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-bg-subtle transition-colors text-left ${
                      selectedMemberId === member.id ? 'bg-brand/5' : ''
                    }`}
                    onClick={() => handleSelect(member.id)}
                  >
                    <span className="text-lg">{preset?.icon || '⚙️'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ink truncate">{member.name}</div>
                      <div className="text-[10px] text-ink-faint truncate">
                        {preset?.name} · {member.config.customModelName || member.config.model}
                      </div>
                    </div>
                    {selectedMemberId === member.id && (
                      <svg className="w-4 h-4 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {enabledMembers.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-ink-faint">暂无可用的AI成员</p>
              <p className="text-[10px] text-ink-faint mt-1">请前往设置页面添加AI智囊团成员</p>
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ThinkTankSelector;
