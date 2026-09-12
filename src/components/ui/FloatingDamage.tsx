import React, { useEffect, useState } from 'react';
import { Shield, HeartPulse } from 'lucide-react';
import { getDamageEvents } from '../../stores/simulationStore';
import type { DamageEvent } from '../../stores/simulationStore';

interface FloatingDamageProps {
  counter: number;
}

const FloatingDamage: React.FC<FloatingDamageProps> = ({ counter }) => {
  const [events, setEvents] = useState<DamageEvent[]>([]);

  useEffect(() => {
    setEvents(getDamageEvents());
  }, [counter]);

  if (events.length === 0) return null;

  const getEventStyle = (event: DamageEvent) => {
    if (event.targetId === 'player_block') return { class: 'block', prefix: '-', icon: <Shield className="h-3 w-3" /> };
    if (event.targetId === 'player_block_gained') return { class: 'block', prefix: '+', icon: <Shield className="h-3 w-3" /> };
    if (event.targetId === 'player_heal') return { class: 'heal', prefix: '+', icon: <HeartPulse className="h-3 w-3" /> };
    if (event.targetId.startsWith('enemy_block_')) return { class: 'block', prefix: '-', icon: <Shield className="h-3 w-3" /> };
    if (event.isHeal) return { class: 'block', prefix: '+', icon: <Shield className="h-3 w-3" /> };
    if (event.targetId === 'player') return { class: 'damage', prefix: '-', icon: null };
    return { class: 'damage', prefix: '-', icon: null };
  };

  const getPosition = (event: DamageEvent) => {
    const isPlayerTarget = event.targetId.startsWith('player');
    return {
      left: isPlayerTarget ? '75%' : `${event.x}%`,
      top: isPlayerTarget ? '60%' : `${event.y}%`,
    };
  };

  return (
    <div className="floating-damage-container">
      {events.map((event) => {
        const style = getEventStyle(event);
        const pos = getPosition(event);
        return (
          <div
            key={event.id}
            className={`floating-damage ${style.class} ${event.targetId.startsWith('player') ? 'player-target' : ''}`}
            style={pos}
          >
            {style.icon} {style.prefix}{event.value}
          </div>
        );
      })}
    </div>
  );
};

export default FloatingDamage;
