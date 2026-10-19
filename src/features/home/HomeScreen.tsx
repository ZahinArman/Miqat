import React, { useState } from 'react';
import {
  DailySchedule,
  NextPrayerInfo,
  CurrentPrayerInfo,
  PrayerLog,
  PrayerKey,
  UserLocation,
  PRAYER_DEFINITIONS
} from '../../types';
import { CurrentPrayerCard } from '../../components/CurrentPrayerCard';
import { PrayerRow } from '../../components/PrayerRow';
import { formatHeaderDate, formatPrayerTime } from '../../services/prayerCalculator';

interface HomeScreenProps {
  schedule: DailySchedule | null;
  currentPrayer: CurrentPrayerInfo | null;
  nextPrayer?: NextPrayerInfo | null;
  logs: Record<PrayerKey, PrayerLog>;
  location: UserLocation;
  localDate: string;
  onTogglePrayer: (prayer: PrayerKey) => void;
  onNavigateToSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  schedule,
  currentPrayer,
  nextPrayer,
  logs,
  location,
  localDate,
  onTogglePrayer,
  onNavigateToSettings
}) => {
  const [showSunTimes, setShowSunTimes] = useState(false);

  const formattedHeaderDate = formatHeaderDate(localDate, location.timeZoneId);

  // Count completed
  const completedCount = Object.values(logs).filter((l) => l.completed).length;

  // Format Sunrise & Sunset times
  const formattedSunrise = schedule?.sunrise
    ? formatPrayerTime(schedule.sunrise, location.timeZoneId)
    : '--:--';
  const formattedSunset = schedule?.sunset
    ? formatPrayerTime(schedule.sunset, location.timeZoneId)
    : '--:--';

  return (
    <div className="screen-content">
      {/* Top Date & Greeting */}
      <div className="screen-date-label">{formattedHeaderDate}</div>
      <h1 className="screen-title">Assalamu alaikum</h1>

      {/* Location and Subtle Sun Times Button */}
      <div className="location-sun-bar">
        <button
          type="button"
          className="location-pill-btn"
          onClick={onNavigateToSettings}
          title="Tap to change location in settings"
        >
          <span>{location.name}</span>
          <span className="location-arrow">›</span>
        </button>

        <button
          type="button"
          className={`sun-times-trigger ${showSunTimes ? 'is-active' : ''}`}
          onClick={() => setShowSunTimes((prev) => !prev)}
          aria-expanded={showSunTimes}
          aria-label={showSunTimes ? 'Hide sunrise and sunset times' : 'Show sunrise and sunset times'}
          title="Toggle Sunrise & Sunset times"
        >
          {/* Subtle Sun Icon */}
          <svg className="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M6.34 17.66l-1.41 1.41" />
            <path d="M19.07 4.93l-1.41 1.41" />
          </svg>
          <span>Sun times</span>
          <span className={`sun-chevron ${showSunTimes ? 'open' : ''}`}>▾</span>
        </button>
      </div>

      {/* Smoothly Expandable Sun Times Section */}
      <div
        className={`sun-times-collapsible ${showSunTimes ? 'is-expanded' : ''}`}
        aria-hidden={!showSunTimes}
      >
        <div className="sun-times-overflow">
          <div className="sun-times-card" role="region" aria-label="Sunrise and Sunset Times">
            {/* Sunrise */}
            <div className="sun-time-item">
              <div className="sun-time-icon-label">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v6" />
                  <path d="M4.93 10.93l1.41 1.41" />
                  <path d="M20 18H4" />
                  <path d="M20 14a8 8 0 0 0-16 0" />
                  <polyline points="8 6 12 2 16 6" />
                </svg>
                <span>Sunrise</span>
              </div>
              <span className="sun-time-value tabular-nums">{formattedSunrise}</span>
            </div>

            <div className="sun-time-separator" aria-hidden="true" />

            {/* Sunset */}
            <div className="sun-time-item">
              <div className="sun-time-icon-label">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 10V2" />
                  <path d="M4.93 10.93l1.41 1.41" />
                  <path d="M20 18H4" />
                  <path d="M20 14a8 8 0 0 0-16 0" />
                  <polyline points="16 6 12 10 8 6" />
                </svg>
                <span>Sunset</span>
              </div>
              <span className="sun-time-value tabular-nums">{formattedSunset}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Prayer Hero Card */}
      {currentPrayer && (
        <CurrentPrayerCard
          currentPrayer={currentPrayer}
          isCompleted={
            currentPrayer.key !== 'sunrise'
              ? (logs[currentPrayer.key]?.completed ?? false)
              : false
          }
          onToggleComplete={
            currentPrayer.key !== 'sunrise'
              ? () => onTogglePrayer(currentPrayer.key as PrayerKey)
              : undefined
          }
        />
      )}

      {/* Today's Prayers Section */}
      <section aria-labelledby="today-prayers-heading">
        <div className="section-header-row">
          <h2 id="today-prayers-heading" className="section-title">Today's prayers</h2>
          <span className="section-summary">{completedCount} of 5 completed</span>
        </div>

        <div className="prayers-list" role="list">
          {PRAYER_DEFINITIONS.map((pDef) => {
            const timeItem = schedule?.times[pDef.key];
            const timeString = timeItem
              ? formatPrayerTime(timeItem.effectiveTime, location.timeZoneId)
              : '--:--';
            const isCompleted = logs[pDef.key]?.completed ?? false;
            const isCurrent = currentPrayer?.key === pDef.key;
            const isNext = nextPrayer?.key === pDef.key && !nextPrayer.isNextDay;

            return (
              <PrayerRow
                key={pDef.key}
                prayerKey={pDef.key}
                name={pDef.name}
                arabicName={pDef.arabicName}
                timeString={timeString}
                completed={isCompleted}
                isCurrent={isCurrent}
                isNext={isNext}
                onToggle={() => onTogglePrayer(pDef.key)}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
};
