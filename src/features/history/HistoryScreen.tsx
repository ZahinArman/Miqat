import React, { useState, useEffect } from 'react';
import {
  UserLocation,
  UserSettings,
  PrayerKey,
  PrayerLog,
  DailySchedule,
  PRAYER_DEFINITIONS
} from '../../types';
import {
  formatFullDate,
  formatPrayerTime
} from '../../services/prayerCalculator';
import {
  getOrCalculateSchedule,
  recordPrayerCompletion,
  getMonthCompletionData
} from '../../services/scheduleService';
import { getPrayerLogsForDate } from '../../services/storage/db';
import { PrayerRow } from '../../components/PrayerRow';

interface HistoryScreenProps {
  location: UserLocation;
  settings: UserSettings;
  todayLocalDate: string;
  onNavigateToHome?: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  location,
  settings,
  todayLocalDate,
  onNavigateToHome
}) => {
  // Current viewed month and year
  const [currentYear, setCurrentYear] = useState<number>(() => {
    const [y] = todayLocalDate.split('-').map(Number);
    return y;
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    const [, m] = todayLocalDate.split('-').map(Number);
    return m; // 1-indexed
  });

  // Selected date is null by default so today's checklist is never duplicated in History
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<DailySchedule | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<Record<PrayerKey, PrayerLog> | null>(null);
  const [monthData, setMonthData] = useState<Map<string, { completedCount: number; totalCount: number }>>(new Map());

  // Month navigation across year boundaries
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Load monthly completion dots
  useEffect(() => {
    const yearMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    let isMounted = true;
    getMonthCompletionData(yearMonth).then((data) => {
      if (isMounted) {
        setMonthData(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentYear, currentMonth]);

  // Load selected date schedule and logs only for past dates
  useEffect(() => {
    if (!selectedDate || selectedDate >= todayLocalDate) {
      setSelectedSchedule(null);
      setSelectedLogs(null);
      return;
    }

    let isMounted = true;
    Promise.all([
      getOrCalculateSchedule(selectedDate, location, settings),
      getPrayerLogsForDate(selectedDate)
    ]).then(([sched, logs]) => {
      if (isMounted) {
        setSelectedSchedule(sched);
        setSelectedLogs(logs);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, todayLocalDate, location, settings]);

  const handleTogglePrayer = async (prayer: PrayerKey) => {
    if (!selectedDate || !selectedLogs) return;
    const currentCompleted = selectedLogs[prayer]?.completed ?? false;
    const updated = await recordPrayerCompletion(selectedDate, prayer, !currentCompleted);

    const nextLogs = {
      ...selectedLogs,
      [prayer]: updated
    };
    setSelectedLogs(nextLogs);

    // Refresh month summary
    const yearMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const refreshedMap = await getMonthCompletionData(yearMonth);
    setMonthData(refreshedMap);
  };

  // Month title: e.g. "October 2026"
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
    new Date(currentYear, currentMonth - 1, 1)
  );

  // Generate calendar grid
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
  const startOffset = (firstDayOfWeek + 6) % 7; // Monday = 0, Sunday = 6

  const totalCompletedThisMonth = Array.from(monthData.values()).reduce(
    (sum, val) => sum + val.completedCount,
    0
  );

  const isSelectedDateToday = selectedDate === todayLocalDate;
  const isSelectedDateFuture = selectedDate !== null && selectedDate > todayLocalDate;
  const isSelectedDatePast = selectedDate !== null && selectedDate < todayLocalDate;

  const selectedCompletedCount = selectedLogs
    ? Object.values(selectedLogs).filter((l) => l.completed).length
    : 0;

  return (
    <div className="screen-content">
      <h1 className="screen-title">History</h1>
      <p className="screen-subtitle">Your personal record, without pressure.</p>

      {/* Calendar Card */}
      <section className="calendar-card" aria-label="Prayer History Calendar">
        <div className="calendar-header">
          <h2 className="calendar-month-title">{monthName} {currentYear}</h2>
          <div className="calendar-nav-buttons">
            <button
              type="button"
              className="cal-nav-btn"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              ‹
            </button>
            <button
              type="button"
              className="cal-nav-btn"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </div>

        {/* Weekday headers: M T W T F S S */}
        <div className="calendar-weekdays" aria-hidden="true">
          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span>F</span>
          <span>S</span>
          <span>S</span>
        </div>

        {/* Calendar days grid */}
        <div className="calendar-grid" role="grid" aria-label={`${monthName} ${currentYear} days`}>
          {/* Empty cells before month starts */}
          {Array.from({ length: startOffset }).map((_, idx) => (
            <div key={`empty-${idx}`} aria-hidden="true" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayLocalDate;
            const isFuture = dateStr > todayLocalDate;
            const completedCount = monthData.get(dateStr)?.completedCount ?? 0;

            return (
              <button
                type="button"
                key={dateStr}
                className={`calendar-day-cell ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}`}
                onClick={() => {
                  // Tapping the same date toggles/unselects it back to monthly overview
                  setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
                }}
                aria-label={`${monthName} ${dayNum}, ${currentYear}${isToday ? ', today' : ''}${!isFuture ? `, ${completedCount} of 5 prayers completed` : ''}${isSelected ? ', selected' : ''}`}
                aria-pressed={isSelected}
              >
                <span>{dayNum}</span>
                {!isFuture && (
                  <span
                    className="day-completion-dot"
                    data-count={completedCount}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Completion Dot Legend */}
        <div className="calendar-legend" aria-label="Prayer completion legend">
          <span className="calendar-legend-label">Prayers:</span>
          <div className="calendar-legend-items" role="list">
            {[0, 1, 2, 3, 4, 5].map((count) => (
              <div key={count} className="calendar-legend-item" role="listitem">
                <span
                  className="calendar-legend-dot"
                  data-count={count}
                  aria-hidden="true"
                />
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 1. Default View: Monthly Summary (No prayers of today duplicated!) */}
      {selectedDate === null && (
        <section className="history-details-card" aria-label="Monthly overview">
          <div style={{ padding: '18px 20px', borderRadius: '16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h2 className="section-title" style={{ fontSize: '16px', marginBottom: '6px' }}>
              {monthName} {currentYear} Overview
            </h2>
            <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-sage-soft)', margin: '4px 0' }}>
              {totalCompletedThisMonth} {totalCompletedThisMonth === 1 ? 'prayer' : 'prayers'} completed
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.5', marginTop: '10px' }}>
              Unrecorded prayers are never labeled as missed. Tap any past date on the calendar above to inspect or adjust historical records. Today's prayers are tracked on the Home tab.
            </p>
          </div>
        </section>
      )}

      {/* 2. Today Selected: Explicit notice redirecting to Home without duplicating prayer rows */}
      {isSelectedDateToday && (
        <section className="history-details-card" aria-label="Today notice">
          <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 className="section-title" style={{ fontSize: '16px' }}>
                {formatFullDate(todayLocalDate, location.timeZoneId)} (Today)
              </h2>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                style={{ fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label="Close"
              >
                ✕ Close
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.4', marginBottom: '16px' }}>
              Today's prayers and active countdown are managed on the Home panel.
            </p>
            {onNavigateToHome && (
              <button
                type="button"
                className="btn-primary"
                onClick={onNavigateToHome}
                style={{ width: 'auto', padding: '0 20px', minHeight: '38px', fontSize: '13px' }}
              >
                Go to Today's Prayers →
              </button>
            )}
          </div>
        </section>
      )}

      {/* 3. Future Date Selected: Gentle notice */}
      {isSelectedDateFuture && selectedDate && (
        <section className="history-details-card" aria-label="Future date notice">
          <div style={{ padding: '18px 20px', borderRadius: '16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 className="section-title" style={{ fontSize: '16px' }}>
                {formatFullDate(selectedDate, location.timeZoneId)}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                style={{ fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label="Close"
              >
                ✕ Close
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              This date is in the future. Prayers have not yet occurred.
            </p>
          </div>
        </section>
      )}

      {/* 4. Past Date Selected: Past History details only */}
      {isSelectedDatePast && selectedDate && (
        <section className="history-details-card" aria-labelledby="history-date-heading">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
            <h2 id="history-date-heading" className="section-title">
              {formatFullDate(selectedDate, location.timeZoneId)}
            </h2>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              style={{ fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
              aria-label="Close and return to monthly summary"
            >
              ✕ Close
            </button>
          </div>
          <p className="screen-subtitle" style={{ marginBottom: '12px' }}>
            {selectedCompletedCount} of 5 prayers recorded as completed
          </p>

          <div className="prayers-list" role="list">
            {PRAYER_DEFINITIONS.map((pDef) => {
              const timeItem = selectedSchedule?.times[pDef.key];
              const timeString = timeItem
                ? formatPrayerTime(timeItem.effectiveTime, location.timeZoneId)
                : '--:--';
              const isCompleted = selectedLogs ? selectedLogs[pDef.key]?.completed ?? false : false;

              return (
                <PrayerRow
                  key={pDef.key}
                  prayerKey={pDef.key}
                  name={pDef.name}
                  arabicName={pDef.arabicName}
                  timeString={timeString}
                  completed={isCompleted}
                  onToggle={() => handleTogglePrayer(pDef.key)}
                />
              );
            })}
          </div>

          <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--color-surface)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <span>Tap any past prayer above to record or correct your log. Unrecorded prayers are never marked as missed.</span>
          </div>
        </section>
      )}
    </div>
  );
};
