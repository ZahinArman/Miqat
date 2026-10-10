import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredLocation,
  getAllStoredLocations,
  getPrayerLogsForDate,
  togglePrayerLog,
  clearAllLocalData,
  exportAllLocalData,
  DEFAULT_SETTINGS
} from '../services/storage/db';
import { UserSettings } from '../types';

describe('Storage & IndexedDB Service', () => {
  beforeEach(async () => {
    await clearAllLocalData();
  });

  it('loads initial settings and seeds default locations', async () => {
    const settings = await getStoredSettings();
    expect(settings).toBeDefined();
    expect(settings.theme).toBe('dark');
    expect(settings.locationId).toBe('loc_dhaka');
    expect(settings.calculationMethod).toBe('Karachi');
    expect(settings.asrMethod).toBe('Hanafi');

    const locations = await getAllStoredLocations();
    expect(locations.length).toBeGreaterThan(5);

    const dhaka = await getStoredLocation('loc_dhaka');
    expect(dhaka).toBeDefined();
    expect(dhaka?.name).toContain('Dhaka');
  });

  it('persists and retrieves updated settings', async () => {
    const updated: UserSettings = {
      ...DEFAULT_SETTINGS,
      theme: 'light',
      calculationMethod: 'MuslimWorldLeague',
      asrMethod: 'Standard',
      manualAdjustments: {
        fajr: 2,
        dhuhr: 0,
        asr: -1,
        maghrib: 1,
        isha: 0
      }
    };

    await saveStoredSettings(updated);

    const loaded = await getStoredSettings();
    expect(loaded.theme).toBe('light');
    expect(loaded.calculationMethod).toBe('MuslimWorldLeague');
    expect(loaded.asrMethod).toBe('Standard');
    expect(loaded.manualAdjustments.fajr).toBe(2);
  });

  it('toggles prayer completion without creating duplicate logs', async () => {
    const localDate = '2026-10-10';

    // Initial state: not completed
    const initialLogs = await getPrayerLogsForDate(localDate);
    expect(initialLogs.fajr.completed).toBe(false);

    // Toggle once: completed = true
    const log1 = await togglePrayerLog(localDate, 'fajr');
    expect(log1.completed).toBe(true);
    expect(log1.completedAt).not.toBeNull();

    const afterToggleLogs = await getPrayerLogsForDate(localDate);
    expect(afterToggleLogs.fajr.completed).toBe(true);

    // Toggle again: undo completion
    const log2 = await togglePrayerLog(localDate, 'fajr');
    expect(log2.completed).toBe(false);
    expect(log2.completedAt).toBeNull();

    const finalLogs = await getPrayerLogsForDate(localDate);
    expect(finalLogs.fajr.completed).toBe(false);
  });

  it('exports local data backup in valid JSON format', async () => {
    const localDate = '2026-10-10';
    await togglePrayerLog(localDate, 'dhuhr', true);

    const exportedJson = await exportAllLocalData();
    const parsed = JSON.parse(exportedJson);

    expect(parsed.appName).toBe('Miqat');
    expect(parsed.data.settings).toBeDefined();
    expect(parsed.data.locations).toBeDefined();
    expect(parsed.data.prayerLogs).toBeDefined();
    expect(parsed.data.prayerLogs.some((l: { prayer: string }) => l.prayer === 'dhuhr')).toBe(true);
  });
});
