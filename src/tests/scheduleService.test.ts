import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getOrCalculateSchedule,
  recordPrayerCompletion,
  getMonthCompletionData,
  loadDayData
} from '../services/scheduleService';
import { clearAllLocalData, DEFAULT_SETTINGS, DEFAULT_LOCATIONS } from '../services/storage/db';
import { UserLocation, UserSettings } from '../types';

describe('Schedule Orchestration & History Service', () => {
  const dhaka = DEFAULT_LOCATIONS[0];

  beforeEach(async () => {
    await clearAllLocalData();
  });

  it('recalculates and persists when calculation method changes', async () => {
    const date = '2026-10-10';
    const initialSchedule = await getOrCalculateSchedule(date, dhaka, DEFAULT_SETTINGS);
    expect(initialSchedule.calculationMethod).toBe('Karachi');

    const mwlSettings: UserSettings = {
      ...DEFAULT_SETTINGS,
      calculationMethod: 'MuslimWorldLeague'
    };

    const newSchedule = await getOrCalculateSchedule(date, dhaka, mwlSettings);
    expect(newSchedule.calculationMethod).toBe('MuslimWorldLeague');
    expect(newSchedule.id).toBe(initialSchedule.id);
  });

  it('recalculates when Asr juristic method changes', async () => {
    const date = '2026-10-10';
    const hanafiSchedule = await getOrCalculateSchedule(date, dhaka, DEFAULT_SETTINGS);

    const standardSettings: UserSettings = {
      ...DEFAULT_SETTINGS,
      asrMethod: 'Standard'
    };

    const standardSchedule = await getOrCalculateSchedule(date, dhaka, standardSettings);
    expect(standardSchedule.asrMethod).toBe('Standard');

    const hanafiAsr = new Date(hanafiSchedule.times.asr.effectiveTime).getTime();
    const standardAsr = new Date(standardSchedule.times.asr.effectiveTime).getTime();
    expect(hanafiAsr).toBeGreaterThan(standardAsr);
  });

  it('recalculates when location changes', async () => {
    const date = '2026-10-10';
    const london: UserLocation = DEFAULT_LOCATIONS.find((l) => l.id === 'loc_london')!;

    const dhakaSchedule = await getOrCalculateSchedule(date, dhaka, DEFAULT_SETTINGS);
    const londonSchedule = await getOrCalculateSchedule(date, london, DEFAULT_SETTINGS);

    expect(dhakaSchedule.locationId).toBe('loc_dhaka');
    expect(londonSchedule.locationId).toBe('loc_london');
    expect(dhakaSchedule.id).not.toBe(londonSchedule.id);
  });

  it('loads comprehensive day data including today, tomorrow, and next prayer countdown', async () => {
    const date = '2026-10-10';
    const data = await loadDayData(date, dhaka, DEFAULT_SETTINGS);

    expect(data.schedule).toBeDefined();
    expect(data.tomorrowSchedule).toBeDefined();
    expect(data.logs).toBeDefined();
    expect(data.nextPrayer).toBeDefined();
    expect(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']).toContain(data.nextPrayer.key);
  });

  it('aggregates monthly completion counts without marking unrecorded days as missed', async () => {
    // Record prayers for two different dates in October 2026
    await recordPrayerCompletion('2026-10-05', 'fajr', true);
    await recordPrayerCompletion('2026-10-05', 'dhuhr', true);
    await recordPrayerCompletion('2026-10-10', 'maghrib', true);

    const monthData = await getMonthCompletionData('2026-10');

    expect(monthData.get('2026-10-05')?.completedCount).toBe(2);
    expect(monthData.get('2026-10-10')?.completedCount).toBe(1);

    // Days with no logs are undefined in monthData map, preserving "not recorded" distinction
    expect(monthData.get('2026-10-06')).toBeUndefined();
    expect(monthData.get('2026-10-07')).toBeUndefined();
  });
});
