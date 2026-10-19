import React from 'react';
import { CurrentPrayerInfo } from '../types';
import { formatCountdown } from '../services/prayerCalculator';

interface CurrentPrayerCardProps {
  currentPrayer: CurrentPrayerInfo;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
}

export const CurrentPrayerCard: React.FC<CurrentPrayerCardProps> = ({
  currentPrayer,
  isCompleted = false,
  onToggleComplete
}) => {
  const countdownText = formatCountdown(
    currentPrayer.hours,
    currentPrayer.minutes,
    currentPrayer.seconds
  );

  return (
    <section className="current-prayer-card" aria-label="Current Prayer Information">
      {/* Top Header Row with Status Toggle */}
      <div className="current-prayer-header">
        <span className="current-prayer-label">
          {currentPrayer.isNonPrayerInterval ? 'BETWEEN PRAYERS' : 'CURRENT PRAYER'}
        </span>

        {!currentPrayer.isNonPrayerInterval && onToggleComplete && (
          <button
            type="button"
            className={`current-prayer-status-btn ${isCompleted ? 'is-completed' : ''}`}
            onClick={onToggleComplete}
            aria-pressed={isCompleted}
            aria-label={
              isCompleted
                ? `${currentPrayer.name} marked as completed. Tap to unmark.`
                : `Mark ${currentPrayer.name} as completed.`
            }
          >
            {isCompleted ? (
              <>
                <svg className="status-check-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 6.5 L5 9 L9.5 3" />
                </svg>
                <span>Completed</span>
              </>
            ) : (
              <span>Mark as prayed</span>
            )}
          </button>
        )}

        {currentPrayer.isNonPrayerInterval && (
          <span className="current-prayer-status-badge">Morning / Duha</span>
        )}
      </div>

      {/* Prayer Title & Arabic Calligraphy */}
      <div className="current-prayer-title-row">
        <h2 className="current-prayer-name">{currentPrayer.name}</h2>
        {currentPrayer.arabicName && (
          <span className="current-prayer-arabic" aria-hidden="true">
            {currentPrayer.arabicName}
          </span>
        )}
      </div>

      {/* Countdown Timer */}
      <div className="current-prayer-countdown-wrap">
        <span className="countdown-prefix">
          {currentPrayer.isNonPrayerInterval ? 'Starts in ' : 'Ends in '}
        </span>
        <span className="current-prayer-countdown tabular-nums" aria-live="polite" aria-atomic="true">
          {countdownText}
        </span>
      </div>

      {/* Time Window Details */}
      <p className="current-prayer-time-info">
        {currentPrayer.isNonPrayerInterval ? (
          <>
            Sunrise window ends at {currentPrayer.endTimeString} · Next is{' '}
            <strong>{currentPrayer.nextPrayerName}</strong>
          </>
        ) : (
          <>
            Window: {currentPrayer.timeString} – {currentPrayer.endTimeString}
          </>
        )}
      </p>

      {/* Progress Track */}
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={Math.round(currentPrayer.progressPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Current prayer window progress"
      >
        <div
          className="progress-fill"
          style={{ width: `${Math.max(2, Math.min(100, currentPrayer.progressPercent))}%` }}
        />
      </div>

      {/* Next Prayer Preview Line */}
      {!currentPrayer.isNonPrayerInterval && (
        <div className="current-prayer-next-preview">
          <span>
            Next: <strong>{currentPrayer.nextPrayerName}</strong> at {currentPrayer.nextPrayerTime}
          </span>
        </div>
      )}
    </section>
  );
};
