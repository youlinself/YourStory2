import React, { useEffect, useState } from 'react';
import useAchievementStore from '../../stores/achievementStore';
import { getRarityColor } from '../../data/achievementData';

interface NotificationItem {
  id: string;
  name: string;
  icon: string;
  rarity: string;
}

const AchievementNotification: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { newAchievements, clearNewAchievements } = useAchievementStore();

  useEffect(() => {
    if (newAchievements.length > 0) {
      const newItems = newAchievements.map((a) => ({
        id: `${a.achievementId}_${a.unlockedAt}`,
        name: a.name,
        icon: a.icon,
        rarity: a.rarity,
      }));

      setNotifications((prev) => [...prev, ...newItems]);

      setTimeout(() => {
        clearNewAchievements();
      }, 100);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => !newItems.find((ni) => ni.id === n.id)));
      }, 4000);
    }
  }, [newAchievements, clearNewAchievements]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notification) => {
        const rarityColor = getRarityColor(notification.rarity);
        return (
          <div
            key={notification.id}
            className="animate-slide-in bg-white rounded-xl shadow-lg border-l-4 p-3 flex items-center gap-3 min-w-[280px]"
            style={{ borderLeftColor: rarityColor }}
          >
            <div className="text-2xl">{notification.icon}</div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider font-medium" style={{ color: rarityColor }}>
                成就解锁
              </div>
              <div className="text-sm font-semibold text-ink">{notification.name}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AchievementNotification;
