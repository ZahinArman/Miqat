import React from 'react';
import { NextPrayerInfo } from '../types';
import { formatCountdown } from '../services/prayerCalculator';

interface NextPrayerCardProps {
  nextPrayer: NextPrayerInfo;
}

export const NextPrayerCard: React.FC<NextPrayerCardProps> = ({ nextPrayer }) => {
  const countdownText = formatCountdown(nextPrayer.hours, nextPrayer.minutes, nextPrayer.seconds);

  return (
    <section className="next-prayer-card" aria-label="Next Prayer Information">
      <span className="next-prayer-label">NEXT PRAYER</span>
      <h2 className="next-prayer-name">{nextPrayer.name}</h2>
      <div className="next-prayer-countdown tabular-nums" aria-live="polite" aria-atomic="true">
        {countdownText}
      </div>
      <p className="next-prayer-time-info">
        {nextPrayer.isNextDay ? 'Begins tomorrow at ' : 'Begins at '}
        {nextPrayer.timeString}
      </p>

      {/* Progress track */}
      <div className="progress-track" role="progressbar" aria-valuenow={Math.round(nextPrayer.progressPercent)} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="progress-fill"
          style={{ width: `${Math.max(2, Math.min(100, nextPrayer.progressPercent))}%` }}
        />
      </div>
    </section>
  );
};
