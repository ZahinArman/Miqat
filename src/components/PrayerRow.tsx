import React from 'react';
import { PrayerKey } from '../types';

interface PrayerRowProps {
  prayerKey: PrayerKey;
  name: string;
  arabicName?: string;
  timeString: string;
  completed: boolean;
  isNext?: boolean;
  onToggle: () => void;
}

export const PrayerRow: React.FC<PrayerRowProps> = ({
  name,
  arabicName,
  timeString,
  completed,
  isNext = false,
  onToggle
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`prayer-row ${isNext ? 'is-next' : ''} ${completed ? 'is-completed' : ''}`}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      aria-label={`${name} prayer at ${timeString}. ${completed ? 'Marked as completed. Tap to undo.' : 'Not completed. Tap to mark as completed.'}`}
      aria-pressed={completed}
    >
      <div className="prayer-check-btn" aria-hidden="true">
        <div
          className={`check-circle ${completed ? 'completed' : ''} ${isNext && !completed ? 'next-highlight' : ''}`}
        >
          {completed && (
            <svg className="check-icon" width="12" height="12" viewBox="0 0 12 12">
              <path d="M2.5 6.5 L5 9 L9.5 3" />
            </svg>
          )}
        </div>
      </div>

      <div className="prayer-name-container">
        <span className="prayer-row-name">{name}</span>
        {arabicName && <span className="prayer-arabic-subtle">{arabicName}</span>}
      </div>

      <span className="prayer-row-time tabular-nums">{timeString}</span>

      {isNext && <span className="next-pill">NEXT</span>}
    </div>
  );
};
