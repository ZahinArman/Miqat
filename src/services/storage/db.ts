import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { UserSettings, UserLocation, DailySchedule, PrayerTimeItem, PrayerLog, PrayerKey } from '../../types';

export const DEFAULT_LOCATIONS: UserLocation[] = [
  {
    id: 'loc_dhaka',
    name: 'Dhaka, Bangladesh',
    latitude: 23.8103,
    longitude: 90.4125,
    timeZoneId: 'Asia/Dhaka',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'loc_chittagong',
    name: 'Chittagong, Bangladesh',
    latitude: 22.3569,
    longitude: 91.7832,
    timeZoneId: 'Asia/Dhaka',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'loc_sylhet',
    name: 'Sylhet, Bangladesh',
    latitude: 24.8949,
    longitude: 91.8687,
    timeZoneId: 'Asia/Dhaka',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'loc_makkah',
    name: 'Mecca, Saudi Arabia',
    latitude: 21.4225,
    longitude: 39.8262,
    timeZoneId: 'Asia/Riyadh',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'loc_madinah',
    name: 'Medina, Saudi Arabia',
    latitude: 24.5247,
    longitude: 39.5692,
    timeZoneId: 'Asia/Riyadh',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'loc_london',
    name: 'London, United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    timeZoneId: 'Europe/London',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'loc_new_york',
    name: 'New York, United States',
    latitude: 40.7128,
    longitude: -74.0060,
    timeZoneId: 'America/New_York',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'loc_toronto',
    name: 'Toronto, Canada',
    latitude: 43.6532,
    longitude: -79.3832,
    timeZoneId: 'America/Toronto',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'loc_istanbul',
    name: 'Istanbul, Turkey',
    latitude: 41.0082,
    longitude: 28.9784,
    timeZoneId: 'Europe/Istanbul',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'loc_cairo',
    name: 'Cairo, Egypt',
    latitude: 30.0444,
    longitude: 31.2357,
    timeZoneId: 'Africa/Cairo',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'loc_dubai',
    name: 'Dubai, UAE',
    latitude: 25.2048,
    longitude: 55.2708,
    timeZoneId: 'Asia/Dubai',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'loc_kuala_lumpur',
    name: 'Kuala Lumpur, Malaysia',
    latitude: 3.1390,
    longitude: 101.6869,
    timeZoneId: 'Asia/Kuala_Lumpur',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const DEFAULT_SETTINGS: UserSettings = {
  id: 'current_user_settings',
  theme: 'dark',
  locationId: 'loc_dhaka',
  calculationMethod: 'Karachi',
  asrMethod: 'Hanafi',
  manualAdjustments: {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0
  },
  updatedAt: new Date().toISOString()
};

export interface MiqatDB extends DBSchema {
  settings: {
    key: string;
    value: UserSettings;
  };
  locations: {
    key: string;
    value: UserLocation;
  };
  prayerSchedules: {
    key: string;
    value: DailySchedule;
    indexes: {
      byLocalDate: string;
      byLocationId: string;
    };
  };
  prayerTimes: {
    key: string;
    value: PrayerTimeItem;
    indexes: {
      byScheduleId: string;
      byPrayer: string;
    };
  };
  prayerLogs: {
    key: string;
    value: PrayerLog;
    indexes: {
      byLocalDate: string;
      byPrayer: string;
    };
  };
}

const DB_NAME = 'miqat-local-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MiqatDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<MiqatDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MiqatDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          // settings
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' });
          }

          // locations
          if (!db.objectStoreNames.contains('locations')) {
            db.createObjectStore('locations', { keyPath: 'id' });
          }

          // prayer schedules
          if (!db.objectStoreNames.contains('prayerSchedules')) {
            const scheduleStore = db.createObjectStore('prayerSchedules', { keyPath: 'id' });
            scheduleStore.createIndex('byLocalDate', 'localDate');
            scheduleStore.createIndex('byLocationId', 'locationId');
          }

          // individual prayer times
          if (!db.objectStoreNames.contains('prayerTimes')) {
            const timesStore = db.createObjectStore('prayerTimes', { keyPath: 'id' });
            timesStore.createIndex('byScheduleId', 'scheduleId');
            timesStore.createIndex('byPrayer', 'prayer');
          }

          // prayer logs
          if (!db.objectStoreNames.contains('prayerLogs')) {
            const logsStore = db.createObjectStore('prayerLogs', { keyPath: 'id' });
            logsStore.createIndex('byLocalDate', 'localDate');
            logsStore.createIndex('byPrayer', 'prayer');
          }
        }
      }
    });
  }
  return dbPromise;
}

// Settings
export async function getStoredSettings(): Promise<UserSettings> {
  const db = await getDB();
  const settings = await db.get('settings', DEFAULT_SETTINGS.id);
  if (!settings) {
    await db.put('settings', DEFAULT_SETTINGS);
    // seed default locations
    for (const loc of DEFAULT_LOCATIONS) {
      await db.put('locations', loc);
    }
    return DEFAULT_SETTINGS;
  }
  return settings;
}

export async function saveStoredSettings(settings: UserSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', {
    ...settings,
    updatedAt: new Date().toISOString()
  });
}

// Locations
export async function getStoredLocation(id: string): Promise<UserLocation | undefined> {
  const db = await getDB();
  let loc = await db.get('locations', id);
  if (!loc) {
    // Check fallback in defaults
    loc = DEFAULT_LOCATIONS.find((l) => l.id === id);
    if (loc) {
      await db.put('locations', loc);
    }
  }
  return loc;
}

export async function getAllStoredLocations(): Promise<UserLocation[]> {
  const db = await getDB();
  const locations = await db.getAll('locations');
  if (locations.length === 0) {
    for (const loc of DEFAULT_LOCATIONS) {
      await db.put('locations', loc);
    }
    return DEFAULT_LOCATIONS;
  }
  return locations;
}

export async function saveStoredLocation(location: UserLocation): Promise<void> {
  const db = await getDB();
  await db.put('locations', location);
}

// Prayer Schedules & Times
export async function getStoredSchedule(localDate: string, locationId: string): Promise<DailySchedule | undefined> {
  const db = await getDB();
  const id = `${locationId}_${localDate}`;
  return await db.get('prayerSchedules', id);
}

export async function saveStoredSchedule(schedule: DailySchedule): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['prayerSchedules', 'prayerTimes'], 'readwrite');
  await tx.objectStore('prayerSchedules').put(schedule);
  for (const timeItem of Object.values(schedule.times)) {
    await tx.objectStore('prayerTimes').put(timeItem);
  }
  await tx.done;
}

// Prayer Logs
export async function getPrayerLogsForDate(localDate: string): Promise<Record<PrayerKey, PrayerLog>> {
  const db = await getDB();
  const logs = await db.getAllFromIndex('prayerLogs', 'byLocalDate', localDate);
  const result: Record<PrayerKey, PrayerLog> = {
    fajr: { id: `${localDate}_fajr`, localDate, prayer: 'fajr', completed: false, completedAt: null },
    dhuhr: { id: `${localDate}_dhuhr`, localDate, prayer: 'dhuhr', completed: false, completedAt: null },
    asr: { id: `${localDate}_asr`, localDate, prayer: 'asr', completed: false, completedAt: null },
    maghrib: { id: `${localDate}_maghrib`, localDate, prayer: 'maghrib', completed: false, completedAt: null },
    isha: { id: `${localDate}_isha`, localDate, prayer: 'isha', completed: false, completedAt: null }
  };

  for (const log of logs) {
    if (result[log.prayer]) {
      result[log.prayer] = log;
    }
  }

  return result;
}

export async function getAllPrayerLogs(): Promise<PrayerLog[]> {
  const db = await getDB();
  return await db.getAll('prayerLogs');
}

export async function togglePrayerLog(localDate: string, prayer: PrayerKey, targetCompleted?: boolean): Promise<PrayerLog> {
  const db = await getDB();
  const id = `${localDate}_${prayer}`;
  const existing = await db.get('prayerLogs', id);

  const nextCompleted = targetCompleted !== undefined 
    ? targetCompleted 
    : !(existing?.completed ?? false);

  const updatedLog: PrayerLog = {
    id,
    localDate,
    prayer,
    completed: nextCompleted,
    completedAt: nextCompleted ? new Date().toISOString() : null
  };

  await db.put('prayerLogs', updatedLog);
  return updatedLog;
}

// Clear all local data
export async function clearAllLocalData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['settings', 'locations', 'prayerSchedules', 'prayerTimes', 'prayerLogs'], 'readwrite');
  await tx.objectStore('settings').clear();
  await tx.objectStore('locations').clear();
  await tx.objectStore('prayerSchedules').clear();
  await tx.objectStore('prayerTimes').clear();
  await tx.objectStore('prayerLogs').clear();

  // reseed defaults within the same active transaction
  await tx.objectStore('settings').put(DEFAULT_SETTINGS);
  for (const loc of DEFAULT_LOCATIONS) {
    await tx.objectStore('locations').put(loc);
  }
  await tx.done;
}

// Export local data
export async function exportAllLocalData(): Promise<string> {
  const db = await getDB();
  const settings = await db.getAll('settings');
  const locations = await db.getAll('locations');
  const schedules = await db.getAll('prayerSchedules');
  const logs = await db.getAll('prayerLogs');

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    version: DB_VERSION,
    appName: 'Miqat',
    data: {
      settings,
      locations,
      schedules,
      prayerLogs: logs
    }
  };

  return JSON.stringify(exportPayload, null, 2);
}
