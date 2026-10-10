import {
  Coordinates,
  CalculationMethod,
  CalculationParameters,
  Madhab,
  HighLatitudeRule,
  PrayerTimes
} from 'adhan';
import {
  PrayerKey,
  UserLocation,
  DailySchedule,
  PrayerTimeItem,
  ManualAdjustments,
  AsrMethod,
  NextPrayerInfo
} from '../types';

export interface MethodInfo {
  id: string;
  name: string;
  description: string;
}

export const CALCULATION_METHODS: MethodInfo[] = [
  {
    id: 'Karachi',
    name: 'University of Islamic Sciences, Karachi',
    description: 'Fajr 18°, Isha 18°. Standard for Bangladesh, Pakistan, and South Asia.'
  },
  {
    id: 'MuslimWorldLeague',
    name: 'Muslim World League (MWL)',
    description: 'Fajr 18°, Isha 17°. Widely used across Europe, parts of Asia, and the Americas.'
  },
  {
    id: 'Egyptian',
    name: 'Egyptian General Authority of Survey',
    description: 'Fajr 19.5°, Isha 17.5°. Used across Egypt, Africa, and parts of the Middle East.'
  },
  {
    id: 'UmmAlQura',
    name: 'Umm al-Qura University, Makkah',
    description: 'Fajr 18.5°, Isha 90 min after Maghrib. Standard across Saudi Arabia and Gulf regions.'
  },
  {
    id: 'Dubai',
    name: 'Dubai',
    description: 'Fajr 18.2°, Isha 18.2°. Official calculation for Dubai and the UAE.'
  },
  {
    id: 'Qatar',
    name: 'Qatar',
    description: 'Fajr 18°, Isha 90 min after Maghrib. Official Qatar calendar.'
  },
  {
    id: 'Kuwait',
    name: 'Kuwait',
    description: 'Fajr 18°, Isha 17.5°. Official calculation for Kuwait.'
  },
  {
    id: 'Singapore',
    name: 'Majlis Ugama Islam Singapura (MUIS)',
    description: 'Fajr 20°, Isha 18°. Official calculation for Singapore and Southeast Asia.'
  },
  {
    id: 'NorthAmerica',
    name: 'ISNA (Islamic Society of North America)',
    description: 'Fajr 15°, Isha 15°. Common in the United States and Canada.'
  },
  {
    id: 'Turkey',
    name: 'Diyanet İşleri Başkanlığı',
    description: 'Official calculation for Turkey.'
  },
  {
    id: 'MoonsightingCommittee',
    name: 'Moonsighting Committee',
    description: 'Fajr 18°, Isha 18° with seasonal adjustments.'
  }
];

export function getCalculationParameters(methodId: string, asrMethod: AsrMethod): CalculationParameters {
  let params: CalculationParameters;

  switch (methodId) {
    case 'Karachi':
      params = CalculationMethod.Karachi();
      break;
    case 'MuslimWorldLeague':
      params = CalculationMethod.MuslimWorldLeague();
      break;
    case 'Egyptian':
      params = CalculationMethod.Egyptian();
      break;
    case 'UmmAlQura':
      params = CalculationMethod.UmmAlQura();
      break;
    case 'Dubai':
      params = CalculationMethod.Dubai();
      break;
    case 'Qatar':
      params = CalculationMethod.Qatar();
      break;
    case 'Kuwait':
      params = CalculationMethod.Kuwait();
      break;
    case 'Singapore':
      params = CalculationMethod.Singapore();
      break;
    case 'NorthAmerica':
      params = CalculationMethod.NorthAmerica();
      break;
    case 'Turkey':
      params = CalculationMethod.Turkey();
      break;
    case 'MoonsightingCommittee':
      params = CalculationMethod.MoonsightingCommittee();
      break;
    default:
      params = CalculationMethod.Karachi();
      break;
  }

  params.madhab = asrMethod === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;

  return params;
}

/**
 * Calculates prayer times for a given location, local date (YYYY-MM-DD), and settings.
 */
export function calculateDailySchedule(
  localDate: string,
  location: UserLocation,
  calculationMethod: string,
  asrMethod: AsrMethod,
  manualAdjustments: ManualAdjustments
): DailySchedule {
  const [yearStr, monthStr, dayStr] = localDate.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed month
  const day = parseInt(dayStr, 10);

  // Construct target local midday date
  const targetDate = new Date(Date.UTC(year, month, day, 12, 0, 0));

  const coords = new Coordinates(location.latitude, location.longitude);
  const params = getCalculationParameters(calculationMethod, asrMethod);

  const pt = new PrayerTimes(coords, targetDate, params);

  const scheduleId = `${location.id}_${localDate}`;

  const prayers: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const times: Record<PrayerKey, PrayerTimeItem> = {} as Record<PrayerKey, PrayerTimeItem>;

  for (const prayer of prayers) {
    const rawDate: Date = pt[prayer];
    const baseTimeISO = rawDate.toISOString();
    const adjustmentMinutes = manualAdjustments[prayer] ?? 0;

    const effectiveDate = new Date(rawDate.getTime() + adjustmentMinutes * 60 * 1000);
    const effectiveTimeISO = effectiveDate.toISOString();

    times[prayer] = {
      id: `${scheduleId}_${prayer}`,
      scheduleId,
      prayer,
      baseTime: baseTimeISO,
      adjustmentMinutes,
      effectiveTime: effectiveTimeISO
    };
  }

  return {
    id: scheduleId,
    localDate,
    locationId: location.id,
    calculationMethod,
    asrMethod,
    generatedAt: new Date().toISOString(),
    times,
    sunrise: pt.sunrise ? pt.sunrise.toISOString() : undefined,
    sunset: pt.sunset ? pt.sunset.toISOString() : pt.maghrib ? pt.maghrib.toISOString() : undefined
  };
}

/**
 * Format an ISO time string into clean local 12-hour time (e.g. "5:09 PM")
 */
export function formatPrayerTime(isoString: string, timeZoneId?: string): string {
  try {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    if (timeZoneId) {
      options.timeZone = timeZoneId;
    }
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    const d = new Date(isoString);
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
}

/**
 * Determines the next prayer, time difference, countdown, and progress.
 */
export function getNextPrayerInfo(
  currentSchedule: DailySchedule,
  tomorrowSchedule: DailySchedule,
  now: Date,
  timeZoneId?: string
): NextPrayerInfo {
  const prayerKeys: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const prayerNames: Record<PrayerKey, string> = {
    fajr: 'Fajr',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha'
  };

  const nowMs = now.getTime();

  // Find next upcoming prayer today
  for (let i = 0; i < prayerKeys.length; i++) {
    const key = prayerKeys[i];
    const item = currentSchedule.times[key];
    const prayerMs = new Date(item.effectiveTime).getTime();

    if (prayerMs > nowMs) {
      const diffMs = prayerMs - nowMs;
      const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      // Calculate progress between previous prayer (or start of day) and this prayer
      let prevMs: number;
      if (i === 0) {
        // Before Fajr: window starts around previous midnight or yesterday's Isha
        prevMs = prayerMs - 6 * 3600 * 1000;
      } else {
        const prevKey = prayerKeys[i - 1];
        prevMs = new Date(currentSchedule.times[prevKey].effectiveTime).getTime();
      }

      const totalWindowMs = Math.max(1, prayerMs - prevMs);
      const elapsedMs = Math.max(0, nowMs - prevMs);
      const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalWindowMs) * 100));

      return {
        key,
        name: prayerNames[key],
        effectiveDate: new Date(item.effectiveTime),
        timeString: formatPrayerTime(item.effectiveTime, timeZoneId),
        diffMs,
        hours,
        minutes,
        seconds,
        progressPercent,
        isNextDay: false
      };
    }
  }

  // All prayers today have passed: next prayer is tomorrow's Fajr!
  const tomorrowFajr = tomorrowSchedule.times.fajr;
  const tomorrowFajrMs = new Date(tomorrowFajr.effectiveTime).getTime();
  const todayIshaMs = new Date(currentSchedule.times.isha.effectiveTime).getTime();

  const diffMs = Math.max(0, tomorrowFajrMs - nowMs);
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const totalWindowMs = Math.max(1, tomorrowFajrMs - todayIshaMs);
  const elapsedMs = Math.max(0, nowMs - todayIshaMs);
  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalWindowMs) * 100));

  return {
    key: 'fajr',
    name: 'Fajr',
    effectiveDate: new Date(tomorrowFajr.effectiveTime),
    timeString: formatPrayerTime(tomorrowFajr.effectiveTime, timeZoneId),
    diffMs,
    hours,
    minutes,
    seconds,
    progressPercent,
    isNextDay: true
  };
}

/**
 * Formats seconds remaining as tabular HH:MM:SS
 */
export function formatCountdown(hours: number, minutes: number, seconds: number): string {
  const h = hours.toString().padStart(2, '0');
  const m = minutes.toString().padStart(2, '0');
  const s = seconds.toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * Returns today's YYYY-MM-DD for a specific timezone
 */
export function getLocalDateString(date: Date = new Date(), timeZoneId?: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: timeZoneId
    });
    return formatter.format(date); // en-CA gives YYYY-MM-DD format
  } catch {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Returns tomorrow's YYYY-MM-DD for a specific timezone
 */
export function getTomorrowLocalDateString(date: Date = new Date(), timeZoneId?: string): string {
  const tomorrow = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  return getLocalDateString(tomorrow, timeZoneId);
}

/**
 * Formats a local date string (YYYY-MM-DD) into display string like "SATURDAY, OCTOBER 10"
 */
export function formatHeaderDate(localDate: string, timeZoneId?: string): string {
  const [y, m, d] = localDate.split('-').map((v) => parseInt(v, 10));
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  };
  if (timeZoneId) {
    options.timeZone = timeZoneId;
  }
  return new Intl.DateTimeFormat('en-US', options).format(dateObj).toUpperCase();
}

/**
 * Formats a local date string into "Saturday, October 10" (Title Case)
 */
export function formatFullDate(localDate: string, timeZoneId?: string): string {
  const [y, m, d] = localDate.split('-').map((v) => parseInt(v, 10));
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  };
  if (timeZoneId) {
    options.timeZone = timeZoneId;
  }
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}
