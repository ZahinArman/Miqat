import React from 'react';
import {
  DailySchedule,
  NextPrayerInfo,
  PrayerLog,
  PrayerKey,
  UserLocation,
  PRAYER_DEFINITIONS
} from '../../types';
import { NextPrayerCard } from '../../components/NextPrayerCard';
import { PrayerRow } from '../../components/PrayerRow';
import { formatHeaderDate, formatPrayerTime } from '../../services/prayerCalculator';

interface HomeScreenProps {
  schedule: DailySchedule | null;
  nextPrayer: NextPrayerInfo | null;
  logs: Record<PrayerKey, PrayerLog>;
  location: UserLocation;
  localDate: string;
  onTogglePrayer: (prayer: PrayerKey) => void;
  onNavigateToSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  schedule,
  nextPrayer,
  logs,
  location,
  localDate,
  onTogglePrayer,
  onNavigateToSettings
}) => {
  const formattedHeaderDate = formatHeaderDate(localDate, location.timeZoneId);

  // Count completed
  const completedCount = Object.values(logs).filter((l) => l.completed).length;

  return (
    <div className="screen-content">
      {/* Top Date & Greeting */}
      <div className="screen-date-label">{formattedHeaderDate}</div>
      <h1 className="screen-title">Assalamu alaikum</h1>
      <button
        type="button"
        className="screen-subtitle"
        onClick={onNavigateToSettings}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', textAlign: 'left' }}
        title="Tap to change location in settings"
      >
        <span>{location.name}</span>
        <span style={{ fontSize: '11px', opacity: 0.7 }}>›</span>
      </button>

      {/* Next Prayer Card */}
      {nextPrayer && <NextPrayerCard nextPrayer={nextPrayer} />}

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
            const isNext = nextPrayer?.key === pDef.key && !nextPrayer.isNextDay;

            return (
              <PrayerRow
                key={pDef.key}
                prayerKey={pDef.key}
                name={pDef.name}
                arabicName={pDef.arabicName}
                timeString={timeString}
                completed={isCompleted}
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
