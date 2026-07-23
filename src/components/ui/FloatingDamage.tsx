import React, { useEffect, useState } from 'react';
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
    if (event.targetId === 'player_block') return { class: 'block', prefix: '-', label: '🛡️' };
    if (event.targetId === 'player_block_gained') return { class: 'block', prefix: '+', label: '🛡️' };
    if (event.targetId === 'player_heal') return { class: 'heal', prefix: '+', label: '💚' };
    if (event.targetId.startsWith('enemy_block_')) return { class: 'block', prefix: '-', label: '🛡️' };
    if (event.isHeal) return { class: 'block', prefix: '+', label: '🛡️' };
    if (event.targetId === 'player') return { class: 'damage', prefix: '-', label: '' };
    return { class: 'damage', prefix: '-', label: '' };
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
            {style.label} {style.prefix}{event.value}
          </div>
        );
      })}
    </div>
  );
};

export default FloatingDamage;
