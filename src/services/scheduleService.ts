import {
  UserSettings,
  UserLocation,
  DailySchedule,
  PrayerLog,
  PrayerKey,
  NextPrayerInfo,
  CurrentPrayerInfo
} from '../types';
import {
  calculateDailySchedule,
  getNextPrayerInfo,
  getCurrentPrayerInfo,
  getTomorrowLocalDateString
} from './prayerCalculator';
import {
  getStoredSchedule,
  saveStoredSchedule,
  getPrayerLogsForDate,
  togglePrayerLog,
  getAllPrayerLogs
} from './storage/db';

export async function getOrCalculateSchedule(
  localDate: string,
  location: UserLocation,
  settings: UserSettings
): Promise<DailySchedule> {
  const existing = await getStoredSchedule(localDate, location.id);

  // Check if existing schedule matches current settings
  if (
    existing &&
    existing.calculationMethod === settings.calculationMethod &&
    existing.asrMethod === settings.asrMethod &&
    existing.sunrise // ensure sunrise/sunset are present (added in a later version)
  ) {
    // Check if adjustments match
    let adjustmentsMatch = true;
    for (const key of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerKey[]) {
      if (existing.times[key]?.adjustmentMinutes !== (settings.manualAdjustments[key] ?? 0)) {
        adjustmentsMatch = false;
        break;
      }
    }
    if (adjustmentsMatch) {
      return existing;
    }
  }

  // Calculate fresh schedule
  const fresh = calculateDailySchedule(
    localDate,
    location,
    settings.calculationMethod,
    settings.asrMethod,
    settings.manualAdjustments
  );

  await saveStoredSchedule(fresh);
  return fresh;
}

export async function loadDayData(
  localDate: string,
  location: UserLocation,
  settings: UserSettings
): Promise<{
  schedule: DailySchedule;
  tomorrowSchedule: DailySchedule;
  logs: Record<PrayerKey, PrayerLog>;
  nextPrayer: NextPrayerInfo;
  currentPrayer: CurrentPrayerInfo;
}> {
  const tomorrowLocalDate = getTomorrowLocalDateString(new Date(), location.timeZoneId);

  const [schedule, tomorrowSchedule, logs] = await Promise.all([
    getOrCalculateSchedule(localDate, location, settings),
    getOrCalculateSchedule(tomorrowLocalDate, location, settings),
    getPrayerLogsForDate(localDate)
  ]);

  const now = new Date();
  const nextPrayer = getNextPrayerInfo(schedule, tomorrowSchedule, now, location.timeZoneId);
  const currentPrayer = getCurrentPrayerInfo(schedule, tomorrowSchedule, now, location.timeZoneId);

  return {
    schedule,
    tomorrowSchedule,
    logs,
    nextPrayer,
    currentPrayer
  };
}

export async function recordPrayerCompletion(
  localDate: string,
  prayer: PrayerKey,
  completed?: boolean
): Promise<PrayerLog> {
  return await togglePrayerLog(localDate, prayer, completed);
}

export async function getMonthCompletionData(yearMonth: string): Promise<Map<string, { completedCount: number; totalCount: number }>> {
  const allLogs = await getAllPrayerLogs();
  const resultMap = new Map<string, { completedCount: number; totalCount: number }>();

  for (const log of allLogs) {
    if (log.localDate.startsWith(yearMonth) && log.completed) {
      const current = resultMap.get(log.localDate) || { completedCount: 0, totalCount: 5 };
      current.completedCount += 1;
      resultMap.set(log.localDate, current);
    }
  }

  return resultMap;
}
